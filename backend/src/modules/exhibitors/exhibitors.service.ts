import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exhibitor, ExhibitorDocument } from '../../database/schemas/exhibitor.schema';
import { Exhibition, ExhibitionDocument } from '../../database/schemas/exhibition.schema';
import { ExhibitionRegistration, ExhibitionRegistrationDocument } from '../../database/schemas/exhibition-registration.schema';
import { CreateExhibitorDto, UpdateExhibitorDto, QueryExhibitorDto } from './dto';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { sanitizePagination, buildSortObject, calculatePaginationMeta } from '../../common/constants/pagination.constants';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class ExhibitorsService {
  private readonly logger = new Logger(ExhibitorsService.name);

  constructor(
    @InjectModel(Exhibitor.name) private exhibitorModel: Model<ExhibitorDocument>,
    @InjectModel(Exhibition.name) private exhibitionModel: Model<ExhibitionDocument>,
    @InjectModel(ExhibitionRegistration.name) private registrationModel: Model<ExhibitionRegistrationDocument>,
  ) {}

  /**
   * Generate slug from name
   * 
   * SECURITY FIX (BUG-013): Now uses shared utility with proper transliteration
   * Handles unicode, accented characters, and prevents empty slugs
   */
  private generateSlugInternal(name: string): string {
    return generateSlug(name);
  }

  /**
   * Ensure slug is unique within exhibition
   */
  private async ensureUniqueSlug(exhibitionId: string, slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const query: any = {
        exhibitionId: new Types.ObjectId(exhibitionId),
        slug: uniqueSlug,
      };

      if (excludeId) {
        query._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const existing = await this.exhibitorModel.findOne(query);

      if (!existing) {
        return uniqueSlug;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  /**
   * Create new exhibitor
   */
  async create(createExhibitorDto: CreateExhibitorDto, userId?: string): Promise<Exhibitor> {
    // Validate exhibition exists
    const exhibition = await this.exhibitionModel.findById(createExhibitorDto.exhibitionId);
    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${createExhibitorDto.exhibitionId} not found`);
    }

    // Generate or validate slug
    const baseSlug = createExhibitorDto.slug || this.generateSlugInternal(createExhibitorDto.name);
    const slug = await this.ensureUniqueSlug(createExhibitorDto.exhibitionId, baseSlug);

    // Sanitize logo - ensure it's a string or undefined, not an object
    const logo = typeof createExhibitorDto.logo === 'string' && createExhibitorDto.logo.trim() !== '' 
      ? createExhibitorDto.logo.trim() 
      : undefined;

    // Create exhibitor
    const exhibitor = new this.exhibitorModel({
      ...createExhibitorDto,
      exhibitionId: new Types.ObjectId(createExhibitorDto.exhibitionId),
      slug,
      logo,
      totalRegistrations: 0,
      isActive: createExhibitorDto.isActive !== undefined ? createExhibitorDto.isActive : true,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      updatedBy: userId ? new Types.ObjectId(userId) : undefined,
    });

    return exhibitor.save();
  }

  /**
   * Find all exhibitors with pagination and filters
   */
  async findAll(query: QueryExhibitorDto): Promise<{
    exhibitors: Exhibitor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, skip } = sanitizePagination(query.page, query.limit);
    const { search, exhibitionId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: any = {};

    // Exhibition filter
    if (exhibitionId && Types.ObjectId.isValid(exhibitionId)) {
      filter.exhibitionId = new Types.ObjectId(exhibitionId);
    }

    // Search filter
    if (search) {
      const sanitized = sanitizeSearch(search);
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { companyName: { $regex: sanitized, $options: 'i' } },
        { boothNumber: { $regex: sanitized, $options: 'i' } },
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const sort = buildSortObject(sortBy, sortOrder);

    const [exhibitors, total] = await Promise.all([
      this.exhibitorModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.exhibitorModel.countDocuments(filter),
    ]);

    // Transform _id to id for frontend compatibility
    const transformedExhibitors = exhibitors.map((exhibitor: any) => ({
      ...exhibitor,
      id: exhibitor._id.toString(),
      exhibitionId: exhibitor.exhibitionId.toString(),
      // Clean up invalid logo values
      logo: exhibitor.logo && 
            typeof exhibitor.logo === 'string' && 
            exhibitor.logo !== '[object Object]' && 
            exhibitor.logo.trim() !== ''
        ? exhibitor.logo 
        : undefined,
    }));

    return {
      exhibitors: transformedExhibitors as any[],
      pagination: calculatePaginationMeta(page, limit, total),
    };
  }

  /**
   * Find exhibitors by exhibition ID
   */
  async findByExhibition(exhibitionId: string, query?: QueryExhibitorDto): Promise<{
    exhibitors: Exhibitor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    if (!Types.ObjectId.isValid(exhibitionId)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    return this.findAll({
      ...query,
      exhibitionId,
    });
  }

  /**
   * Find single exhibitor by ID
   */
  async findOne(id: string): Promise<Exhibitor> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibitor ID');
    }

    const exhibitor = await this.exhibitorModel.findById(id).lean().exec();
    if (!exhibitor) {
      throw new NotFoundException(`Exhibitor with ID ${id} not found`);
    }

    // Clean up invalid logo values
    const cleanedExhibitor: any = {
      ...exhibitor,
      logo: exhibitor.logo && 
            typeof exhibitor.logo === 'string' && 
            exhibitor.logo !== '[object Object]' && 
            exhibitor.logo.trim() !== ''
        ? exhibitor.logo 
        : undefined,
    };

    return cleanedExhibitor as Exhibitor;
  }

  /**
   * Find exhibitor by slug within an exhibition
   */
  async findBySlug(exhibitionId: string, slug: string): Promise<Exhibitor> {
    if (!Types.ObjectId.isValid(exhibitionId)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const exhibitor = await this.exhibitorModel
      .findOne({
        exhibitionId: new Types.ObjectId(exhibitionId),
        slug,
      })
      .lean()
      .exec();

    if (!exhibitor) {
      throw new NotFoundException(`Exhibitor with slug "${slug}" not found in this exhibition`);
    }

    // Clean up invalid logo values
    const cleanedExhibitor: any = {
      ...exhibitor,
      logo: exhibitor.logo && 
            typeof exhibitor.logo === 'string' && 
            exhibitor.logo !== '[object Object]' && 
            exhibitor.logo.trim() !== ''
        ? exhibitor.logo 
        : undefined,
    };

    return cleanedExhibitor as Exhibitor;
  }

  /**
   * Update exhibitor
   */
  async update(id: string, updateExhibitorDto: UpdateExhibitorDto, userId?: string): Promise<Exhibitor> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibitor ID');
    }

    const exhibitor = await this.exhibitorModel.findById(id);
    if (!exhibitor) {
      throw new NotFoundException(`Exhibitor with ID ${id} not found`);
    }

    // If slug is being updated, ensure it's unique
    if (updateExhibitorDto.slug) {
      const uniqueSlug = await this.ensureUniqueSlug(
        exhibitor.exhibitionId.toString(),
        updateExhibitorDto.slug,
        id
      );
      updateExhibitorDto.slug = uniqueSlug;
    }

    // Sanitize logo - ensure it's a string or undefined, not an object
    if ('logo' in updateExhibitorDto) {
      if (typeof updateExhibitorDto.logo === 'string' && 
          updateExhibitorDto.logo.trim() !== '' && 
          updateExhibitorDto.logo !== '[object Object]') {
        updateExhibitorDto.logo = updateExhibitorDto.logo.trim();
      } else {
        updateExhibitorDto.logo = undefined;
      }
    }

    Object.assign(exhibitor, updateExhibitorDto);
    exhibitor.updatedBy = userId ? new Types.ObjectId(userId) : undefined;

    return exhibitor.save();
  }

  /**
   * Toggle exhibitor status
   */
  async toggleStatus(id: string, isActive: boolean, userId?: string): Promise<Exhibitor> {
    return this.update(id, { isActive }, userId);
  }

  /**
   * Delete exhibitor
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid exhibitor ID');
    }

    const exhibitor = await this.exhibitorModel.findById(id);
    if (!exhibitor) {
      throw new NotFoundException(`Exhibitor with ID ${id} not found`);
    }

    // Check if exhibitor has registrations
    const registrationCount = await this.registrationModel.countDocuments({
      exhibitorId: new Types.ObjectId(id),
    });

    if (registrationCount > 0) {
      throw new BadRequestException(
        `Cannot delete exhibitor with ${registrationCount} registrations. Please deactivate instead.`
      );
    }

    await this.exhibitorModel.findByIdAndDelete(id);
  }

  /**
   * Get exhibitor statistics
   */
  async getStats(exhibitorId: string): Promise<{
    exhibitorId: string;
    totalRegistrations: number;
    recentRegistrations: any[];
  }> {
    if (!Types.ObjectId.isValid(exhibitorId)) {
      throw new BadRequestException('Invalid exhibitor ID');
    }

    const exhibitor = await this.findOne(exhibitorId);

    const recentRegistrations = await this.registrationModel
      .find({ exhibitorId: new Types.ObjectId(exhibitorId) })
      .populate('visitorId', 'firstName lastName email')
      .sort({ registrationDate: -1 })
      .limit(10)
      .exec();

    return {
      exhibitorId,
      totalRegistrations: exhibitor.totalRegistrations,
      recentRegistrations: recentRegistrations.map(reg => ({
        visitorId: reg.visitorId,
        registrationDate: reg.registrationDate,
        status: reg.status,
      })),
    };
  }

  /**
   * Check slug availability
   */
  async checkSlugAvailability(exhibitionId: string, slug: string, excludeId?: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(exhibitionId)) {
      throw new BadRequestException('Invalid exhibition ID');
    }

    const query: any = {
      exhibitionId: new Types.ObjectId(exhibitionId),
      slug,
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existing = await this.exhibitorModel.findOne(query);
    return !existing;
  }

  /**
   * Bulk toggle status
   * 
   * SECURITY: Limited to 100 exhibitors per request to prevent DoS
   */
  async bulkToggleStatus(exhibitorIds: string[], isActive: boolean, userId?: string): Promise<void> {
    // ✅ SECURITY FIX: Limit bulk operations to prevent DoS
    const MAX_BULK_UPDATE = 100;
    if (exhibitorIds.length > MAX_BULK_UPDATE) {
      throw new BadRequestException(
        `Cannot update more than ${MAX_BULK_UPDATE} exhibitors at once. ` +
        `Received: ${exhibitorIds.length}. Please split into smaller batches.`
      );
    }

    const objectIds = exhibitorIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      throw new BadRequestException('No valid exhibitor IDs provided');
    }

    await this.exhibitorModel.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          isActive,
          updatedBy: userId ? new Types.ObjectId(userId) : undefined,
        },
      }
    );
  }

  /**
   * Bulk delete
   * 
   * SECURITY: Limited to 100 exhibitors per request to prevent DoS
   */
  async bulkDelete(exhibitorIds: string[]): Promise<void> {
    // ✅ SECURITY FIX: Limit bulk operations to prevent DoS
    const MAX_BULK_DELETE = 100;
    if (exhibitorIds.length > MAX_BULK_DELETE) {
      throw new BadRequestException(
        `Cannot delete more than ${MAX_BULK_DELETE} exhibitors at once. ` +
        `Received: ${exhibitorIds.length}. Please split into smaller batches.`
      );
    }

    const objectIds = exhibitorIds
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      throw new BadRequestException('No valid exhibitor IDs provided');
    }

    // Check if any have registrations
    const registrationCount = await this.registrationModel.countDocuments({
      exhibitorId: { $in: objectIds },
    });

    if (registrationCount > 0) {
      throw new BadRequestException(
        'Some exhibitors have registrations and cannot be deleted. Please deactivate instead.'
      );
    }

    await this.exhibitorModel.deleteMany({ _id: { $in: objectIds } });
  }

  /**
   * Increment registration count
   */
  async incrementRegistrationCount(exhibitorId: string): Promise<void> {
    if (!Types.ObjectId.isValid(exhibitorId)) {
      return;
    }

    await this.exhibitorModel.findByIdAndUpdate(exhibitorId, {
      $inc: { totalRegistrations: 1 },
    });
  }
}

