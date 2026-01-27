import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Đảm bảo đã import Guard

@Controller('shifts')
@UseGuards(JwtAuthGuard) // Bắt buộc phải đăng nhập mới dùng được API này
export class ShiftsController {
    constructor(private readonly shiftsService: ShiftsService) { }

    @Get()
    findAll(@Request() req, @Query('start') start?: string, @Query('end') end?: string) {
        // req.user chứa thông tin: id, role, branch_id (từ AuthMiddleware)
        return this.shiftsService.findAll(req.user, start, end);
    }

    // File: src/shifts/shifts.controller.ts

    @Patch(':id/attendance')
    attendance(@Param('id') id: string, @Body() body: { type: 'CHECK_IN' | 'CHECK_OUT' }) {
        return this.shiftsService.attendance(id, body.type);
    }

    @Post()
    create(@Request() req, @Body() createShiftDto: CreateShiftDto) {
        return this.shiftsService.create(req.user, createShiftDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.shiftsService.remove(req.user, id);
    }
}