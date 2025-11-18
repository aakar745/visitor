export const ImportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIALLY_COMPLETED: 'partially_completed',
} as const;

export type ImportStatus = typeof ImportStatus[keyof typeof ImportStatus];

export const DuplicateStrategy = {
  SKIP: 'skip',
  UPDATE: 'update',
  CREATE_NEW: 'create_new',
} as const;

export type DuplicateStrategy = typeof DuplicateStrategy[keyof typeof DuplicateStrategy];

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

