import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GlobalVisitor } from '../../database/schemas/global-visitor.schema';
import { ImportHistory } from '../../database/schemas/import-history.schema';

@Injectable()
export class VisitorImportsService {
  private readonly logger = new Logger(VisitorImportsService.name);

  constructor(
    @InjectModel(GlobalVisitor.name)
    private readonly visitorModel: Model<GlobalVisitor>,
    @InjectModel(ImportHistory.name)
    private readonly importHistoryModel: Model<ImportHistory>,
  ) {}

  /**
   * Generate CSV template with sample data
   */
  generateCsvTemplate(): string {
    const headers = [
      'name',
      'phone',
      'email',
      'company',
      'designation',
      'city',
      'state',
      'pincode',
      'address',
    ];

    const sampleRows = [
      [
        'John Doe',
        '9876543210',
        'john.doe@example.com',
        'ABC Corporation',
        'Manager',
        'Mumbai',
        'Maharashtra',
        '400001',
        '123 Main Street, Andheri',
      ],
      [
        'Jane Smith',
        '9123456789',
        'jane.smith@example.com',
        'XYZ Limited',
        'Director',
        'Delhi',
        'Delhi',
        '110001',
        '456 Park Avenue, Connaught Place',
      ],
      [
        'Rahul Kumar',
        '9988776655',
        'rahul.kumar@example.com',
        'Tech Solutions',
        'Senior Engineer',
        'Bangalore',
        'Karnataka',
        '560001',
        '789 MG Road',
      ],
    ];

    // Build CSV string
    let csv = headers.join(',') + '\n';
    sampleRows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    return csv;
  }

  /**
   * Get import statistics
   */
  async getImportStats() {
    // Total imports
    const totalImports = await this.importHistoryModel.countDocuments();
    
    // Successful imports
    const successfulImports = await this.importHistoryModel.countDocuments({
      status: 'completed',
    });
    
    // Failed imports
    const failedImports = await this.importHistoryModel.countDocuments({
      status: 'failed',
    });
    
    // Total rows imported
    const importStats = await this.importHistoryModel.aggregate([
      {
        $group: {
          _id: null,
          totalRowsProcessed: { $sum: '$processedRows' },
          totalSuccessRows: { $sum: '$successRows' },
          totalFailedRows: { $sum: '$failedRows' },
          totalSkippedRows: { $sum: '$skippedRows' },
          totalUpdatedRows: { $sum: '$updatedRows' },
        },
      },
    ]);

    // Recent imports
    const recentImports = await this.importHistoryModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fileName totalRows status importedByName createdAt')
      .lean();

    // Top importers
    const topImporters = await this.importHistoryModel.aggregate([
      {
        $group: {
          _id: '$importedByName',
          totalImports: { $sum: 1 },
          totalVisitors: { $sum: '$successRows' },
        },
      },
      { $sort: { totalImports: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: '$_id',
          totalImports: 1,
          totalVisitors: 1,
          _id: 0,
        },
      },
    ]);

    return {
      totalImports,
      successfulImports,
      failedImports,
      stats: importStats[0] || {
        totalRowsProcessed: 0,
        totalSuccessRows: 0,
        totalFailedRows: 0,
        totalSkippedRows: 0,
        totalUpdatedRows: 0,
      },
      recentImports,
      topImporters,
    };
  }
}

