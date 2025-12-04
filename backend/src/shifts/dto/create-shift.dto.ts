import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateShiftDto {
    @IsNotEmpty()
    @IsString()
    doctor_id: string;

    @IsNotEmpty()
    @IsString()
    room_id: string;

    @IsNotEmpty()
    @IsDateString()
    start_time: string; // Định dạng ISO-8601 (YYYY-MM-DDTHH:mm:ss)

    @IsNotEmpty()
    @IsDateString()
    end_time: string;

    @IsOptional()
    recurrence?: any; // Nếu sau này muốn làm lịch lặp lại hàng tuần
}