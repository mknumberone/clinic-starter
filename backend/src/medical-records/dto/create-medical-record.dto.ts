import { IsNotEmpty, IsString, IsOptional, IsJSON } from 'class-validator';

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
}