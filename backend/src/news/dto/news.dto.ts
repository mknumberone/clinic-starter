import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: '10 Dấu hiệu cảnh báo sức khỏe', description: 'Tiêu đề bài viết' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: '10-dau-hieu-canh-bao-suc-khoe', description: 'URL slug (tự động tạo nếu không có)', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Nhận biết sớm các dấu hiệu...', description: 'Tóm tắt ngắn', required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: '<h2>Nội dung chi tiết</h2><p>...</p>', description: 'Nội dung HTML', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'BS. Nguyễn Văn A', description: 'Tác giả', required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ example: 'Sức khỏe tổng quát', description: 'Danh mục', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Ảnh bìa', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: false, description: 'Trạng thái xuất bản', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class UpdateNewsDto {
  @ApiProperty({ example: '10 Dấu hiệu cảnh báo sức khỏe', description: 'Tiêu đề bài viết', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '10-dau-hieu-canh-bao-suc-khoe', description: 'URL slug', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Nhận biết sớm các dấu hiệu...', description: 'Tóm tắt ngắn', required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: '<h2>Nội dung chi tiết</h2><p>...</p>', description: 'Nội dung HTML', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'BS. Nguyễn Văn A', description: 'Tác giả', required: false })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ example: 'Sức khỏe tổng quát', description: 'Danh mục', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Ảnh bìa', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, description: 'Trạng thái xuất bản', required: false })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}
