import { IsNotEmpty, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid', description: 'ID bệnh nhân' })
  @IsNotEmpty({ message: 'ID bệnh nhân không được để trống' })
  @IsString()
  patient_id: string;

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
    example: 'scheduled', 
    description: 'Trạng thái (scheduled, confirmed, in-progress, completed, cancelled, no-show)',
    required: false 
  })
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
  status?: string;

  @ApiProperty({ example: 'Cần xét nghiệm máu', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeAppointmentStatusDto {
  @ApiProperty({ 
    example: 'confirmed', 
    description: 'Trạng thái mới (scheduled, confirmed, in-progress, completed, cancelled, no-show)' 
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
  status: string;

  @ApiProperty({ example: 'Bệnh nhân xác nhận', description: 'Lý do thay đổi', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
