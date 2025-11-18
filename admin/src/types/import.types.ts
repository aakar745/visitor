export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIALLY_COMPLETED = 'partially_completed',
}

export enum DuplicateStrategy {
  SKIP = 'skip',
  UPDATE = 'update',
  CREATE_NEW = 'create_new',
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
  percentage: number;
}

export interface ImportHistoryItem {
  _id: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  updatedRows: number;
  status: ImportStatus;
  duplicateStrategy: DuplicateStrategy;
  errorMessages: string[];
  importedBy: string;
  importedByName: string;
  startedAt: string;
  completedAt?: string;
  percentage: number;
  isRolledBack: boolean;
  rolledBackAt?: string;
  createdAt: string;
  updatedAt: string;
}

