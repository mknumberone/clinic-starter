import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, IsInt, Min, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

// --- 1. DTO CHI TIẾT THUỐC (Cần thêm export) ---
export class PrescriptionItemDto {
  @ApiProperty({ example: 'uuid-thuoc', description: 'ID thuốc trong kho (Để trống nếu thuốc ngoài)', required: false })
  @IsOptional()
  @IsString()
  medication_id?: string; // Dấu ? và @IsOptional là bắt buộc để hỗ trợ thuốc ngoài

  @ApiProperty({ example: 'Panadol', description: 'Tên thuốc' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sáng 1, Chiều 1', required: false })
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiProperty({ example: 'Sau ăn', required: false })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}

// --- 2. DTO TẠO ĐƠN THUỐC ---
export class CreatePrescriptionDto {
  @ApiProperty({ example: 'uuid-lich-hen' })
  @IsNotEmpty()
  @IsString()
  appointment_id: string;

  @ApiProperty({ example: 'uuid-benh-an (nếu có)', required: false })
  @IsOptional()
  @IsString()
  medical_record_id?: string;

  @ApiProperty({ example: 'Lời dặn bác sĩ', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // ---> ĐÂY LÀ PHẦN BẠN ĐANG BỊ THIẾU HOẶC SAI <---
  @ApiProperty({ type: [PrescriptionItemDto], description: 'Danh sách thuốc' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}

// --- 3. DTO CHO MASTER DATA THUỐC ---
export class CreateMedicationDto {
  @ApiProperty({ example: 'MED001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Panadol Extra' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Viên nén', required: false })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiProperty({ example: 'Viên', required: false })
  @IsOptional()
  @IsString()
  base_unit?: string;

  @ApiProperty({ example: 'Hộp', required: false })
  @IsOptional()
  @IsString()
  import_unit?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  conversion_factor?: number;

  @ApiProperty({ example: 1000 })
  @IsOptional()
  @IsNumber()
  cost_price?: number;

  @ApiProperty({ example: 2000 })
  @IsOptional()
  @IsNumber()
  sell_price?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  profit_margin?: number;
}

export class UpdateMedicationDto extends CreateMedicationDto { }

// --- 4. DTO THANH TOÁN ---
export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-hoa-don' })
  @IsNotEmpty()
  @IsString()
  invoice_id: string;

  @ApiProperty({ example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}