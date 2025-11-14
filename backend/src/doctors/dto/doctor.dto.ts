import { IsNotEmpty, IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}

export class CreateSpecializationDto {
  @ApiProperty({ example: 'Tim mạch', description: 'Tên chuyên khoa' })
  @IsNotEmpty({ message: 'Tên chuyên khoa không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Khám và điều trị các bệnh về tim mạch', description: 'Mô tả', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSpecializationDto {
  @ApiProperty({ example: 'Tim mạch', description: 'Tên chuyên khoa', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Khám và điều trị bệnh tim', description: 'Mô tả', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRoomDto {
  @ApiProperty({ example: 'Phòng khám 101', description: 'Tên phòng' })
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'P101', description: 'Mã phòng' })
  @IsNotEmpty({ message: 'Mã phòng không được để trống' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'uuid', description: 'ID chuyên khoa', required: false })
  @IsOptional()
  @IsString()
  specialization_id?: string;

  @ApiProperty({ example: 'Tầng 1', description: 'Tầng', required: false })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiProperty({ example: 2, description: 'Sức chứa', required: false })
  @IsOptional()
  capacity?: number;

  @ApiProperty({ description: 'Thông tin khác', required: false })
  @IsOptional()
  metadata?: any;
}

export class UpdateRoomDto {
  @ApiProperty({ example: 'Phòng khám 101', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'P101', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  specialization_id?: string;

  @ApiProperty({ example: 'Tầng 2', required: false })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class CreateDoctorShiftDto {
  @ApiProperty({ example: 'uuid', description: 'ID bác sĩ' })
  @IsNotEmpty({ message: 'ID bác sĩ không được để trống' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID phòng' })
  @IsNotEmpty({ message: 'ID phòng không được để trống' })
  @IsString()
  room_id: string;

  @ApiProperty({ example: '2025-11-14T08:00:00Z', description: 'Thời gian bắt đầu' })
  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2025-11-14T17:00:00Z', description: 'Thời gian kết thúc' })
  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @IsDateString()
  end_time: string;

  @ApiProperty({ 
    example: { type: 'weekly', days: ['monday', 'wednesday', 'friday'] },
    description: 'Lặp lại',
    required: false 
  })
  @IsOptional()
  recurrence?: any;
}

export class UpdateDoctorShiftDto {
  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ example: '2025-11-14T08:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ example: '2025-11-14T17:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  recurrence?: any;
}
