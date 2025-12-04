import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Class chứa thông tin thuốc mới (nếu nhập thuốc chưa có trong hệ thống)
class NewMedicationInfo {
    @ApiProperty({ example: 'Panadol Extra' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'MED-NEW-001', required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ example: 'Viên' })
    @IsNotEmpty()
    @IsString()
    base_unit: string;

    @ApiProperty({ example: 'Hộp', required: false })
    @IsOptional()
    @IsString()
    import_unit?: string;

    @ApiProperty({ example: 100 })
    @IsOptional()
    @IsNumber()
    conversion_factor?: number;

    @ApiProperty({ example: 20 })
    @IsOptional()
    @IsNumber()
    profit_margin?: number;

    @ApiProperty({ example: 5000 })
    @IsOptional()
    @IsNumber()
    sell_price?: number;
}

export class ImportInventoryItemDto {
    @ApiProperty({ description: 'ID thuốc (Bắt buộc nếu là thuốc cũ)', required: false })
    @IsOptional() // <--- SỬA THÀNH OPTIONAL
    @IsString()
    medication_id?: string;

    @ApiProperty({ description: 'Thông tin thuốc mới (Bắt buộc nếu không có medication_id)', required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => NewMedicationInfo)
    new_medication?: NewMedicationInfo; // <--- TRƯỜNG MỚI

    @ApiProperty({ description: 'Số lô' })
    @IsNotEmpty()
    @IsString()
    batch_number: string;

    @ApiProperty({ description: 'Ngày sản xuất' })
    @IsNotEmpty()
    @IsDateString()
    mfg_date: string;

    @ApiProperty({ description: 'Hạn sử dụng' })
    @IsNotEmpty()
    @IsDateString()
    expiry_date: string;

    // --- CÁC TRƯỜNG SỐ LƯỢNG ---
    @ApiProperty({ description: 'Số lượng Thùng', example: 5 })
    @IsNotEmpty() @IsNumber() @Min(0)
    quantity_cartons: number;

    @ApiProperty({ description: 'Hộp/Thùng', example: 20 })
    @IsNotEmpty() @IsNumber() @Min(1)
    boxes_per_carton: number;

    @ApiProperty({ description: 'Vỉ/Hộp', example: 10 })
    @IsNotEmpty() @IsNumber() @Min(1)
    blisters_per_box: number;

    @ApiProperty({ description: 'Viên/Vỉ', example: 10 })
    @IsNotEmpty() @IsNumber() @Min(1)
    pills_per_blister: number;

    @ApiProperty({ description: 'Tổng tiền nhập (VNĐ)', example: 5000000 })
    @IsNotEmpty() @IsNumber() @Min(0)
    total_import_cost: number;
}

export class ImportInventoryDto {
    @ApiProperty({ example: 'uuid', description: 'ID chi nhánh nhập kho' })
    @IsNotEmpty()
    @IsString()
    branch_id: string;

    @ApiProperty({ type: [ImportInventoryItemDto] })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ImportInventoryItemDto)
    items: ImportInventoryItemDto[];
}