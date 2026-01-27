import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator'; // Nhớ import thêm IsBoolean


export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid', description: 'ID bệnh nhân' })
  @IsNotEmpty({ message: 'ID bệnh nhân không được để trống' })
  @IsString()
  patient_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID chi nhánh' })
  @IsNotEmpty({ message: 'Vui lòng chọn chi nhánh' })
  @IsString()
  branch_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID phòng khám', required: false })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ example: 'uuid', description: 'ID bác sĩ', required: false })
  @IsOptional()
  @IsString()
  doctor_assigned_id?: string;

  @ApiProperty({ example: 'checkup', description: 'Loại cuộc hẹn (checkup, follow-up, emergency)', required: false })
  @IsOptional()
  @IsString()
  appointment_type?: string;

  @ApiProperty({ example: '2025-11-14T09:00:00Z', description: 'Thời gian bắt đầu' })
  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  @IsDateString()
  start_time: string;

  @ApiProperty({ example: '2025-11-14T09:30:00Z', description: 'Thời gian kết thúc' })
  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @IsDateString()
  end_time: string;

  @ApiProperty({ example: 'online', description: 'Nguồn đặt lịch (online, phone, walk-in)', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ example: 'Khám tổng quát', description: 'Ghi chú', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: true, description: 'Cờ xác nhận đặt lịch dù chưa có ca trực', required: false })
  @IsOptional()
  @IsBoolean() // Hoặc @IsString() nếu form-data gửi string, nhưng tốt nhất là boolean
  confirm_booking?: boolean;
}

export class UpdateAppointmentDto {
  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  doctor_assigned_id?: string;

  @ApiProperty({ example: 'follow-up', required: false })
  @IsOptional()
  @IsString()
  appointment_type?: string;

  @ApiProperty({ example: '2025-11-14T09:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @ApiProperty({ example: '2025-11-14T09:30:00Z', required: false })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({
    example: AppointmentStatus.SCHEDULED,
    description: 'Trạng thái cuộc hẹn',
    enum: AppointmentStatus,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? value.replace(/-/g, '_').toUpperCase() : value)
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ example: 'Cần xét nghiệm máu', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeAppointmentStatusDto {
  @ApiProperty({
    example: AppointmentStatus.CONFIRMED,
    description: 'Trạng thái mới',
    enum: AppointmentStatus
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @Transform(({ value }) => value ? value.replace(/-/g, '_').toUpperCase() : value)
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiProperty({ example: 'Bệnh nhân xác nhận', description: 'Lý do thay đổi', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ---> THÊM CLASS NÀY VÀO CUỐI FILE
export class GetAvailableSlotsDto {
  @ApiProperty({ example: '2025-11-25', description: 'Ngày muốn khám' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'uuid', description: 'ID chi nhánh' })
  @IsNotEmpty()
  @IsString()
  branch_id: string;

  @ApiProperty({ required: false, description: 'ID chuyên khoa (để lọc bác sĩ)' })
  @IsOptional()
  @IsString()
  specialization_id?: string;

  @ApiProperty({ required: false, description: 'ID bác sĩ (nếu chọn đích danh)' })
  @IsOptional()
  @IsString()
  doctor_id?: string;


}

// ---> COPY ĐOẠN NÀY VÀO CUỐI FILE
export class CreateRecurringAppointmentDto extends CreateAppointmentDto {
  @ApiProperty({ example: 3, description: 'Số lần lặp lại' })
  @IsNumber()
  recurring_count: number;

  @ApiProperty({ example: 1, description: 'Khoảng cách tháng (ví dụ 1 tháng/lần)' })
  @IsNumber()
  interval_months: number;
}