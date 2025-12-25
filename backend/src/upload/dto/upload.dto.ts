import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UploadImageDto {
  @ApiPropertyOptional({ description: 'Resize width', type: 'number' })
  @IsOptional()
  width?: number | string;

  @ApiPropertyOptional({ description: 'Resize height', type: 'number' })
  @IsOptional()
  height?: number | string;

  @ApiPropertyOptional({ description: 'Image quality (1-100)', default: 80, type: 'number' })
  @IsOptional()
  quality?: number | string;
}

export class UploadDocumentDto {
  // No additional fields needed for basic document upload
}

export class UploadMultipleImagesDto extends UploadImageDto {
  // Inherits width, height, quality from UploadImageDto
}

export class DeleteFileDto {
  @ApiProperty({ description: 'File path to delete', example: '/uploads/images/1234567890-abc123.webp' })
  filepath: string;
}

export class FileInfoDto {
  @ApiProperty({ description: 'File path to check', example: '/uploads/images/1234567890-abc123.webp' })
  filepath: string;
}
