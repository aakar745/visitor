import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GlobalVisitor, GlobalVisitorDocument } from '../../database/schemas/global-visitor.schema';
import { ExhibitionRegistration, ExhibitionRegistrationDocument } from '../../database/schemas/exhibition-registration.schema';
import { sanitizePagination } from '../../common/constants/pagination.constants';
import { sanitizeSearch } from '../../common/utils/sanitize.util';
import { MeilisearchService } from '../meilisearch/meilisearch.service';

export interface QueryVisitorDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  state?: string;
  city?: string;
}

export interface CreateVisitorDto {
  email: string;
  name: string;
  phone: string;
  company?: string;
  designation?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
}

export interface UpdateVisitorDto {
  name?: string;
  phone?: string;
  company?: string;
  designation?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
}

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    @InjectModel(GlobalVisitor.name) private visitorModel: Model<GlobalVisitorDocument>,
    @InjectModel(ExhibitionRegistration.name) private registrationModel: Model<ExhibitionRegistrationDocument>,
    private readonly meilisearchService: MeilisearchService, // ✅ Inject MeiliSearch
  ) {}

  /**
   * Find all visitors with pagination and filters
   * Returns ONLY global visitor profile data (no exhibition-specific data)
   */
  async findAll(query: QueryVisitorDto): Promise<{
    data: GlobalVisitor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page: rawPage, limit: rawLimit, sortBy = 'createdAt', sortOrder = 'desc', search, state, city } = query;

    // Sanitize pagination
    const { page, limit } = sanitizePagination(rawPage, rawLimit);
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (search) {
      // Sanitize search input to prevent ReDoS attacks
      const sanitizedSearch = sanitizeSearch(search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { phone: { $regex: sanitizedSearch, $options: 'i' } },
        { company: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    if (state) {
      filter.state = state;
    }

    if (city) {
      filter.city = city;
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query - returns global visitor profiles only
    const [data, total] = await Promise.all([
      this.visitorModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() // Use lean for better performance with dynamic fields
        .exec(),
      this.visitorModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one visitor by ID
   */
  async findOne(id: string): Promise<GlobalVisitor> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid visitor ID');
    }

    const visitor = await this.visitorModel.findById(id).exec();

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    return visitor;
  }

  /**
   * Find visitor by email
   */
  async findByEmail(email: string): Promise<GlobalVisitor | null> {
    return this.visitorModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Create new visitor
   */
  async create(createVisitorDto: CreateVisitorDto): Promise<GlobalVisitor> {
    // Check if visitor already exists
    const existingVisitor = await this.findByEmail(createVisitorDto.email);
    if (existingVisitor) {
      throw new BadRequestException('A visitor with this email already exists');
    }

    const visitor = new this.visitorModel({
      ...createVisitorDto,
      email: createVisitorDto.email.toLowerCase(),
    });

    const savedVisitor = await visitor.save();
    
    // ✅ AUTO-SYNC: Index in MeiliSearch for instant search
    try {
      await this.meilisearchService.indexVisitor(savedVisitor);
      this.logger.debug(`✅ Visitor ${savedVisitor._id} indexed in MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to index visitor in MeiliSearch: ${error.message}`);
      // Don't throw - visitor is saved, indexing is optional
    }

    return savedVisitor;
  }

  /**
   * Update visitor
   */
  async update(id: string, updateVisitorDto: UpdateVisitorDto): Promise<GlobalVisitor> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid visitor ID');
    }

    const visitor = await this.visitorModel.findByIdAndUpdate(
      id,
      { $set: updateVisitorDto },
      { new: true, runValidators: true },
    ).exec();

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    // ✅ AUTO-SYNC: Update in MeiliSearch for instant search
    try {
      await this.meilisearchService.updateVisitor(visitor);
      this.logger.debug(`✅ Visitor ${visitor._id} updated in MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to update visitor in MeiliSearch: ${error.message}`);
      // Don't throw - visitor is updated, indexing is optional
    }

    return visitor;
  }

  /**
   * Delete visitor with cascade deletion of all registrations
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid visitor ID');
    }

    // Check if visitor exists
    const visitor = await this.visitorModel.findById(id).exec();
    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    // CASCADE DELETE: Delete all associated registrations first
    const registrationCount = await this.registrationModel
      .countDocuments({ visitorId: new Types.ObjectId(id) })
      .exec();

    if (registrationCount > 0) {
      await this.registrationModel
        .deleteMany({ visitorId: new Types.ObjectId(id) })
        .exec();
      this.logger.log(`Deleted ${registrationCount} registration(s) for visitor ${id}`);
    }

    // Delete the visitor
    await this.visitorModel.findByIdAndDelete(id).exec();

    // ✅ AUTO-SYNC: Remove from MeiliSearch for instant search
    try {
      await this.meilisearchService.deleteVisitor(id);
      this.logger.debug(`✅ Visitor ${id} removed from MeiliSearch`);
    } catch (error) {
      this.logger.error(`Failed to remove visitor from MeiliSearch: ${error.message}`);
      // Don't throw - visitor is deleted, indexing is optional
    }

    this.logger.log(`Visitor ${id} deleted successfully (cascade deleted ${registrationCount} registrations)`);
  }

  /**
   * Bulk delete visitors
   */
  async bulkDelete(ids: string[]): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No visitor IDs provided');
    }

    const deleted: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        await this.remove(id);
        deleted.push(id);
      } catch (error) {
        failed.push({
          id,
          reason: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(`Bulk delete completed: ${deleted.length} deleted, ${failed.length} failed`);

    return {
      message: `Bulk delete completed: ${deleted.length} deleted, ${failed.length} failed`,
      deleted: deleted.length,
      failed,
    };
  }

  /**
   * Get visitor statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byState: Record<string, number>;
    byCity: Record<string, number>;
    totalRegistrations: number;
    averageRegistrationsPerVisitor: number;
  }> {
    const [total, stateStats, cityStats, registrations] = await Promise.all([
      this.visitorModel.countDocuments().exec(),
      this.visitorModel.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).exec(),
      this.visitorModel.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).exec(),
      this.visitorModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalRegistrations' } } },
      ]).exec(),
    ]);

    const byState: Record<string, number> = {};
    stateStats.forEach((stat) => {
      if (stat._id) byState[stat._id] = stat.count;
    });

    const byCity: Record<string, number> = {};
    cityStats.forEach((stat) => {
      if (stat._id) byCity[stat._id] = stat.count;
    });

    const totalRegistrations = registrations[0]?.total || 0;

    return {
      total,
      byState,
      byCity,
      totalRegistrations,
      averageRegistrationsPerVisitor: total > 0 ? totalRegistrations / total : 0,
    };
  }

  /**
   * Get visitor's registrations
   */
  async getVisitorRegistrations(visitorId: string): Promise<ExhibitionRegistration[]> {
    if (!Types.ObjectId.isValid(visitorId)) {
      throw new BadRequestException('Invalid visitor ID');
    }

    const visitor = await this.visitorModel.findById(visitorId).exec();
    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${visitorId} not found`);
    }

    return this.registrationModel
      .find({ visitorId: new Types.ObjectId(visitorId) })
      .populate('exhibitionId')
      .sort({ registrationDate: -1 })
      .exec();
  }

  /**
   * Fast autocomplete search using MeiliSearch
   * Searches by name, phone, email, company with instant results
   */
  async searchAutocomplete(
    query: string,
    exhibitionId?: string,
    limit: number = 20,
  ): Promise<any> {
    return await this.meilisearchService.searchVisitors(query, exhibitionId, limit);
  }
}

