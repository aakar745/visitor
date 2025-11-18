import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: Record<string, string[]>;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get('MAX_FILE_SIZE', 10485760); // 10MB default
    
    // Define allowed MIME types per file category
    this.allowedMimeTypes = {
      logo: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
      banner: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'badge-logo': ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File, type: string): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    const allowedTypes = this.allowedMimeTypes[type] || this.allowedMimeTypes.image;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    this.logger.log(`File validated: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
  }

  /**
   * Save uploaded file to disk
   */
  async saveFile(
    file: Express.Multer.File,
    type: string,
    subfolder?: string,
  ): Promise<{
    id: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  }> {
    try {
      // Validate file
      this.validateFile(file, type);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueId = uuidv4();
      const filename = `${Date.now()}-${uniqueId}${fileExtension}`;

      // Determine save path
      const savePath = subfolder
        ? path.join(this.uploadDir, subfolder)
        : this.uploadDir;

      // Ensure subfolder exists
      await fs.mkdir(savePath, { recursive: true });

      // Full file path
      const filePath = path.join(savePath, filename);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate URL (relative to uploads directory)
      const relativePath = subfolder
        ? path.join(subfolder, filename).replace(/\\/g, '/')
        : filename;
      const url = `/uploads/${relativePath}`;

      this.logger.log(`File saved successfully: ${url}`);

      return {
        id: uniqueId,
        url,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Delete file from disk
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const relativePath = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadDir, relativePath);

      // Check if file exists
      await fs.access(filePath);

      // Delete file
      await fs.unlink(filePath);

      this.logger.log(`File deleted: ${fileUrl}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${fileUrl}:`, error.message);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileUrl: string): Promise<{
    exists: boolean;
    size?: number;
    mimetype?: string;
  }> {
    try {
      const relativePath = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadDir, relativePath);

      const stats = await fs.stat(filePath);

      return {
        exists: true,
        size: stats.size,
      };
    } catch {
      return {
        exists: false,
      };
    }
  }
}

