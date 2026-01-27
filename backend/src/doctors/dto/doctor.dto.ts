import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// --- DTO CHO BÁC SĨ ---
export class CreateDoctorDto {
  @ApiProperty({ example: 'BS001', description: 'Mã bác sĩ', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Bác sĩ', description: 'Chức danh (Bác sĩ, Thạc sĩ, Tiến sĩ)', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Bác sĩ có 10 năm kinh nghiệm', description: 'Tiểu sử', required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({
    example: { degree: 'Bác sĩ Đa khoa', university: 'ĐH Y Hà Nội', year: 2010 },
    description: 'Bằng cấp và chứng chỉ',
    required: false
  })
  @IsOptional()
  qualifications?: any;
}

export class UpdateDoctorDto {
  @ApiProperty({ example: 'BS001', description: 'Mã bác sĩ', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Tiến sĩ', description: 'Chức danh', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Chuyên gia tim mạch', description: 'Tiểu sử', required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ description: 'Bằng cấp', required: false })
  @IsOptional()
  qualifications?: any;

  // --- Fields của bảng USER (Cần thêm vào để sửa) ---
  @ApiProperty({ description: 'ID chuyên khoa', required: false })
  @IsOptional()
  @IsString()
  specialization_id?: string;  // <--- Backend đang lỗi dòng này vì thiếu nó

  @ApiProperty({ description: 'Họ tên', required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ description: 'Số điện thoại', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'Chi nhánh', required: false })
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiProperty({ description: 'Thời gian khám trung bình (phút)', required: false, example: 15 })
  @IsOptional()
  @IsInt()
  average_time?: number;
}

// src/doctors/dto/doctor.dto.ts

export class CreateSpecializationDto {
  @ApiProperty({ example: 'Nội khoa' })
  @IsNotEmpty({ message: 'Tên chuyên khoa không được để trống' })
  @IsString()
  name: string;

  // --- CÁC TRƯỜNG MỚI ---
  @ApiProperty({ example: 'noi-khoa', description: 'URL thân thiện (slug)' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string; // Link ảnh bìa

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string; // Icon nhỏ

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string; // Nội dung bài viết HTML
  // ---------------------

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSpecializationDto {
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
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}