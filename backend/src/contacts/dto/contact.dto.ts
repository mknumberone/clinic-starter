import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Đặt lịch khám' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Tôi muốn đặt lịch khám tổng quát...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patient_id?: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ enum: ['NEW', 'READ', 'REPLIED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Phản hồi từ admin' })
  @IsOptional()
  @IsString()
  admin_reply?: string;
}
