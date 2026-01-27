import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicationDto {
    @ApiProperty({ example: 'Panadol Extra' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    base_unit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    import_unit?: string;

    @ApiProperty({ example: 1 })
    @IsOptional()
    @Type(() => Number) // <--- QUAN TRỌNG: Tự động ép kiểu sang số
    @IsNumber()
    conversion_factor?: number;

    @ApiProperty({ example: 1000 })
    @IsOptional()
    @Type(() => Number) // <--- QUAN TRỌNG
    @IsNumber()
    cost_price?: number;

    @ApiProperty({ example: 20 })
    @IsOptional()
    @Type(() => Number) // <--- QUAN TRỌNG
    @IsNumber()
    profit_margin?: number;

    @ApiProperty({ example: 2000 })
    @IsOptional()
    @Type(() => Number) // <--- QUAN TRỌNG
    @IsNumber()
    sell_price?: number;

    // --- CÁC TRƯỜNG MỚI (Đảm bảo phải có ở đây) ---
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    base_info?: any;
}