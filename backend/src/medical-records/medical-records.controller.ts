import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('medical-records')
@Controller('medical-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MedicalRecordsController {
    constructor(private readonly service: MedicalRecordsService) { }

    @Post()
    create(@Body() dto: CreateMedicalRecordDto) {
        return this.service.create(dto);
    }

    @Get('my-records')
    @ApiOperation({ summary: 'Lấy lịch sử khám bệnh của bệnh nhân đang đăng nhập' })
    async getMyRecords(@Request() req) {
        // Chỉ cho phép ROLE PATIENT gọi (nếu cần bảo mật kỹ hơn thì thêm Guard)
        return this.service.findAllByPatient(req.user.id);
    }
}