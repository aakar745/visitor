import React from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  DatePicker, 
  Switch, 
  Button, 
  Space, 
  Typography,
  Row,
  Col,
  Select,
  Divider,
  Modal
} from 'antd';
import { PlusOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs, { toBackendDate } from '../../utils/dayjs';
import type { PricingTier, DayPriceOption } from '../../types/exhibitions';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface PricingTierFormProps {
  value?: Omit<PricingTier, 'id' | 'currentCount'>[];
  onChange?: (tiers: Omit<PricingTier, 'id' | 'currentCount'>[]) => void;
  disabled?: boolean;
  registrationStartDate?: any;
  registrationEndDate?: any;
  exhibitionStartDate?: any;
  exhibitionEndDate?: any;
}

const PricingTierForm: React.FC<PricingTierFormProps> = ({
  value = [],
  onChange,
  disabled = false,
  registrationStartDate,
  registrationEndDate,
  exhibitionStartDate,
  exhibitionEndDate
}) => {
  const addTier = () => {
    const newTier: Omit<PricingTier, 'id' | 'currentCount'> = {
      name: '',
      description: '',
      price: 0,
      currency: 'INR',
      startDate: '', // User must select manually for full_access
      endDate: '',   // User must select manually for full_access
      isActive: true,
      ticketType: 'full_access'
    };

    onChange?.([...value, newTier]);
  };

  const removeTier = (index: number) => {
    const newTiers = value.filter((_, i) => i !== index);
    onChange?.(newTiers);
  };

  const updateTier = (index: number, field: keyof Omit<PricingTier, 'id' | 'currentCount'>, fieldValue: any) => {
    const newTiers = value.map((tier, i) => 
      i === index ? { ...tier, [field]: fieldValue } : tier
    );
    onChange?.(newTiers);
  };

  const validateTierDate = (date: any, isStartDate: boolean) => {
    if (!date || !registrationStartDate || !registrationEndDate) {
      return { valid: true, message: '' };
    }

    const tierDate = dayjs(date);
    const regStart = dayjs(registrationStartDate);
    const regEnd = dayjs(registrationEndDate);

    if (tierDate.isBefore(regStart)) {
      return {
        valid: false,
        message: `${isStartDate ? 'Start' : 'End'} date must be after registration opens`
      };
    }

    if (tierDate.isAfter(regEnd)) {
      return {
        valid: false,
        message: `${isStartDate ? 'Start' : 'End'} date must be before registration closes`
      };
    }

    return { valid: true, message: '' };
  };

  // Generate day options based on tier's own date range (or exhibition dates as fallback)
  const generateDayOptions = (tierStartDate?: string, tierEndDate?: string): DayPriceOption[] => {
    // Use tier dates if available, otherwise fallback to exhibition dates
    const startDate = tierStartDate || (exhibitionStartDate ? toBackendDate(dayjs(exhibitionStartDate)) : '');
    const endDate = tierEndDate || (exhibitionEndDate ? toBackendDate(dayjs(exhibitionEndDate)) : '');
    
    if (!startDate || !endDate) {
      return [];
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days: DayPriceOption[] = [];
    
    let currentDay = start;
    let dayNumber = 1;

    while (currentDay.isSameOrBefore(end, 'day')) {
      days.push({
        dayNumber,
        dayName: `Day ${dayNumber}`,
        date: currentDay.format('MMM D'),
        price: 0,
        isActive: true,
      });
      currentDay = currentDay.add(1, 'day');
      dayNumber++;
    }

    return days;
  };

  const updateDayPrice = (tierIndex: number, dayIndex: number, field: keyof DayPriceOption, fieldValue: any) => {
    const newTiers = value.map((tier, i) => {
      if (i !== tierIndex) return tier;
      
      const dayPrices = tier.dayPrices || generateDayOptions(tier.startDate, tier.endDate);
      const updatedDayPrices = dayPrices.map((day, dIndex) =>
        dIndex === dayIndex ? { ...day, [field]: fieldValue } : day
      );
      
      return { ...tier, dayPrices: updatedDayPrices };
    });
    
    onChange?.(newTiers);
  };

  // Regenerate day prices with confirmation if existing prices have been set
  const handleRegenerateDayPrices = (
    tierIndex: number, 
    newStartDate: string, 
    newEndDate: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    const tier = value[tierIndex];
    
    // Check if any day prices have been manually set (non-zero prices)
    // Also check if user has actually modified the prices (not just default zeros)
    const hasMeaningfulPrices = tier.dayPrices?.some(day => day.price > 0);
    
    // Only show confirmation if:
    // 1. There are meaningful prices set (> 0)
    // 2. The number of days will change (dates are different)
    const willChangeDayCount = tier.dayPrices && tier.startDate && tier.endDate &&
      (tier.startDate !== newStartDate || tier.endDate !== newEndDate);
    
    if (hasMeaningfulPrices && willChangeDayCount) {
      Modal.confirm({
        title: 'Regenerate Day Prices?',
        content: 'Changing the date range will regenerate all days and reset their prices. Are you sure you want to continue?',
        okText: 'Yes, Regenerate',
        okType: 'primary',
        cancelText: 'Keep Current Prices',
        onOk: () => {
          onConfirm();
        },
        onCancel: () => {
          // User wants to keep dates but not regenerate prices
          if (onCancel) onCancel();
        },
      });
    } else {
      // No meaningful prices set yet, regenerate without confirmation
      onConfirm();
    }
  };

  // Check if a specific date falls within any other tier's date range
  const isDateInOtherTier = (tierIndex: number, date: dayjs.Dayjs): boolean => {
    for (let i = 0; i < value.length; i++) {
      if (i === tierIndex) continue; // Skip self

      const tier = value[i];
      if (!tier.startDate || !tier.endDate) continue;

      const tierStart = dayjs(tier.startDate);
      const tierEnd = dayjs(tier.endDate);

      // Check if date falls within this tier's range (inclusive)
      if (date.isSameOrAfter(tierStart, 'day') && date.isSameOrBefore(tierEnd, 'day')) {
        return true;
      }
    }

    return false;
  };

  // Find the first available date range for a new tier
  const findAvailableDateRange = (tierIndex: number): { start: string | null; end: string | null } => {
    if (!exhibitionStartDate || !exhibitionEndDate) {
      return { start: null, end: null };
    }

    const exhStart = dayjs(exhibitionStartDate);
    const exhEnd = dayjs(exhibitionEndDate);
    
    // Find first available start date
    let availableStart: dayjs.Dayjs | null = null;
    let current = exhStart;
    
    while (current.isSameOrBefore(exhEnd, 'day')) {
      if (!isDateInOtherTier(tierIndex, current)) {
        availableStart = current;
        break;
      }
      current = current.add(1, 'day');
    }
    
    if (!availableStart) {
      return { start: null, end: null }; // No available dates
    }
    
    // Find the continuous available end date
    let availableEnd = availableStart;
    current = availableStart.add(1, 'day');
    
    while (current.isSameOrBefore(exhEnd, 'day')) {
      if (isDateInOtherTier(tierIndex, current)) {
        break; // Hit a taken date
      }
      availableEnd = current;
      current = current.add(1, 'day');
    }
    
    return {
      start: toBackendDate(availableStart),
      end: toBackendDate(availableEnd)
    };
  };

  // Validate for overlapping date ranges between tiers
  // Simplified overlap logic: Two ranges overlap if start1 <= end2 AND start2 <= end1
  const checkDateOverlap = (tierIndex: number, startDate: string, endDate: string): { hasOverlap: boolean; message: string } => {
    if (!startDate || !endDate) {
      return { hasOverlap: false, message: '' };
    }

    const newStart = dayjs(startDate);
    const newEnd = dayjs(endDate);

    for (let i = 0; i < value.length; i++) {
      if (i === tierIndex) continue; // Skip self

      const tier = value[i];
      if (!tier.startDate || !tier.endDate) continue;

      const existingStart = dayjs(tier.startDate);
      const existingEnd = dayjs(tier.endDate);

      // Simplified overlap check: ranges overlap if start1 <= end2 AND start2 <= end1
      const hasOverlap = newStart.isSameOrBefore(existingEnd) && existingStart.isSameOrBefore(newEnd);

      if (hasOverlap) {
        return {
          hasOverlap: true,
          message: `Date range overlaps with "${tier.name || 'Tier ' + (i + 1)}"`
        };
      }
    }

    return { hasOverlap: false, message: '' };
  };

  const getTierColor = (index: number) => {
    const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
    return colors[index % colors.length];
  };

  const suggestedTiers = [
    { name: 'Early Bird', price: 100, description: 'Limited time offer' },
    { name: 'Regular', price: 150, description: 'Standard pricing' },
    { name: 'Onsite', price: 200, description: 'Walk-in registration' }
  ];

  const addSuggestedTier = (suggested: typeof suggestedTiers[0]) => {
    const newTier: Omit<PricingTier, 'id' | 'currentCount'> = {
      name: suggested.name,
      description: suggested.description,
      price: suggested.price,
      currency: 'INR',
      startDate: '',
      endDate: '',
      isActive: true,
      ticketType: 'full_access'
    };
    onChange?.([...value, newTier]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <DollarOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            Pricing Tiers
          </Title>
          <Text type="secondary">Set up different pricing phases for registration</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={addTier}
          disabled={disabled}
        >
          Add Tier
        </Button>
      </div>

      {/* Registration Period Info */}
      {registrationStartDate && registrationEndDate && (
        <Card 
          size="small" 
          style={{ marginBottom: '16px', background: '#e6f7ff', borderColor: '#1890ff' }}
        >
          <Text style={{ fontSize: '13px' }}>
            <strong>📅 Registration Period:</strong> {dayjs(registrationStartDate).format('DD/MM/YYYY HH:mm')} → {dayjs(registrationEndDate).format('DD/MM/YYYY HH:mm')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            All pricing tier dates must be within this period. Multiple tiers cannot have overlapping date ranges.
          </Text>
          <br />
          {exhibitionStartDate && exhibitionEndDate && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>Exhibition Dates:</strong> {dayjs(exhibitionStartDate).format('DD/MM/YYYY')} - {dayjs(exhibitionEndDate).format('DD/MM/YYYY')}
            </Text>
          )}
        </Card>
      )}

      {/* Suggested Tiers - only show when no tiers exist */}
      {value.length === 0 && (
        <Card 
          size="small" 
          style={{ marginBottom: '16px', backgroundColor: '#f9f9f9' }}
          title="Quick Setup"
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
            Add common pricing tiers:
          </Text>
          <Space wrap>
            {suggestedTiers.map((tier) => (
              <Button 
                key={tier.name}
                size="small"
                onClick={() => addSuggestedTier(tier)}
                disabled={disabled}
              >
                {tier.name} (₹{tier.price})
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* Pricing Tier Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {value.map((tier, index) => (
          <Card
            key={index}
            size="small"
            style={{ 
              border: `2px solid ${getTierColor(index)}`,
              backgroundColor: 'white'
            }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: getTierColor(index),
                      borderRadius: '50%'
                    }}
                  />
                  <Text strong>
                    {tier.name || `Pricing Tier ${index + 1}`}
                  </Text>
                </div>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={() => removeTier(index)}
                  disabled={disabled}
                />
              </div>
            }
          >
            <Row gutter={[12, 8]}>
              {/* Tier Name */}
              <Col xs={24} sm={8}>
                <Form.Item label="Tier Name" style={{ marginBottom: '8px' }} required>
                  <Input
                    placeholder="e.g., Early Bird"
                    value={tier.name}
                    onChange={(e) => updateTier(index, 'name', e.target.value)}
                    disabled={disabled}
                    size="middle"
                  />
                </Form.Item>
              </Col>

              {/* Ticket Type Toggle */}
              <Col xs={24} sm={8}>
                <Form.Item label="Ticket Type" style={{ marginBottom: '8px' }} required>
                  <Select
                    value={tier.ticketType || 'full_access'}
                    onChange={(selectedType) => {
                      // Batch all updates together to prevent multiple re-renders
                      const updatedTier = { ...tier, ticketType: selectedType };
                      
                      if (selectedType === 'day_wise') {
                        // Smart auto-populate: Default to available exhibition dates
                        // Note: Users can manually change these to any available dates later
                        if (!tier.startDate || !tier.endDate) {
                          const availableDates = findAvailableDateRange(index);
                          if (availableDates.start && availableDates.end) {
                            // Found available continuous date range (prioritize exhibition dates)
                            updatedTier.startDate = availableDates.start;
                            updatedTier.endDate = availableDates.end;
                          } else if (!tier.startDate && exhibitionStartDate) {
                            // Fallback: Auto-fill with exhibition dates as default
                            updatedTier.startDate = toBackendDate(dayjs(exhibitionStartDate));
                            updatedTier.endDate = exhibitionEndDate ? toBackendDate(dayjs(exhibitionEndDate)) : '';
                          }
                        }
                        
                        // Generate day prices based on tier dates
                        if (!tier.dayPrices && updatedTier.startDate && updatedTier.endDate) {
                          updatedTier.dayPrices = generateDayOptions(updatedTier.startDate, updatedTier.endDate);
                        }
                      }
                      
                      // Single update with all changes
                      const newTiers = [...value];
                      newTiers[index] = updatedTier;
                      onChange?.(newTiers);
                    }}
                    disabled={disabled}
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="full_access">Full Access</Select.Option>
                    <Select.Option value="day_wise">Day-wise</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Price (only for full_access) */}
              {tier.ticketType === 'full_access' && (
                <Col xs={24} sm={8}>
                  <Form.Item label="Price (₹)" style={{ marginBottom: '8px' }} required>
                    <InputNumber
                      placeholder="0"
                      value={tier.price}
                      onChange={(value) => updateTier(index, 'price', value || 0)}
                      min={0}
                      style={{ width: '100%' }}
                      disabled={disabled}
                      size="middle"
                    />
                  </Form.Item>
                </Col>
              )}

              {/* Description (only for full_access) */}
              {tier.ticketType === 'full_access' && (
                <Col xs={24}>
                  <Form.Item label="Description" style={{ marginBottom: '8px' }}>
                    <TextArea
                      placeholder="Brief description..."
                      value={tier.description}
                      onChange={(e) => updateTier(index, 'description', e.target.value)}
                      rows={2}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
              )}

              {/* Date Range */}
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Start Date" 
                  style={{ marginBottom: '12px' }}
                  required
                  validateStatus={
                    tier.startDate && !validateTierDate(tier.startDate, true).valid ? 'error' : 
                    tier.startDate && tier.endDate && checkDateOverlap(index, tier.startDate, tier.endDate).hasOverlap ? 'error' : ''
                  }
                  help={
                    tier.startDate && !validateTierDate(tier.startDate, true).valid 
                      ? validateTierDate(tier.startDate, true).message 
                      : tier.startDate && tier.endDate && checkDateOverlap(index, tier.startDate, tier.endDate).hasOverlap
                        ? checkDateOverlap(index, tier.startDate, tier.endDate).message
                        : ''
                  }
                >
                  <DatePicker
                    placeholder="Select start date"
                    value={tier.startDate ? dayjs(tier.startDate) : null}
                    onChange={(date) => {
                      const newStartDate = date ? toBackendDate(date) : '';
                      
                      // For Day-wise: handle date change with price regeneration
                      if (tier.ticketType === 'day_wise' && newStartDate && tier.endDate) {
                        // Always update the date first
                        const updatedTier = { ...tier, startDate: newStartDate };
                        const newTiers = [...value];
                        newTiers[index] = updatedTier;
                        
                        // Check if we need to regenerate prices
                        handleRegenerateDayPrices(index, newStartDate, tier.endDate, () => {
                          // Regenerate prices
                          const regeneratedPrices = generateDayOptions(newStartDate, tier.endDate);
                          updatedTier.dayPrices = regeneratedPrices;
                          newTiers[index] = updatedTier;
                          onChange?.(newTiers);
                        }, () => {
                          // User cancelled regeneration, just update the date
                          onChange?.(newTiers);
                        });
                      } else {
                        // For Full Access or when dates are incomplete, just update the date
                        updateTier(index, 'startDate', newStartDate);
                      }
                    }}
                    style={{ width: '100%' }}
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    disabled={disabled}
                    disabledDate={(current) => {
                      if (!current) return false;
                      
                      // Both Day-wise and Full Access can select from entire registration period
                      // Only disable dates that are already taken by other tiers
                      if (registrationStartDate && registrationEndDate) {
                        if (current.isBefore(dayjs(registrationStartDate), 'day') || 
                            current.isAfter(dayjs(registrationEndDate), 'day')) {
                          return true;
                        }
                      }
                      
                      // ALWAYS check: Disable dates that fall within other tiers' date ranges
                      return isDateInOtherTier(index, current);
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item 
                  label="End Date" 
                  style={{ marginBottom: '12px' }}
                  required
                  validateStatus={
                    tier.endDate && !validateTierDate(tier.endDate, false).valid ? 'error' : 
                    tier.startDate && tier.endDate && checkDateOverlap(index, tier.startDate, tier.endDate).hasOverlap ? 'error' : ''
                  }
                  help={
                    tier.endDate && !validateTierDate(tier.endDate, false).valid 
                      ? validateTierDate(tier.endDate, false).message 
                      : tier.startDate && tier.endDate && checkDateOverlap(index, tier.startDate, tier.endDate).hasOverlap
                        ? checkDateOverlap(index, tier.startDate, tier.endDate).message
                        : ''
                  }
                >
                  <DatePicker
                    placeholder="Select end date"
                    value={tier.endDate ? dayjs(tier.endDate) : null}
                    onChange={(date) => {
                      const newEndDate = date ? toBackendDate(date) : '';
                      
                      // For Day-wise: handle date change with price regeneration
                      if (tier.ticketType === 'day_wise' && tier.startDate && newEndDate) {
                        // Always update the date first
                        const updatedTier = { ...tier, endDate: newEndDate };
                        const newTiers = [...value];
                        newTiers[index] = updatedTier;
                        
                        // Check if we need to regenerate prices
                        handleRegenerateDayPrices(index, tier.startDate, newEndDate, () => {
                          // Regenerate prices
                          const regeneratedPrices = generateDayOptions(tier.startDate, newEndDate);
                          updatedTier.dayPrices = regeneratedPrices;
                          newTiers[index] = updatedTier;
                          onChange?.(newTiers);
                        }, () => {
                          // User cancelled regeneration, just update the date
                          onChange?.(newTiers);
                        });
                      } else {
                        // For Full Access or when dates are incomplete, just update the date
                        updateTier(index, 'endDate', newEndDate);
                      }
                    }}
                    style={{ width: '100%' }}
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    disabled={disabled}
                    disabledDate={(current) => {
                      if (!current) return false;
                      
                      // Both Day-wise and Full Access can select from entire registration period
                      // End date must be after the tier's start date
                      if (registrationStartDate && registrationEndDate) {
                        const tierStart = tier.startDate ? dayjs(tier.startDate) : dayjs(registrationStartDate);
                        if (current.isBefore(tierStart, 'day') || 
                            current.isAfter(dayjs(registrationEndDate), 'day')) {
                          return true;
                        }
                      }
                      
                      // ALWAYS check: Disable dates that fall within other tiers' date ranges
                      return isDateInOtherTier(index, current);
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Day-wise Pricing Section */}
              {tier.ticketType === 'day_wise' && (
                <>
                  <Col xs={24}>
                    <Divider style={{ margin: '8px 0' }}>Day-wise Pricing</Divider>
                    {tier.startDate && tier.endDate && (
                      <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#f0f5ff', borderRadius: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          💡 Days are generated based on the tier dates above. Change the dates to regenerate days.
                        </Text>
                      </div>
                    )}
                  </Col>

                  {(tier.dayPrices || generateDayOptions(tier.startDate, tier.endDate)).map((day, dayIndex) => (
                    <React.Fragment key={dayIndex}>
                      <Col xs={24} sm={5}>
                        <Form.Item label={`${day.dayName} (${day.date})`} style={{ marginBottom: '8px' }}>
                          <InputNumber
                            placeholder="Price"
                            value={day.price}
                            onChange={(val) => updateDayPrice(index, dayIndex, 'price', val || 0)}
                            min={0}
                            style={{ width: '100%' }}
                            disabled={disabled || !day.isActive}
                            size="middle"
                            prefix="₹"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={5}>
                        <Form.Item label="Description" style={{ marginBottom: '8px' }}>
                          <Input
                            placeholder="Optional"
                            value={day.description || ''}
                            onChange={(e) => updateDayPrice(index, dayIndex, 'description', e.target.value)}
                            disabled={disabled || !day.isActive}
                            size="middle"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={2}>
                        <Form.Item label="Active" style={{ marginBottom: '8px' }}>
                          <Switch
                            checked={day.isActive}
                            onChange={(checked) => updateDayPrice(index, dayIndex, 'isActive', checked)}
                            disabled={disabled}
                            size="small"
                          />
                        </Form.Item>
                      </Col>
                    </React.Fragment>
                  ))}

                  {/* All Sessions Option - Only show when there are 2+ days */}
                  {(() => {
                    const dayPrices = tier.dayPrices || generateDayOptions(tier.startDate, tier.endDate);
                    const numberOfDays = dayPrices.length;
                    
                    // Only show "All Sessions" if there are multiple days
                    if (numberOfDays <= 1) {
                      return null;
                    }
                    
                    return (
                      <>
                        <Col xs={24} sm={5}>
                          <Form.Item label="All Sessions" style={{ marginBottom: '8px' }}>
                            <InputNumber
                              placeholder="Full pass price"
                              value={tier.allSessionsPrice || 0}
                              onChange={(val) => updateTier(index, 'allSessionsPrice', val || 0)}
                              min={0}
                              style={{ width: '100%' }}
                              disabled={disabled}
                              size="middle"
                              prefix="₹"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={5}>
                          <Form.Item label="Description" style={{ marginBottom: '8px' }}>
                            <Input
                              placeholder="e.g., Best value"
                              disabled={disabled}
                              size="middle"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={2}>
                          <Form.Item label="Active" style={{ marginBottom: '8px' }}>
                            <Switch
                              checked={true}
                              disabled={disabled}
                              size="small"
                            />
                          </Form.Item>
                        </Col>
                      </>
                    );
                  })()}
                </>
              )}

              {/* Active Toggle */}
              <Col xs={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Switch
                    checked={tier.isActive}
                    onChange={(checked) => updateTier(index, 'isActive', checked)}
                    disabled={disabled}
                    size="small"
                  />
                  <Text style={{ fontSize: '13px' }}>Tier Active</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    (Users can register with this tier)
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        ))}
      </div>

      {value.length === 0 && (
        <Card
          style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            border: '2px dashed #d9d9d9',
            backgroundColor: '#fafafa'
          }}
        >
          <DollarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#8c8c8c', marginBottom: '8px' }}>
            No Pricing Tiers Added
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            Add pricing tiers to enable paid registration for this exhibition
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={addTier} disabled={disabled}>
            Add Your First Tier
          </Button>
        </Card>
      )}
    </div>
  );
};

export default PricingTierForm;
