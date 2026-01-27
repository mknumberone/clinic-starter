import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExaminationPackageDto {
  @ApiProperty({ example: 'Gói khám sức khỏe tổng quát' })
  @IsNotEmpty({ message: 'Tên gói khám không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'goi-kham-suc-khoe-tong-quat', description: 'Slug dùng cho URL thân thiện' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false, example: 'health-check', description: 'Nhóm gói khám (để hiển thị trên Landing Page)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-specialization-id' })
  @IsNotEmpty({ message: 'Chuyên khoa không được để trống' })
  @IsString()
  specialization_id: string;

  @ApiProperty({ example: 500000, description: 'Giá gói khám (VND)' })
  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ required: false, example: 600000, description: 'Giá gốc (nếu có giảm giá)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  original_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ 
    required: false, 
    example: ['Khám tổng quát', 'Xét nghiệm máu', 'Siêu âm bụng'],
    description: 'Danh sách dịch vụ trong gói'
  })
  @IsOptional()
  @IsArray()
  services?: string[];

  @ApiProperty({ required: false, example: 120, description: 'Thời gian khám (phút)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}

export class UpdateExaminationPackageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialization_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  original_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  services?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}
