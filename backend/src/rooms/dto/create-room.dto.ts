import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    branch_id: string;

    @IsOptional()
    @IsString()
    specialization_id?: string;

    @IsOptional()
    @IsString()
    floor?: string;

    // ---> THÊM TRƯỜNG TÒA NHÀ
    @IsOptional()
    @IsString()
    building?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;
}

export class UpdateRoomDto extends CreateRoomDto { }