import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { GlobalVisitor } from '../../database/schemas/global-visitor.schema';
import {
  ImportHistory,
  ImportStatus,
  DuplicateStrategy,
} from '../../database/schemas/import-history.schema';
import { MeilisearchService } from '../meilisearch/meilisearch.service';

interface ParsedVisitor {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  designation?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
}

export interface ImportProgress {
  importId: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  updatedRows: number;
  errorMessages: string[];
  skipMessages: string[];
  percentage: number;
  skipReason: string; // High-level skip reason explanation
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  // ✅ NO LIMIT - System can handle any size dataset with batch processing
  private readonly BATCH_SIZE = 1000; // Process 1000 rows at a time

  constructor(
    @InjectModel(GlobalVisitor.name)
    private readonly visitorModel: Model<GlobalVisitor>,
    @InjectModel(ImportHistory.name)
    private readonly importHistoryModel: Model<ImportHistory>,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  /**
   * Parse CSV or Excel file and create import job
   */
  async parseAndInitiateImport(
    file: Express.Multer.File,
    userId: string,
    userName: string,
    duplicateStrategy: DuplicateStrategy,
  ): Promise<{ importId: string; totalRows: number }> {
    this.logger.log(
      `Starting import for user ${userName} (${userId}), file: ${file.originalname}`,
    );

    let rows: any[] = [];
    const fileName = file.originalname.toLowerCase();

    // Check if file is Excel
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel file
      try {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: '',
        });
        
        // Transform headers to match CSV format
        rows = jsonData.map((row: any) => {
          const transformedRow: any = {};
          Object.keys(row).forEach(key => {
            const transformedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            transformedRow[transformedKey] = row[key];
          });
          return transformedRow;
        });
        
        this.logger.log(`Parsed Excel file: ${rows.length} rows found`);
      } catch (error) {
        throw new BadRequestException(
          `Excel parsing error: ${error.message}`,
        );
      }
    } else {
      // Parse CSV file
      const csvData = file.buffer.toString('utf-8');
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) =>
          header.trim().toLowerCase().replace(/\s+/g, '_'),
      });

      if (parseResult.errors.length > 0) {
        throw new BadRequestException(
          `CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`,
        );
      }

      rows = parseResult.data as any[];
    }

    const totalRows = rows.length;

    // ✅ NO ROW LIMIT - System handles unlimited rows with batch processing
    if (totalRows === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Log info for large imports
    if (totalRows > 100000) {
      this.logger.log(`[Import] Large dataset detected: ${totalRows.toLocaleString()} rows. Processing in batches for optimal performance.`);
    }

    // Validate headers
    const headers = Object.keys(rows[0]);
    if (!headers.includes('name') || !headers.includes('phone')) {
      throw new BadRequestException(
        'CSV must contain at least "name" and "phone" columns',
      );
    }

    // Create import history record
    const importHistory = new this.importHistoryModel({
      fileName: file.originalname,
      totalRows,
      processedRows: 0,
      successRows: 0,
      failedRows: 0,
      skippedRows: 0,
      updatedRows: 0,
      status: ImportStatus.PENDING,
      duplicateStrategy,
      importedBy: new Types.ObjectId(userId),
      importedByName: userName,
      startedAt: new Date(),
      metadata: {
        fileSize: file.size,
        mimeType: file.mimetype,
        headers,
        sampleData: rows.slice(0, 5),
      },
      errorMessages: [],
      importedVisitors: [],
    });

    await importHistory.save();

    // Start background processing (don't await)
    this.processImportInBackground(
      (importHistory._id as Types.ObjectId).toString(),
      rows,
      duplicateStrategy,
    ).catch((error) => {
      this.logger.error(
        `Background import failed for ${importHistory._id}: ${error.message}`,
        error.stack,
      );
    });

    return {
      importId: (importHistory._id as Types.ObjectId).toString(),
      totalRows,
    };
  }

  /**
   * Process import in background with batch processing
   */
  private async processImportInBackground(
    importId: string,
    rows: any[],
    duplicateStrategy: DuplicateStrategy,
  ): Promise<void> {
    const importHistory = await this.importHistoryModel.findById(importId);
    if (!importHistory) {
      throw new Error(`Import history ${importId} not found`);
    }

    try {
      importHistory.status = ImportStatus.PROCESSING;
      await importHistory.save();

      const totalRows = rows.length;
      let processedRows = 0;
      let successRows = 0;
      let failedRows = 0;
      let skippedRows = 0;
      let updatedRows = 0;
      const errorMessages: string[] = [];
      const skipMessages: string[] = [];
      const importedVisitors: any[] = [];
      
      // Track created/updated visitors for Meilisearch batch sync
      const visitorsToSync: any[] = [];

      // Process in batches
      for (let i = 0; i < totalRows; i += this.BATCH_SIZE) {
        const batch = rows.slice(i, i + this.BATCH_SIZE);

        for (const row of batch) {
          try {
            const parsedVisitor = this.parseVisitorRow(row, i + batch.indexOf(row) + 2);

            if (!parsedVisitor) {
              failedRows++;
              processedRows++;
              continue;
            }

            // Check for duplicate by phone
            const existingVisitor = await this.visitorModel.findOne({
              phone: parsedVisitor.phone,
            });

            if (existingVisitor) {
              // Handle duplicate based on strategy
              if (duplicateStrategy === DuplicateStrategy.SKIP) {
                skippedRows++;
                // Track first 100 skip messages for display (avoid memory bloat for large imports)
                if (skipMessages.length < 100) {
                  skipMessages.push(
                    `Row ${i + batch.indexOf(row) + 2}: Phone ${parsedVisitor.phone} already exists (${existingVisitor.name})`,
                  );
                }
                this.logger.debug(
                  `Skipped duplicate phone: ${parsedVisitor.phone}`,
                );
              } else if (duplicateStrategy === DuplicateStrategy.UPDATE) {
                // Update existing visitor
                Object.assign(existingVisitor, {
                  name: parsedVisitor.name || existingVisitor.name,
                  email: parsedVisitor.email || existingVisitor.email,
                  company: parsedVisitor.company || existingVisitor.company,
                  designation:
                    parsedVisitor.designation || existingVisitor.designation,
                  city: parsedVisitor.city || existingVisitor.city,
                  state: parsedVisitor.state || existingVisitor.state,
                  pincode: parsedVisitor.pincode || existingVisitor.pincode,
                  address: parsedVisitor.address || existingVisitor.address,
                });
                await existingVisitor.save();
                updatedRows++;
                importedVisitors.push(existingVisitor._id as Types.ObjectId);
                visitorsToSync.push(existingVisitor); // Track for Meilisearch
                this.logger.debug(`Updated visitor: ${parsedVisitor.phone}`);
              } else if (duplicateStrategy === DuplicateStrategy.CREATE_NEW) {
                // Create new visitor (allow duplicate phone)
                const newVisitor = await this.visitorModel.create({
                  ...parsedVisitor,
                  totalRegistrations: 0,
                  registeredExhibitions: [],
                });
                successRows++;
                importedVisitors.push(newVisitor._id as Types.ObjectId);
                visitorsToSync.push(newVisitor); // Track for Meilisearch
                this.logger.debug(`Created new visitor: ${parsedVisitor.phone}`);
              }
            } else {
              // Create new visitor
              const newVisitor = await this.visitorModel.create({
                ...parsedVisitor,
                totalRegistrations: 0,
                registeredExhibitions: [],
              });
              successRows++;
              importedVisitors.push(newVisitor._id as Types.ObjectId);
              visitorsToSync.push(newVisitor); // Track for Meilisearch
              this.logger.debug(`Created visitor: ${parsedVisitor.phone}`);
            }
          } catch (error) {
            failedRows++;
            const errorMsg = `Row ${i + batch.indexOf(row) + 2}: ${error.message}`;
            errorMessages.push(errorMsg);
            this.logger.warn(errorMsg);
          }

          processedRows++;
        }

        // Update progress after each batch
        importHistory.processedRows = processedRows;
        importHistory.successRows = successRows;
        importHistory.failedRows = failedRows;
        importHistory.skippedRows = skippedRows;
        importHistory.updatedRows = updatedRows;
        importHistory.errorMessages = errorMessages.slice(0, 100) as any; // Store max 100 errors
        (importHistory as any).skipMessages = skipMessages.slice(0, 100); // Store max 100 skip messages
        importHistory.importedVisitors = importedVisitors as any;
        await importHistory.save();

        this.logger.log(
          `Batch progress: ${processedRows}/${totalRows} (${((processedRows / totalRows) * 100).toFixed(2)}%)`,
        );
        
        // ✅ AUTO-SYNC: Sync batch to Meilisearch for instant search
        if (visitorsToSync.length > 0) {
          try {
            await this.meilisearchService.indexAllVisitors(visitorsToSync);
            this.logger.debug(`✅ Synced ${visitorsToSync.length} visitors to Meilisearch (batch complete)`);
            visitorsToSync.length = 0; // Clear for next batch
          } catch (error) {
            this.logger.warn(`⚠️ Failed to sync batch to Meilisearch: ${error.message}`);
            // Don't throw - import continues, search indexing is optional
          }
        }
      }

      // Mark as completed
      importHistory.status =
        failedRows > 0 || skippedRows > 0
          ? ImportStatus.PARTIALLY_COMPLETED
          : ImportStatus.COMPLETED;
      importHistory.completedAt = new Date();
      await importHistory.save();

      this.logger.log(
        `Import ${importId} completed: ${successRows} success, ${updatedRows} updated, ${skippedRows} skipped, ${failedRows} failed`,
      );
      
      this.logger.log(
        `✅ All ${successRows + updatedRows} visitors are now instantly searchable in Exhibition Reports!`
      );
    } catch (error: any) {
      importHistory.status = ImportStatus.FAILED;
      (importHistory.errorMessages as any).push(`Fatal error: ${error.message}`);
      importHistory.completedAt = new Date();
      await importHistory.save();

      this.logger.error(
        `Import ${importId} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Parse and validate a single visitor row
   */
  private parseVisitorRow(row: any, rowNumber: number): ParsedVisitor | null {
    try {
      // Required fields
      const name = row.name?.trim();
      let phone = row.phone?.toString().trim();

      if (!name || !phone) {
        throw new Error('Name and phone are required');
      }

      // Clean and validate phone number
      phone = phone.replace(/[^0-9+]/g, ''); // Remove non-numeric except +

      // If phone doesn't start with +, assume it's Indian and add +91
      if (!phone.startsWith('+')) {
        phone = `+91${phone}`;
      }

      // Validate phone number
      if (!isValidPhoneNumber(phone)) {
        throw new Error(`Invalid phone number: ${phone}`);
      }

      // Parse phone number for consistent format
      const parsedPhone = parsePhoneNumber(phone);
      if (!parsedPhone) {
        throw new Error(`Failed to parse phone number: ${phone}`);
      }

      // Optional fields
      const email = row.email?.trim() || undefined;
      if (email && !this.isValidEmail(email)) {
        throw new Error(`Invalid email: ${email}`);
      }

      const visitor: ParsedVisitor = {
        name,
        phone: parsedPhone.number, // Use E.164 format
        email,
        company: row.company?.trim() || undefined,
        designation: row.designation?.trim() || undefined,
        city: row.city?.trim() || undefined,
        state: row.state?.trim() || undefined,
        pincode: row.pincode?.toString().trim() || undefined,
        address: row.address?.trim() || undefined,
      };

      return visitor;
    } catch (error) {
      this.logger.warn(`Row ${rowNumber} validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get import progress
   */
  async getImportProgress(importId: string): Promise<ImportProgress> {
    const importHistory = await this.importHistoryModel.findById(importId);

    if (!importHistory) {
      throw new BadRequestException('Import not found');
    }

    const percentage =
      importHistory.totalRows > 0
        ? Math.round(
            (importHistory.processedRows / importHistory.totalRows) * 100,
          )
        : 0;

    // Generate skip reason explanation based on duplicate strategy
    let skipReason = '';
    if (importHistory.skippedRows > 0) {
      switch (importHistory.duplicateStrategy) {
        case DuplicateStrategy.SKIP:
          skipReason = `${importHistory.skippedRows.toLocaleString()} records skipped because phone numbers already exist in database (Duplicate Strategy: Skip)`;
          break;
        case DuplicateStrategy.UPDATE:
          skipReason = 'Records with existing phone numbers were updated';
          break;
        case DuplicateStrategy.CREATE_NEW:
          skipReason = 'All records were imported (duplicates allowed)';
          break;
        default:
          skipReason = 'Some records were skipped';
      }
    }

    const result: ImportProgress = {
      importId: (importHistory._id as Types.ObjectId).toString(),
      status: importHistory.status,
      totalRows: importHistory.totalRows,
      processedRows: importHistory.processedRows,
      successRows: importHistory.successRows,
      failedRows: importHistory.failedRows,
      skippedRows: importHistory.skippedRows,
      updatedRows: importHistory.updatedRows,
      errorMessages: importHistory.errorMessages as string[],
      skipMessages: ((importHistory as any).skipMessages || []) as string[],
      percentage,
      skipReason,
    };

    return result;
  }

  /**
   * Get import history for a user
   */
  async getImportHistory(userId: string, limit = 20): Promise<any[]> {
    const history = await this.importHistoryModel
      .find({ importedBy: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return history.map((h: any) => ({
      ...h,
      percentage:
        h.totalRows > 0
          ? Math.round((h.processedRows / h.totalRows) * 100)
          : 0,
    }));
  }

  /**
   * Get all import history (admin only)
   */
  async getAllImportHistory(limit = 50): Promise<any[]> {
    const history = await this.importHistoryModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return history.map((h: any) => ({
      ...h,
      percentage:
        h.totalRows > 0
          ? Math.round((h.processedRows / h.totalRows) * 100)
          : 0,
    }));
  }

  /**
   * Rollback an import (delete imported visitors)
   */
  async rollbackImport(
    importId: string,
    userId: string,
    userName: string,
  ): Promise<{ deletedCount: number }> {
    const importHistory = await this.importHistoryModel.findById(importId);

    if (!importHistory) {
      throw new BadRequestException('Import not found');
    }

    if (importHistory.isRolledBack) {
      throw new BadRequestException('Import already rolled back');
    }

    if (importHistory.status === ImportStatus.PROCESSING) {
      throw new BadRequestException(
        'Cannot rollback an import that is still processing',
      );
    }

    // Delete imported visitors
    const result = await this.visitorModel.deleteMany({
      _id: { $in: importHistory.importedVisitors },
    });

    // ✅ AUTO-SYNC: Remove rolled-back visitors from Meilisearch
    if (result.deletedCount > 0) {
      try {
        for (const visitorId of importHistory.importedVisitors) {
          await this.meilisearchService.deleteVisitor(visitorId.toString());
        }
        this.logger.log(`✅ Removed ${result.deletedCount} rolled-back visitors from Meilisearch`);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to remove visitors from Meilisearch during rollback: ${error.message}`);
        // Don't throw - rollback is complete, search cleanup is optional
      }
    }

    // Mark as rolled back
    importHistory.isRolledBack = true;
    importHistory.rolledBackAt = new Date();
    importHistory.rolledBackBy = new Types.ObjectId(userId);
    await importHistory.save();

    this.logger.log(
      `Import ${importId} rolled back by ${userName}: ${result.deletedCount} visitors deleted`,
    );

    return { deletedCount: result.deletedCount };
  }
}

