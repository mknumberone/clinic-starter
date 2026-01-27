import { IsNotEmpty, IsString, IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class CreateShiftDto {
    // Nếu không có staff_id thì bắt buộc phải có doctor_id
    @ValidateIf(o => !o.staff_id)
    @IsNotEmpty({ message: 'Phải chọn Bác sĩ hoặc Nhân viên' })
    @IsString()
    doctor_id?: string;

    // Trường mới cho lễ tân (Optional)
    @IsOptional()
    @IsString()
    staff_id?: string;

    @IsNotEmpty()
    @IsString()
    room_id: string;

    @IsNotEmpty()
    @IsDateString()
    start_time: string;

    @IsNotEmpty()
    @IsDateString()
    end_time: string;

    @IsOptional()
    recurrence?: any;
}