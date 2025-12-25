import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsJSON, IsArray } from 'class-validator';

export class CreateMedicalRecordDto {
    @IsNotEmpty()
    @IsString()
    appointment_id: string;

    @IsNotEmpty()
    @IsString()
    patient_id: string;

    @IsNotEmpty()
    @IsString()
    doctor_id: string;

    @IsNotEmpty()
    @IsString()
    diagnosis: string; // Chẩn đoán

    @IsNotEmpty()
    @IsString()
    symptoms: string; // Triệu chứng

    @IsOptional()
    clinical_data?: any; // Dữ liệu khám chi tiết (JSON)

    @ApiProperty({
        example: ['/uploads/images/abc.webp'],
        description: 'Danh sách đường dẫn ảnh đính kèm'
    })
    @IsOptional()
    @IsArray()
    attachments?: string[]; // Nhận vào một mảng các đường dẫn (URL) ảnh


}