import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
    address: string;

    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    phone: string;

    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsOptional()
    email?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateBranchDto extends CreateBranchDto { }    