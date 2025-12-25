import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadImageDto, UploadDocumentDto, UploadMultipleImagesDto } from './dto/upload.dto';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        width: {
          type: 'number',
          description: 'Optional resize width',
        },
        height: {
          type: 'number',
          description: 'Optional resize height',
        },
        quality: {
          type: 'number',
          description: 'Image quality (1-100), default 80',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const options = {
      resize: {
        width: body.width ? parseInt(body.width as any) : undefined,
        height: body.height ? parseInt(body.height as any) : undefined,
      },
      quality: body.quality ? parseInt(body.quality as any) : 80,
    };

    const result = await this.uploadService.uploadImage(file, options);

    return {
      success: true,
      data: result,
    };
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload document (PDF, Word, Excel)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadDocument(file);

    return {
      success: true,
      data: result,
    };
  }

  @Post('images/multiple')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        width: {
          type: 'number',
          description: 'Optional resize width',
        },
        height: {
          type: 'number',
          description: 'Optional resize height',
        },
        quality: {
          type: 'number',
          description: 'Image quality (1-100), default 80',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadMultipleImagesDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const options = {
      resize: {
        width: body.width ? parseInt(body.width as any) : undefined,
        height: body.height ? parseInt(body.height as any) : undefined,
      },
      quality: body.quality ? parseInt(body.quality as any) : 80,
    };

    const results = await this.uploadService.uploadMultipleImages(files, options);

    return {
      success: true,
      data: results,
      count: results.length,
    };
  }

  @Post('thumbnail')
  @ApiOperation({ summary: 'Upload image and create thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        thumbnailWidth: {
          type: 'number',
          description: 'Thumbnail width (default 200)',
        },
        thumbnailHeight: {
          type: 'number',
          description: 'Thumbnail height (default 200)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadWithThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Upload original image
    const original = await this.uploadService.uploadImage(file);

    // Create thumbnail
    const thumbnailWidth = body.thumbnailWidth
      ? parseInt(body.thumbnailWidth)
      : 200;
    const thumbnailHeight = body.thumbnailHeight
      ? parseInt(body.thumbnailHeight)
      : 200;
    const thumbnail = await this.uploadService.createThumbnail(
      file,
      thumbnailWidth,
      thumbnailHeight,
    );

    return {
      success: true,
      data: {
        original,
        thumbnail,
      },
    };
  }

  @Delete('file')
  @ApiOperation({ summary: 'Delete uploaded file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          example: '/uploads/images/1234567890-abc123.webp',
        },
      },
    },
  })
  async deleteFile(@Body('filepath') filepath: string) {
    if (!filepath) {
      throw new BadRequestException('Filepath is required');
    }

    await this.uploadService.deleteFile(filepath);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Post('file/info')
  @ApiOperation({ summary: 'Get file information' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          example: '/uploads/images/1234567890-abc123.webp',
        },
      },
    },
  })
  getFileInfo(@Body('filepath') filepath: string) {
    if (!filepath) {
      throw new BadRequestException('Filepath is required');
    }

    const info = this.uploadService.getFileInfo(filepath);

    return {
      success: true,
      data: info,
    };
  }
}
