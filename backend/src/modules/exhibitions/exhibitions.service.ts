import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exhibition, ExhibitionDocument, ExhibitionStatus } from '../../database/schemas/exhibition.schema';
import { ExhibitionRegistration, ExhibitionRegistrationDocument } from '../../database/schemas/exhibition-registration.schema';
import { CreateExhibitionDto, UpdateExhibitionDto, QueryExhibitionDto, UpdateStatusDto } from './dto';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { sanitizePagination } from '../../common/constants/pagination.constants';
import { generateSlugWithSuffix } from '../../common/utils/slug.util';

@Injectable()
export class ExhibitionsService {
  private readonly logger = new Logger(ExhibitionsService.name);

  constructor(
    @InjectModel(Exhibition.name) private exhibitionModel: Model<ExhibitionDocument>,
    @InjectModel(ExhibitionRegistration.name) private registrationModel: Model<ExhibitionRegistrationDocument>,
  ) {}

  /**
   * Generate URL-friendly slug from exhibition name
   * 
   * SECURITY FIX (BUG-013): Now uses shared utility with proper transliteration
   * Handles unicode, accented characters, and prevents empty slugs
   */
  private generateSlug(name: string, suffix?: string): string {
    return generateSlugWithSuffix(name, suffix);
  }

  /**
   * Ensure slug is unique
   */
  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const query: any = { slug: uniqueSlug };
      if (excludeId) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const existing = await this.exhibitionModel.findOne(query);
      if (!existing) {
        return uniqueSlug;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  /**
   * Validate exhibition dates
   * 
   * SECURITY FIX (BUG-014): Now validates against past dates
   * Ensures exhibitions can only be created with future dates
   */
  private validateDates(dto: CreateExhibitionDto | UpdateExhibitionDto, isUpdate: boolean = false): void {
    const { registrationStartDate, registrationEndDate, onsiteStartDate, onsiteEndDate, paidStartDate, paidEndDate, isPaid } = dto;
    
    // Get current date (start of today, ignoring time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // SECURITY FIX (BUG-014): Validate dates are not in the past
    // For new exhibitions, all dates must be in the future
    // For updates, we're more lenient (exhibition might already be ongoing)
    if (!isUpdate) {
      // For new exhibitions, registration should start today or in the future
      if (registrationStartDate) {
        const regStart = new Date(registrationStartDate);
        regStart.setHours(0, 0, 0, 0);
        
        if (regStart < today) {
          throw new BadRequestException(
            'Registration start date cannot be in the past. Please select today or a future date.'
          );
        }
      }

      // Onsite start date should be in the future
      if (onsiteStartDate) {
        const onsiteStart = new Date(onsiteStartDate);
        onsiteStart.setHours(0, 0, 0, 0);
        
        if (onsiteStart < today) {
          throw new BadRequestException(
            'Exhibition onsite start date cannot be in the past. Please select today or a future date.'
          );
        }
      }
    }

    // Registration dates validation (relative)
    if (registrationStartDate && registrationEndDate) {
      if (new Date(registrationStartDate) >= new Date(registrationEndDate)) {
        throw new BadRequestException('Registration start date must be before end date');
      }
    }

    // Onsite dates validation (relative)
    if (onsiteStartDate && onsiteEndDate) {
      if (new Date(onsiteStartDate) >= new Date(onsiteEndDate)) {
        throw new BadRequestException('Onsite start date must be before end date');
      }
    }

    // Logical validation: Registration can continue until exhibition ends
    // - Registrations before exhibition starts = Pre-Registration
    // - Registrations during exhibition = On-Site Registration
    if (registrationEndDate && onsiteEndDate) {
      const regEnd = new Date(registrationEndDate);
      const exhibitionEnd = new Date(onsiteEndDate);
      
      // Normalize to compare dates only
      regEnd.setHours(0, 0, 0, 0);
      exhibitionEnd.setHours(0, 0, 0, 0);
      
      // Registration can stay open until the last day of exhibition
      if (regEnd > exhibitionEnd) {
        throw new BadRequestException(
          'Registration end date cannot be after the exhibition ends. ' +
          'Registrations can be accepted until the last day of the exhibition.'
        );
      }
    }
    
    // Ensure registration starts before exhibition starts (optional check)
    if (registrationStartDate && onsiteStartDate) {
      const regStart = new Date(registrationStartDate);
      const exhibitionStart = new Date(onsiteStartDate);
      
      regStart.setHours(0, 0, 0, 0);
      exhibitionStart.setHours(0, 0, 0, 0);
      
      // Warning: Registration should typically start before exhibition (but not mandatory)
      // This is just a logical check, not enforced
    }

    // Paid dates validation
    if (isPaid && paidStartDate && paidEndDate) {
      if (new Date(paidStartDate) >= new Date(paidEndDate)) {
        throw new BadRequestException('Paid period start date must be before end date');
      }

      // Paid period should be within or before registration period
      if (registrationStartDate && paidStartDate) {
        if (new Date(paidStartDate) < new Date(registrationStartDate)) {
          throw new BadRequestException(
            'Paid period cannot start before registration opens'
          );
        }
      }
    }

    // Pricing tiers validation
    if (isPaid && dto.pricingTiers) {
      for (const tier of dto.pricingTiers) {
        // Tier date range validation
        if (new Date(tier.startDate) >= new Date(tier.endDate)) {
          throw new BadRequestException(`Pricing tier "${tier.name}" has invalid date range`);
        }

        // SECURITY FIX (BUG-014): Pricing tier dates should not be in the past for new exhibitions
        if (!isUpdate) {
          const tierStart = new Date(tier.startDate);
          tierStart.setHours(0, 0, 0, 0);
          
          if (tierStart < today) {
            throw new BadRequestException(
              `Pricing tier "${tier.name}" has a start date in the past. ` +
              'All pricing tiers must have future dates for new exhibitions.'
            );
          }
        }

        // Validate day prices if ticketType is day_wise
        if (tier.ticketType === 'day_wise' && (!tier.dayPrices || tier.dayPrices.length === 0)) {
          throw new BadRequestException(`Pricing tier "${tier.name}" is set as day_wise but has no day prices`);
        }
      }
    }
  }

  /**
   * Create a new exhibition
   */
  async create(createExhibitionDto: CreateExhibitionDto, userId?: string): Promise<Exhibition> {
    // Validate dates (isUpdate = false for creation)
    this.validateDates(createExhibitionDto, false);

    // Generate unique slug
    const baseSlug = this.generateSlug(createExhibitionDto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Check if exhibition with same name already exists
    const existing = await this.exhibitionModel.findOne({ 
      name: { $regex: new RegExp(`^${createExhibitionDto.name}$`, 'i') } 
    });
    if (existing) {
      throw new ConflictException('An exhibition with this name already exists');
    }

    // Create exhibition
    const exhibition = new this.exhibitionModel({
      ...createExhibitionDto,
      slug,
      currentRegistrations: 0,
      status: ExhibitionStatus.DRAFT,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });

    return exhibition.save();
  }

  /**
   * Find all exhibitions with pagination and filters
   */
  async findAll(query: QueryExhibitionDto): Promise<{
    exhibitions: Exhibition[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Sanitize and enforce pagination limits (defense in depth)
    const { page, limit } = sanitizePagination(query.page, query.limit);
    const { search, status, isPaid, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: any = {};

    // Search filter
    if (search) {
      const sanitized = sanitizeSearch(search);
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { tagline: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { venue: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status.length > 0) {
      filter.status = { $in: status };
    }

    // Paid filter
    if (isPaid !== undefined) {
      filter.isPaid = isPaid;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.onsiteStartDate = {};
      if (startDate) {
        filter.onsiteStartDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.onsiteStartDate.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [exhibitions, total] = await Promise.all([
      this.exhibitionModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.exhibitionModel.countDocuments(filter),
    ]);

    return {
      exhibitions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single exhibition by ID
   */
  async findOne(id: string): Promise<Exhibition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    return exhibition;
  }

  /**
   * Find exhibition by slug
   */
  async findBySlug(slug: string): Promise<Exhibition> {
    const exhibition = await this.exhibitionModel.findOne({ slug }).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with slug "${slug}" not found`);
    }

    return exhibition;
  }

  /**
   * Update exhibition
   */
  async update(id: string, updateExhibitionDto: UpdateExhibitionDto, userId?: string): Promise<Exhibition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    // Validate dates if provided - merge existing data for context
    if (Object.keys(updateExhibitionDto).some(key => 
      ['registrationStartDate', 'registrationEndDate', 'onsiteStartDate', 'onsiteEndDate', 'paidStartDate', 'paidEndDate', 'isPaid', 'pricingTiers'].includes(key)
    )) {
      // Create merged data, ensuring dates are properly formatted
      const existingData = exhibition.toObject();
      const mergedData = {
        registrationStartDate: updateExhibitionDto.registrationStartDate || existingData.registrationStartDate,
        registrationEndDate: updateExhibitionDto.registrationEndDate || existingData.registrationEndDate,
        onsiteStartDate: updateExhibitionDto.onsiteStartDate || existingData.onsiteStartDate,
        onsiteEndDate: updateExhibitionDto.onsiteEndDate || existingData.onsiteEndDate,
        isPaid: updateExhibitionDto.isPaid !== undefined ? updateExhibitionDto.isPaid : existingData.isPaid,
        paidStartDate: updateExhibitionDto.paidStartDate || existingData.paidStartDate,
        paidEndDate: updateExhibitionDto.paidEndDate || existingData.paidEndDate,
        pricingTiers: updateExhibitionDto.pricingTiers || existingData.pricingTiers,
      };
      this.validateDates(mergedData as any, true);
    }

    // Prepare update data with internal fields
    const updateData: any = { ...updateExhibitionDto };

    // Update slug if name changed
    if (updateExhibitionDto.name && updateExhibitionDto.name !== exhibition.name) {
      const baseSlug = this.generateSlug(updateExhibitionDto.name);
      updateData.slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    // Add updatedBy
    if (userId) {
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.exhibitionModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    return updated!;
  }

  /**
   * Update exhibition status
   */
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, userId?: string): Promise<Exhibition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    const updateData: any = { 
      status: updateStatusDto.status 
    };

    if (userId) {
      updateData.updatedBy = new Types.ObjectId(userId);
    }

    const updated = await this.exhibitionModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    return updated!;
  }

  /**
   * Delete exhibition
   * 
   * SECURITY FIX (BUG-008):
   * Queries actual registration count from database instead of relying on cached counter.
   * Prevents data integrity issues if cached count is out of sync.
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    // BUG-008 FIX: Query ACTUAL registration count from database
    // Don't rely on cached 'currentRegistrations' field which may be out of sync
    const actualRegistrationCount = await this.registrationModel
      .countDocuments({ 
        exhibitionId: new Types.ObjectId(id),
        // Only count active registrations (not cancelled)
        status: { $ne: 'cancelled' }
      })
      .exec();

    if (actualRegistrationCount > 0) {
      this.logger.warn(
        `Deletion blocked for exhibition ${id}: ${actualRegistrationCount} active registration(s) exist ` +
        `(cached count was: ${exhibition.currentRegistrations || 0})`
      );
      
      throw new BadRequestException(
        `Cannot delete exhibition with ${actualRegistrationCount} existing registration(s). ` +
        'Please cancel all registrations or archive the exhibition instead.'
      );
    }

    // Additional safety check: Log if counts don't match (data integrity issue)
    if (exhibition.currentRegistrations !== actualRegistrationCount) {
      this.logger.warn(
        `Data integrity issue: Exhibition ${id} has cached count ${exhibition.currentRegistrations} ` +
        `but actual count is ${actualRegistrationCount}. Consider running data sync job.`
      );
    }

    await this.exhibitionModel.findByIdAndDelete(id).exec();
    this.logger.log(`Exhibition ${id} (${exhibition.name}) deleted successfully`);
  }

  /**
   * Duplicate an exhibition
   */
  async duplicate(id: string, newName: string, userId?: string): Promise<Exhibition> {
    // Validate input
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    if (!newName || typeof newName !== 'string') {
      throw new BadRequestException('Exhibition name is required');
    }

    // Trim and validate name length
    const trimmedName = newName.trim();
    if (trimmedName.length < 3) {
      throw new BadRequestException('Exhibition name must be at least 3 characters long');
    }

    if (trimmedName.length > 200) {
      throw new BadRequestException('Exhibition name must not exceed 200 characters');
    }

    const original = await this.exhibitionModel.findById(id).exec();
    if (!original) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    // Generate unique slug for duplicated exhibition
    const baseSlug = this.generateSlug(trimmedName);
    const slug = await this.ensureUniqueSlug(baseSlug);

    // Create duplicate
    const duplicated = new this.exhibitionModel({
      ...original.toObject(),
      _id: undefined,
      name: trimmedName,
      slug,
      status: ExhibitionStatus.DRAFT,
      currentRegistrations: 0,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return duplicated.save();
  }

  /**
   * Get exhibition statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    paid: number;
    free: number;
    totalRegistrations: number;
  }> {
    const [total, statusCounts, paidCount, registrationSum] = await Promise.all([
      this.exhibitionModel.countDocuments(),
      this.exhibitionModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.exhibitionModel.countDocuments({ isPaid: true }),
      this.exhibitionModel.aggregate([
        { $group: { _id: null, total: { $sum: '$currentRegistrations' } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((item: any) => {
      byStatus[item._id] = item.count;
    });

    return {
      total,
      byStatus,
      paid: paidCount,
      free: total - paidCount,
      totalRegistrations: registrationSum[0]?.total || 0,
    };
  }

  /**
   * Get exhibition analytics
   */
  async getAnalytics(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    // TODO: Implement detailed analytics with registration data
    // This will require querying the exhibition_registrations collection
    return {
      exhibitionId: id,
      totalRegistrations: exhibition.currentRegistrations || 0,
      pricingTiers: exhibition.pricingTiers.map(tier => ({
        name: tier.name,
        sold: tier.currentCount || 0,
        capacity: null, // Unlimited registrations
        revenue: (tier.currentCount || 0) * tier.price,
      })),
    };
  }

  /**
   * Get registration statistics for a specific exhibition
   */
  async getExhibitionStats(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(id).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    // Get registration counts by status
    const registrationsByStatus = await this.registrationModel.aggregate([
      { $match: { exhibitionId: new Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get registration counts by category
    const registrationsByCategory = await this.registrationModel.aggregate([
      { $match: { exhibitionId: new Types.ObjectId(id) } },
      { $group: { _id: '$registrationCategory', count: { $sum: 1 } } },
    ]);

    // Get payment statistics
    const paymentStats = await this.registrationModel.aggregate([
      { $match: { exhibitionId: new Types.ObjectId(id) } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amountPaid' },
        },
      },
    ]);

    // Get check-in statistics
    const checkInStats = await this.registrationModel.aggregate([
      { $match: { exhibitionId: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          checkedIn: {
            $sum: { $cond: [{ $ifNull: ['$checkInTime', false] }, 1, 0] },
          },
          checkedOut: {
            $sum: { $cond: [{ $ifNull: ['$checkOutTime', false] }, 1, 0] },
          },
        },
      },
    ]);

    const statusMap = registrationsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const categoryMap = registrationsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const paymentMap = paymentStats.reduce((acc, item) => {
      acc[item._id || 'free'] = { count: item.count, revenue: item.totalAmount || 0 };
      return acc;
    }, {});

    const checkIn = checkInStats[0] || { totalRegistrations: 0, checkedIn: 0, checkedOut: 0 };

    // Calculate registration counts by status
    const confirmedCount = statusMap['confirmed'] || 0;
    const registeredCount = statusMap['registered'] || 0;
    const cancelledCount = statusMap['cancelled'] || 0;
    const waitlistedCount = statusMap['waitlisted'] || 0;

    // Calculate payment-related counts
    const paidCount = paymentMap['completed']?.count || 0;
    const pendingPaymentCount = paymentMap['pending']?.count || 0;
    const totalRevenue = Object.values(paymentMap).reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);

    return {
      exhibitionId: id,
      totalRegistrations: checkIn.totalRegistrations,
      confirmedRegistrations: confirmedCount,
      paidRegistrations: paidCount,
      freeRegistrations: checkIn.totalRegistrations - paidCount - pendingPaymentCount,
      cancelledRegistrations: cancelledCount,
      waitlistedRegistrations: waitlistedCount,
      checkInCount: checkIn.checkedIn,
      noShowCount: checkIn.totalRegistrations - checkIn.checkedIn,
      revenue: totalRevenue,
      registrationsByCategory: categoryMap,
      byStatus: statusMap,
      byCategory: categoryMap,
      payment: paymentMap,
      checkIn: {
        total: checkIn.checkedIn,
        percentage: checkIn.totalRegistrations > 0
          ? Math.round((checkIn.checkedIn / checkIn.totalRegistrations) * 100)
          : 0,
      },
      checkOut: {
        total: checkIn.checkedOut,
        percentage: checkIn.checkedIn > 0
          ? Math.round((checkIn.checkedOut / checkIn.checkedIn) * 100)
          : 0,
      },
    };
  }

  /**
   * Get all registrations for a specific exhibition
   */
  async getExhibitionRegistrations(
    exhibitionId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      paymentStatus?: string;
    } = {},
  ): Promise<any> {
    if (!Types.ObjectId.isValid(exhibitionId)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibition = await this.exhibitionModel.findById(exhibitionId).exec();
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${exhibitionId} not found`);
    }

    const { page, limit } = sanitizePagination(options.page, options.limit);

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { exhibitionId: new Types.ObjectId(exhibitionId) };
    if (options.status) filter.status = options.status;
    if (options.category) filter.registrationCategory = options.category;
    if (options.paymentStatus) filter.paymentStatus = options.paymentStatus;

    // Execute query
    const [registrations, total] = await Promise.all([
      this.registrationModel
        .find(filter)
        .populate('visitorId') // Get ALL visitor fields (including dynamic ones)
        .populate('exhibitionId', 'name slug pricingTiers')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.registrationModel.countDocuments(filter).exec(),
    ]);

    // Transform data to include pricing tier details
    const transformedData = registrations.map((reg: any) => {
      let pricingTierName = 'N/A';
      let ticketType = null;
      let selectedDaysDetails = [];

      if (reg.pricingTierId && reg.exhibitionId?.pricingTiers) {
        const tier = reg.exhibitionId.pricingTiers.find(
          (t: any) => t._id && t._id.toString() === reg.pricingTierId.toString(),
        );

        if (tier) {
          pricingTierName = tier.name;
          ticketType = tier.ticketType;

          if (tier.ticketType === 'day_wise' && reg.selectedDays && reg.selectedDays.length > 0) {
            if (reg.selectedDays.includes(0)) {
              selectedDaysDetails = [{
                dayNumber: 0,
                dayName: 'All Sessions',
                price: tier.allSessionsPrice || 0,
              }];
            } else {
              selectedDaysDetails = tier.dayPrices
                .filter((day: any) => reg.selectedDays.includes(day.dayNumber))
                .map((day: any) => ({
                  dayNumber: day.dayNumber,
                  dayName: day.dayName,
                  date: day.date,
                  price: day.price,
                }));
            }
          }
        }
      }

      return {
        id: reg._id,
        registrationNumber: reg.registrationNumber,
        registrationDate: reg.registrationDate,
        status: reg.status,
        registrationCategory: reg.registrationCategory,
        selectedInterests: reg.selectedInterests || [],
        customFieldData: reg.customFieldData || {},
        pricingTierId: reg.pricingTierId,
        pricingTierName,
        ticketType,
        selectedDays: reg.selectedDays || [],
        selectedDaysDetails,
        amountPaid: reg.amountPaid,
        paymentStatus: reg.paymentStatus,
        registrationSource: reg.registrationSource,
        checkInTime: reg.checkInTime,
        checkOutTime: reg.checkOutTime,
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt,
        visitor: reg.visitorId,
        exhibition: {
          id: reg.exhibitionId?._id,
          name: reg.exhibitionId?.name,
          slug: reg.exhibitionId?.slug,
        },
      };
    });

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Registrations retrieved successfully',
    };
  }
}

