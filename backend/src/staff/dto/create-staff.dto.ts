import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
    @ApiProperty({ example: 'doctor@clinic.com' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({ example: '0988888888' })
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'Nguyen Van A' })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsString()
    full_name: string;

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    password: string;

    @ApiProperty({ enum: UserRole, example: UserRole.DOCTOR })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiProperty({ example: 'uuid-branch', required: false, description: 'Bắt buộc nếu là Admin tạo' })
    @IsOptional()
    @IsString()
    branch_id?: string; // Optional vì Manager không cần gửi (tự lấy)
}