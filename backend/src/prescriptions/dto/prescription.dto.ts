import { IsNotEmpty, IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'uuid', description: 'ID thuốc (nếu có trong danh mục)', required: false })
  @IsOptional()
  @IsString()
  medication_id?: string;

  @ApiProperty({ example: 'Paracetamol 500mg', description: 'Tên thuốc' })
  @IsNotEmpty({ message: 'Tên thuốc không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({ example: '500mg', description: 'Liều lượng', required: false })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiProperty({ example: '2 lần/ngày', description: 'Tần suất', required: false })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiProperty({ example: '7 ngày', description: 'Thời gian sử dụng', required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ example: 'Uống sau ăn', description: 'Hướng dẫn sử dụng', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'uuid', description: 'ID cuộc hẹn', required: false })
  @IsOptional()
  @IsString()
  appointment_id?: string;

  @ApiProperty({ example: 'uuid', description: 'ID bệnh nhân' })
  @IsNotEmpty({ message: 'ID bệnh nhân không được để trống' })
  @IsString()
  patient_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID bác sĩ' })
  @IsNotEmpty({ message: 'ID bác sĩ không được để trống' })
  @IsString()
  doctor_id: string;

  @ApiProperty({ example: 'Uống đủ nước, nghỉ ngơi', description: 'Ghi chú', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PrescriptionItemDto], description: 'Danh sách thuốc' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}

export class CreateMedicationDto {
  @ApiProperty({ example: 'MED001', description: 'Mã thuốc', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Paracetamol 500mg', description: 'Tên thuốc' })
  @IsNotEmpty({ message: 'Tên thuốc không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Viên nén', description: 'Dạng bào chế', required: false })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiProperty({ 
    example: { manufacturer: 'ABC Pharma', activeIngredient: 'Paracetamol' },
    description: 'Thông tin cơ bản',
    required: false 
  })
  @IsOptional()
  base_info?: any;
}

export class UpdateMedicationDto {
  @ApiProperty({ example: 'MED001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Paracetamol 500mg', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Viên nang', required: false })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  base_info?: any;
}

export class InvoiceItemDto {
  @ApiProperty({ example: 'Phí khám bệnh', description: 'Mô tả' })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  description: string;

  @ApiProperty({ example: 200000, description: 'Số tiền' })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 1, description: 'Số lượng', required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid', description: 'ID cuộc hẹn', required: false })
  @IsOptional()
  @IsString()
  appointment_id?: string;

  @ApiProperty({ example: 'uuid', description: 'ID bệnh nhân' })
  @IsNotEmpty({ message: 'ID bệnh nhân không được để trống' })
  @IsString()
  patient_id: string;

  @ApiProperty({ type: [InvoiceItemDto], description: 'Danh sách chi tiết hóa đơn' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ example: 'paid', description: 'Trạng thái (unpaid, paid, partially-paid, cancelled)' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsString()
  status: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid', description: 'ID hóa đơn' })
  @IsNotEmpty({ message: 'ID hóa đơn không được để trống' })
  @IsString()
  invoice_id: string;

  @ApiProperty({ example: 200000, description: 'Số tiền thanh toán' })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'cash', description: 'Phương thức thanh toán (cash, card, transfer)', required: false })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({ example: 'TXN123456', description: 'Mã giao dịch', required: false })
  @IsOptional()
  @IsString()
  transaction_id?: string;
}
