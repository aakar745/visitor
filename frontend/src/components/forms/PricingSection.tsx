'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import { RegistrationFormData, Exhibition, PricingTier } from '@/types';
import { exhibitionsApi } from '@/lib/api/exhibitions';
import { Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateRangeShort, formatDateShort } from '@/lib/utils/dateFormatter';
import { cn } from '@/lib/utils';

interface PricingSectionProps {
  form: UseFormReturn<RegistrationFormData>;
  exhibition: Exhibition;
}

export function PricingSection({ form, exhibition }: PricingSectionProps) {
  const {
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = form;

  const selectedTierId = watch('pricingTierId');
  const selectedDays = watch('selectedDays') || [];
  
  // Track if auto-selection has run
  const hasAutoSelectedRef = useRef(false);
  
  // Memoize active tiers
  const activeTiers = useMemo(() => {
    return exhibitionsApi.getActivePricingTiers(exhibition);
  }, [exhibition]);

  // If not a paid exhibition, don't render pricing section
  if (!exhibition.isPaid) {
    return null;
  }

  // If no active pricing tiers, show error message
  if (activeTiers.length === 0) {
    return (
      <Card className="p-6 border-orange-200 bg-orange-50">
        <div className="flex items-start gap-3">
          <div className="text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <Label className="text-base font-semibold text-orange-900">No Active Pricing Tiers</Label>
            <p className="text-sm text-orange-700 mt-1">
              This exhibition has pricing tiers configured, but none are currently active. 
              The pricing tier dates may not include today's date.
            </p>
            <p className="text-xs text-orange-600 mt-2">
              Please contact the event organizer or check back during the pricing tier's active period.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  /**
   * Extract tier ID from tier object
   */
  const getTierId = (tier: PricingTier): string => {
    const id = tier.id || (tier as any)._id;
    return id ? String(id) : '';
  };

  /**
   * Calculate actual amount to pay based on user's selection
   */
  const calculateSelectedAmount = useCallback((tier: PricingTier, days: number[]): number => {
    if (tier.ticketType === 'full_access') {
      return tier.price;
    }
    
    // For day-wise tickets
    if (days.length === 0) {
      return 0;
    }
    
    // Check if "all sessions" is selected (represented as day number 0)
    if (days.includes(0)) {
      return tier.allSessionsPrice || 0;
    }
    
    // Calculate sum of selected days
    if (tier.dayPrices && tier.dayPrices.length > 0) {
      return tier.dayPrices
        .filter(day => day.isActive && days.includes(day.dayNumber))
        .reduce((sum, day) => sum + (day.price || 0), 0);
    }
    
    return 0;
  }, []);

  /**
   * Handle day selection toggle - stable callback with no dependencies
   */
  const handleDayToggle = useCallback((dayNumber: number, tier: PricingTier) => {
    const tierId = getTierId(tier);
    const currentTierId = getValues('pricingTierId');
    const currentDays = getValues('selectedDays') || [];
    
    // If selecting a different tier's day, switch to that tier first
    if (currentTierId !== tierId) {
      setValue('pricingTierId', tierId);
      setValue('selectedDays', [dayNumber]);
      return;
    }
    
    // If selecting "all sessions" (day 0), deselect individual days
    if (dayNumber === 0) {
      setValue('selectedDays', [0]);
      return;
    }
    
    // Toggle individual day
    const newSelection = currentDays.includes(dayNumber)
      ? currentDays.filter(d => d !== dayNumber && d !== 0) // Remove this day and "all sessions"
      : [...currentDays.filter(d => d !== 0), dayNumber]; // Add this day, remove "all sessions"
    
    setValue('selectedDays', newSelection);
  }, [setValue, getValues]);

  /**
   * Handle tier selection change - memoized with useCallback
   */
  const handleTierChange = useCallback((tierId: string) => {
    setValue('pricingTierId', tierId);
    setValue('selectedDays', []); // Reset day selection
  }, [setValue]);

  /**
   * Auto-select pricing tier if only one option is available (run once)
   */
  useEffect(() => {
    if (hasAutoSelectedRef.current) return; // Already ran
    
    if (activeTiers.length === 1 && !selectedTierId) {
      const tierId = getTierId(activeTiers[0]);
      if (tierId) {
        setValue('pricingTierId', tierId);
        
        // Auto-select all sessions for day-wise
        const tier = activeTiers[0];
        if (tier.ticketType === 'day_wise' && tier.allSessionsPrice) {
          setValue('selectedDays', [0]); // Select "all sessions"
        }
        
        hasAutoSelectedRef.current = true;
      }
    }
  }, [activeTiers, selectedTierId, setValue]);

  const selectedTier = useMemo(() => 
    activeTiers.find((tier) => {
      const tierId = getTierId(tier);
      return tierId === selectedTierId;
    }),
    [activeTiers, selectedTierId]
  );

  const totalAmount = useMemo(() => 
    selectedTier ? calculateSelectedAmount(selectedTier, selectedDays) : 0,
    [selectedTier, selectedDays, calculateSelectedAmount]
  );

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Pricing & Payment</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {activeTiers.length === 1 
            ? 'Your pricing tier has been automatically selected'
            : 'Choose your preferred pricing tier'}
        </p>
      </div>

      <RadioGroup
        value={selectedTierId || ''}
        onValueChange={handleTierChange}
        className="space-y-3"
      >
        {activeTiers.map((tier) => {
          const tierId = getTierId(tier);
          const isSelected = tierId === selectedTierId;
          
          return (
            <Card
              key={`pricing-tier-${tierId}`}
              className={cn(
                "relative transition-all",
                isSelected && "border-primary shadow-md ring-1 ring-primary"
              )}
            >
              <div className="p-3">
                {/* Tier Header */}
                <label 
                  htmlFor={tierId}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <RadioGroupItem 
                    value={tierId} 
                    id={tierId} 
                    className="flex-shrink-0" 
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-sm font-semibold truncate">
                        {tier.name}
                      </span>
                      {tier.ticketType === 'full_access' && (
                        <div className="flex items-center gap-0.5 text-lg font-bold text-primary flex-shrink-0">
                          <span className="text-sm">₹</span>
                          <span>{tier.price}</span>
                        </div>
                      )}
                    </div>

                    {tier.description && (
                      <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                        {tier.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        Valid: {formatDateRangeShort(tier.startDate, tier.endDate)}
                      </span>
                    </div>
                  </div>

                  {isSelected && tier.ticketType === 'full_access' && (
                    <div className="flex-shrink-0">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </label>

                {/* Day Selection (for day-wise tickets) */}
                {isSelected && tier.ticketType === 'day_wise' && (
                  <div className="mt-4 pl-8 space-y-2 border-t pt-3">
                    <Label className="text-sm font-medium">Select Days to Attend:</Label>
                    
                    {/* All Sessions Option */}
                    {tier.allSessionsPrice && tier.allSessionsPrice > 0 && (
                      <div 
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all",
                          selectedDays.includes(0) 
                            ? "border-primary bg-primary/5" 
                            : "border-gray-200 hover:border-primary/50"
                        )}
                      >
                        <Checkbox 
                          id={`all-sessions-${tierId}`}
                          checked={selectedDays.includes(0)}
                          onCheckedChange={() => handleDayToggle(0, tier)}
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`all-sessions-${tierId}`}
                            className="text-sm font-semibold cursor-pointer"
                          >
                            All Sessions
                          </label>
                          <p className="text-xs text-muted-foreground">Access to all days</p>
                        </div>
                        <div className="flex items-center gap-0.5 text-base font-bold text-primary">
                          <span className="text-xs">₹</span>
                          <span>{tier.allSessionsPrice}</span>
                        </div>
                      </div>
                    )}

                    {/* Individual Days */}
                    {tier.dayPrices && tier.dayPrices.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Or select individual days:</Label>
                        {tier.dayPrices
                          .filter((day) => day.isActive)
                          .map((day) => {
                            const isDaySelected = selectedDays.includes(day.dayNumber) && !selectedDays.includes(0);
                            
                            return (
                              <div
                                key={`${tierId}-day-${day.dayNumber}`}
                                className={cn(
                                  "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all",
                                  isDaySelected
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/50"
                                )}
                              >
                                <Checkbox
                                  id={`day-${tierId}-${day.dayNumber}`}
                                  checked={isDaySelected}
                                  onCheckedChange={() => handleDayToggle(day.dayNumber, tier)}
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`day-${tierId}-${day.dayNumber}`}
                                    className="text-sm font-semibold cursor-pointer"
                                  >
                                    {day.dayName}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDateShort(day.date)}
                                    {day.description && ` • ${day.description}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-0.5 text-base font-bold text-primary">
                                  <span className="text-xs">₹</span>
                                  <span>{day.price}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </RadioGroup>

      {errors.pricingTierId && (
        <p className="text-xs text-red-500">{errors.pricingTierId.message}</p>
      )}

      {selectedTier && totalAmount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-semibold">Total Amount</p>
              <p className="text-xs text-muted-foreground">
                {selectedTier.ticketType === 'day_wise'
                  ? selectedDays.includes(0)
                    ? 'All sessions included'
                    : `${selectedDays.length} day(s) selected`
                  : 'Full access pass'}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-2xl font-bold text-primary">
              <span className="text-base">₹</span>
              <span>{totalAmount}</span>
            </div>
          </div>
        </Card>
      )}

      {selectedTier && selectedTier.ticketType === 'day_wise' && selectedDays.length === 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="p-3">
            <p className="text-sm text-orange-700">
              Please select at least one day or choose "All Sessions" to continue
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
