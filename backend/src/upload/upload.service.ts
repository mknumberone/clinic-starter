import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly maxImageSize: number;
  private readonly maxDocumentSize: number;
  private readonly allowedImageTypes: string[];
  private readonly allowedDocumentTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.maxDocumentSize = 10 * 1024 * 1024; // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      path.join(this.uploadPath, 'images'),
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'temp'),
    ];

    for (const dir of directories) {
      try {
        await mkdirAsync(dir, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    options?: {
      resize?: { width?: number; height?: number };
      quality?: number;
    },
  ): Promise<{ filename: string; path: string; url: string; size: number }> {
    // Validate file type
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.maxImageSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxImageSize / 1024 / 1024}MB`,
      );
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `${timestamp}-${randomString}.webp`;
      const filepath = path.join(this.uploadPath, 'images', filename);

      // Process image with sharp
      let sharpInstance = sharp(file.buffer);

      // Apply resize if specified
      if (options?.resize) {
        sharpInstance = sharpInstance.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to webp and save
      await sharpInstance
        .webp({ quality: options?.quality || 80 })
        .toFile(filepath);

      const stats = await fs.promises.stat(filepath);
      const url = `/uploads/images/${filename}`;

      return {
        filename,
        path: filepath,
        url,
        size: stats.size,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
  ): Promise<{ filename: string; path: string; url: string; size: number }> {
    // Validate file type
    if (!this.allowedDocumentTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedDocumentTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.maxDocumentSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxDocumentSize / 1024 / 1024}MB`,
      );
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${randomString}${ext}`;
      const filepath = path.join(this.uploadPath, 'documents', filename);

      // Save document
      await fs.promises.writeFile(filepath, file.buffer);

      const stats = await fs.promises.stat(filepath);
      const url = `/uploads/documents/${filename}`;

      return {
        filename,
        path: filepath,
        url,
        size: stats.size,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    options?: {
      resize?: { width?: number; height?: number };
      quality?: number;
    },
  ): Promise<
    Array<{ filename: string; path: string; url: string; size: number }>
  > {
    const results = [];
    for (const file of files) {
      const result = await this.uploadImage(file, options);
      results.push(result);
    }
    return results;
  }

  async deleteFile(filepath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filepath);
      if (fs.existsSync(fullPath)) {
        await unlinkAsync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async createThumbnail(
    file: Express.Multer.File,
    width: number = 200,
    height: number = 200,
  ): Promise<{ filename: string; path: string; url: string; size: number }> {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type for thumbnail');
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `thumb-${timestamp}-${randomString}.webp`;
      const filepath = path.join(this.uploadPath, 'images', filename);

      await sharp(file.buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 70 })
        .toFile(filepath);

      const stats = await fs.promises.stat(filepath);
      const url = `/uploads/images/${filename}`;

      return {
        filename,
        path: filepath,
        url,
        size: stats.size,
      };
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new InternalServerErrorException('Failed to create thumbnail');
    }
  }

  getFileInfo(filepath: string): {
    exists: boolean;
    size?: number;
    extension?: string;
  } {
    try {
      const fullPath = path.join(process.cwd(), filepath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return {
          exists: true,
          size: stats.size,
          extension: path.extname(fullPath),
        };
      }
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }
}
