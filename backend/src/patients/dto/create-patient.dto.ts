import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePatientDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    password?: string; // Mật khẩu (Frontend gửi lên hoặc Backend tự sinh)

    @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
    @IsNotEmpty()
    @IsString()
    gender: string;

    @ApiProperty()
    @IsNotEmpty()
    date_of_birth: string | Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;
}