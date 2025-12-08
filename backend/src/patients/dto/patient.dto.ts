import { IsNotEmpty, IsString, IsOptional, IsDateString, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePatientDto {
  @ApiProperty({ 
    example: 'Nguyễn Văn A', 
    description: 'Họ và tên', 
    required: false 
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ 
    example: '/uploads/images/avatar.webp', 
    description: 'Avatar URL', 
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ 
    example: '1990-01-01', 
    description: 'Ngày sinh (YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ 
    example: 'male', 
    description: 'Giới tính (male/female/other)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ 
    example: '123 Đường ABC, Quận 1, TP.HCM', 
    description: 'Địa chỉ', 
    required: false 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    example: { name: 'Nguyễn Thị B', phone: '0987654321', relationship: 'Vợ' }, 
    description: 'Thông tin liên hệ khẩn cấp', 
    required: false 
  })
  @IsOptional()
  emergency_contact?: any;

  @ApiProperty({ 
    example: { provider: 'BHYT', number: 'DN1234567890' }, 
    description: 'Thông tin bảo hiểm', 
    required: false 
  })
  @IsOptional()
  insurance?: any;
}
