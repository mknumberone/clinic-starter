import { IsNotEmpty, IsString, Matches, MinLength, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại (định dạng Việt Nam)'
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ'
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại'
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ'
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 số'
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  otp: string;
}

export class RegisterDto {
  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại'
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ'
  })
  phone: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ'
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  full_name: string;

  @ApiProperty({
    example: 'nguyenvana@gmail.com',
    description: 'Email (không bắt buộc)',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 số nhận được qua SMS'
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  otp: string;
}

export class LoginDto {
  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại'
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ'
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 số'
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  otp: string;
}

// Thêm vào cuối file src/auth/dto/auth.dto.ts
export class RegisterEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng ký'
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu (tối thiểu 6 ký tự)'
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  password: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ'
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  full_name: string;
}

export class LoginEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng nhập'
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu'
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  password: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email cần gửi lại mã xác thực'
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}