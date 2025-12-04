import { Controller, Post, Body, Get, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Put, Param } from '@nestjs/common'; // Nhớ import thêm

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo tài khoản nhân viên mới (Admin/Manager)' })
    create(@Request() req, @Body(ValidationPipe) dto: CreateStaffDto) {
        return this.staffService.createStaff(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách nhân viên' })
    findAll(@Request() req) {
        return this.staffService.getStaffList(req.user.id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin nhân viên' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.staffService.updateStaff(id, updateDto);
    }
}