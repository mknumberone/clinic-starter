import { PartialType } from '@nestjs/swagger';
import { CreateShiftDto } from './create-shift.dto';

// PartialType sẽ lấy tất cả các trường của CreateShiftDto 
// và chuyển chúng thành Optional (không bắt buộc)
export class UpdateShiftDto extends PartialType(CreateShiftDto) { }