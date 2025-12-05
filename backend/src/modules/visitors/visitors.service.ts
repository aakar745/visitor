import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GlobalVisitor, GlobalVisitorDocument } from '../../database/schemas/global-visitor.schema';
import { ExhibitionRegistration, ExhibitionRegistrationDocument } from '../../database/schemas/exhibition-registration.schema';
import { sanitizePagination, buildSortObject, calculatePaginationMeta } from '../../common/constants/pagination.constants';
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
    const { page, limit, skip } = sanitizePagination(rawPage, rawLimit);

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

    const sort = buildSortObject(sortBy, sortOrder);

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
      pagination: calculatePaginationMeta(page, limit, total),
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
   * 
   * SECURITY: Limited to 100 visitors per request to prevent:
   * - DoS attacks via large bulk operations
   * - Memory exhaustion from processing too many records
   * - Long-running requests that could timeout
   */
  async bulkDelete(ids: string[]): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No visitor IDs provided');
    }

    // ✅ SECURITY FIX: Limit bulk operations to prevent DoS
    const MAX_BULK_DELETE = 100;
    if (ids.length > MAX_BULK_DELETE) {
      throw new BadRequestException(
        `Cannot delete more than ${MAX_BULK_DELETE} visitors at once. ` +
        `Received: ${ids.length}. Please split into smaller batches.`
      );
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
   * Delete ALL visitors (with cascade deletion of registrations)
   * ⚠️ DANGEROUS: This deletes ALL visitors and their registrations!
   */
  async deleteAll(): Promise<{
    message: string;
    visitorsDeleted: number;
    registrationsDeleted: number;
  }> {
    this.logger.warn('⚠️ DELETE ALL VISITORS initiated - This is a destructive operation!');

    // Get total counts before deletion
    const totalVisitors = await this.visitorModel.countDocuments().exec();
    const totalRegistrations = await this.registrationModel.countDocuments().exec();

    if (totalVisitors === 0) {
      return {
        message: 'No visitors to delete',
        visitorsDeleted: 0,
        registrationsDeleted: 0,
      };
    }

    // Step 1: Delete ALL registrations first (cascade)
    const registrationResult = await this.registrationModel.deleteMany({}).exec();
    this.logger.log(`Deleted ${registrationResult.deletedCount} registrations`);

    // Step 2: Delete ALL visitors
    const visitorResult = await this.visitorModel.deleteMany({}).exec();
    this.logger.log(`Deleted ${visitorResult.deletedCount} visitors`);

    // Step 3: Clear MeiliSearch index
    try {
      await this.meilisearchService.deleteAllVisitors();
      this.logger.log('✅ Cleared MeiliSearch visitor index');
    } catch (error) {
      this.logger.error(`Failed to clear MeiliSearch index: ${error.message}`);
      // Don't throw - data is deleted, search index cleanup is optional
    }

    this.logger.warn(
      `🗑️ DELETE ALL completed: ${visitorResult.deletedCount} visitors and ${registrationResult.deletedCount} registrations deleted`,
    );

    return {
      message: `Successfully deleted all visitors and registrations`,
      visitorsDeleted: visitorResult.deletedCount,
      registrationsDeleted: registrationResult.deletedCount,
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
        { $limit: 50 }, // ✅ FIX: Limit to top 50 states to prevent memory issues
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
   * ✅ FIX: Added limit to prevent memory issues with visitors who have many registrations
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
      .limit(100) // ✅ FIX: Limit to last 100 registrations (reasonable for any visitor)
      .lean() // ✅ FIX: Use lean() for better memory efficiency
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

  /**
   * Re-sync all visitors to MeiliSearch
   * Useful when search index settings are updated (e.g., new phone format fields)
   * Processes in batches to avoid memory issues
   */
  async resyncMeilisearch(): Promise<{
    message: string;
    totalSynced: number;
    duration: number;
  }> {
    this.logger.log('🔄 Starting MeiliSearch full resync...');
    const startTime = Date.now();
    
    const total = await this.visitorModel.countDocuments().exec();
    this.logger.log(`📊 Total visitors to sync: ${total.toLocaleString()}`);

    if (total === 0) {
      return {
        message: 'No visitors to sync',
        totalSynced: 0,
        duration: 0,
      };
    }

    // Clear existing index first
    try {
      await this.meilisearchService.deleteAllVisitors();
      this.logger.log('🗑️ Cleared existing MeiliSearch index');
    } catch (error) {
      this.logger.warn(`Failed to clear index (may not exist): ${error.message}`);
    }

    // Process in batches
    const BATCH_SIZE = 1000;
    let processedCount = 0;

    const cursor = this.visitorModel.find().lean().cursor();
    let batch: any[] = [];

    for await (const visitor of cursor) {
      batch.push(visitor);

      if (batch.length >= BATCH_SIZE) {
        await this.meilisearchService.indexAllVisitors(batch);
        processedCount += batch.length;
        this.logger.log(`📤 Synced ${processedCount.toLocaleString()}/${total.toLocaleString()} visitors (${((processedCount / total) * 100).toFixed(1)}%)`);
        batch = [];
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      await this.meilisearchService.indexAllVisitors(batch);
      processedCount += batch.length;
    }

    const duration = Date.now() - startTime;
    this.logger.log(`✅ MeiliSearch resync completed: ${processedCount.toLocaleString()} visitors in ${(duration / 1000).toFixed(1)}s`);

    return {
      message: `Successfully synced ${processedCount.toLocaleString()} visitors to MeiliSearch`,
      totalSynced: processedCount,
      duration,
    };
  }

  /**
   * Export all global visitors to CSV or Excel with streaming
   * Handles large datasets efficiently with dynamic field discovery
   * 
   * ✅ Exports ALL visitors (not just current page)
   * ✅ Discovers all dynamic fields in data (including removed fields)
   * ✅ Streams data for memory efficiency
   * ✅ Supports filtering by search, state, city, minRegistrations
   */
  async exportGlobalVisitors(
    res: any,
    options: {
      format: 'csv' | 'excel';
      search?: string;
      state?: string;
      city?: string;
      minRegistrations?: number;
    },
  ): Promise<void> {
    this.logger.log('[Export] Starting global visitor export...');

    // Build filter
    const filter: any = {};
    
    if (options.search) {
      const sanitizedSearch = sanitizeSearch(options.search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { phone: { $regex: sanitizedSearch, $options: 'i' } },
        { company: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    if (options.state) filter.state = options.state;
    if (options.city) filter.city = options.city;
    if (options.minRegistrations) {
      filter.totalRegistrations = { $gte: options.minRegistrations };
    }

    // Count total for logging
    const total = await this.visitorModel.countDocuments(filter).exec();
    this.logger.log(`[Export] Total records to export: ${total.toLocaleString()}`);

    // ✅ DYNAMIC FIELD DISCOVERY - Find ALL fields in actual data
    // This ensures no data is hidden when fields are added/removed
    const allFieldsInData = await this.findAllFieldsInGlobalVisitors(filter);
    this.logger.log(`[Export] Found ${allFieldsInData.length} dynamic fields in visitor data`);

    if (options.format === 'csv') {
      return this.exportGlobalVisitorsAsCSV(res, filter, allFieldsInData);
    } else {
      return this.exportGlobalVisitorsAsExcel(res, filter, allFieldsInData);
    }
  }

  /**
   * Find all unique dynamic field names in global visitor data
   * Samples visitors to discover all possible field names (including removed fields)
   * Excludes standard visitor fields
   */
  private async findAllFieldsInGlobalVisitors(filter: any): Promise<string[]> {
    const sampleSize = 100; // Sample size to discover fields

    const samples = await this.visitorModel
      .find(filter)
      .limit(sampleSize)
      .lean()
      .exec();

    const fieldSet = new Set<string>();

    // Standard visitor fields that we exclude from dynamic detection
    const standardFields = new Set([
      '_id',
      '__v',
      'id',
      'name',
      'email',
      'phone',
      'company',
      'designation',
      'city',
      'state',
      'pincode',
      'address',
      'countryId',
      'stateId',
      'cityId',
      'pincodeId',
      'createdAt',
      'updatedAt',
      'totalRegistrations',
      'lastRegistrationDate',
      'registeredExhibitions',
    ]);

    samples.forEach((visitor: any) => {
      Object.keys(visitor).forEach((key) => {
        if (!standardFields.has(key)) {
          const value = (visitor as any)[key];
          // Only add if field has actual data (not null/undefined/empty)
          if (value !== null && value !== undefined && value !== '') {
            fieldSet.add(key);
          }
        }
      });
    });

    return Array.from(fieldSet).sort();
  }

  /**
   * Export global visitors as CSV with streaming
   * Memory-efficient for large datasets
   */
  private async exportGlobalVisitorsAsCSV(
    res: any,
    filter: any,
    dynamicFields: string[],
  ): Promise<void> {
    const fileName = `global-visitors-${new Date().toISOString().split('T')[0]}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Standard columns
    const standardColumns = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Designation',
      'City',
      'State',
      'Pincode',
      'Address',
    ];

    // Dynamic columns (convert field names to readable headers)
    const dynamicColumns = dynamicFields.map((field) =>
      field
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    );

    // Summary columns
    const summaryColumns = [
      'Total Registrations',
      'Created Date',
    ];

    const headers = [...standardColumns, ...dynamicColumns, ...summaryColumns];

    // Write header row
    res.write(headers.map((h) => `"${h}"`).join(',') + '\n');

    // Stream data in batches for memory efficiency
    const BATCH_SIZE = 1000;
    const cursor = this.visitorModel.find(filter).lean().cursor();

    let batch: any[] = [];
    let processedCount = 0;

    for await (const visitor of cursor) {
      batch.push(visitor);

      if (batch.length >= BATCH_SIZE) {
        const csvRows = this.formatVisitorBatchToCSV(batch, dynamicFields);
        res.write(csvRows);
        processedCount += batch.length;
        this.logger.debug(`[Export] Processed ${processedCount} visitors...`);
        batch = [];
      }
    }

    // Write remaining batch
    if (batch.length > 0) {
      const csvRows = this.formatVisitorBatchToCSV(batch, dynamicFields);
      res.write(csvRows);
      processedCount += batch.length;
    }

    res.end();
    this.logger.log(`[Export] Global visitor CSV export completed: ${processedCount} records`);
  }

  /**
   * Format a batch of visitors to CSV rows
   */
  private formatVisitorBatchToCSV(batch: any[], dynamicFields: string[]): string {
    return batch
      .map((v: any) => {
        // Standard field values
        const standardValues = [
          v.name || '',
          v.email || '',
          v.phone || '',
          v.company || '',
          v.designation || '',
          v.city || '',
          v.state || '',
          v.pincode || '',
          v.address || '',
        ];

        // Dynamic field values
        const dynamicValues = dynamicFields.map((field) => {
          const value = v[field];
          if (Array.isArray(value)) return value.join('; ');
          return value || '';
        });

        // Summary field values
        const summaryValues = [
          v.totalRegistrations || 0,
          new Date(v.createdAt).toISOString().split('T')[0],
        ];

        const row = [...standardValues, ...dynamicValues, ...summaryValues];

        // Escape CSV values (handle quotes and commas)
        return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      })
      .join('');
  }

  /**
   * Export global visitors as Excel with streaming
   * Memory-efficient for large datasets
   */
  private async exportGlobalVisitorsAsExcel(
    res: any,
    filter: any,
    dynamicFields: string[],
  ): Promise<void> {
    const ExcelJS = require('exceljs');
    const fileName = `global-visitors-${new Date().toISOString().split('T')[0]}-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet('Visitors', {
      properties: { defaultRowHeight: 20 },
    });

    // Standard columns
    const standardColumns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'State', key: 'state', width: 18 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Address', key: 'address', width: 30 },
    ];

    // Dynamic columns
    const dynamicColumns = dynamicFields.map((field) => ({
      header: field
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      key: `dynamic_${field}`,
      width: 20,
    }));

    // Summary columns
    const summaryColumns = [
      { header: 'Total Registrations', key: 'totalRegistrations', width: 18 },
      { header: 'Created Date', key: 'createdAt', width: 20 },
    ];

    worksheet.columns = [...standardColumns, ...dynamicColumns, ...summaryColumns];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Stream data
    const cursor = this.visitorModel.find(filter).lean().cursor();
    let processedCount = 0;

    for await (const visitor of cursor) {
      const visitorAny = visitor as any;
      const rowData: any = {
        name: visitorAny.name || '',
        email: visitorAny.email || '',
        phone: visitorAny.phone || '',
        company: visitorAny.company || '',
        designation: visitorAny.designation || '',
        city: visitorAny.city || '',
        state: visitorAny.state || '',
        pincode: visitorAny.pincode || '',
        address: visitorAny.address || '',
        totalRegistrations: visitorAny.totalRegistrations || 0,
        createdAt: new Date(visitorAny.createdAt).toISOString().split('T')[0],
      };

      // Add dynamic fields
      dynamicFields.forEach((field) => {
        const value = visitorAny[field];
        rowData[`dynamic_${field}`] = Array.isArray(value) ? value.join('; ') : value || '';
      });

      worksheet.addRow(rowData).commit();
      processedCount++;

      if (processedCount % 1000 === 0) {
        this.logger.debug(`[Export] Processed ${processedCount} visitors...`);
      }
    }

    await worksheet.commit();
    await workbook.commit();

    this.logger.log(`[Export] Global visitor Excel export completed: ${processedCount} records`);
  }
}

