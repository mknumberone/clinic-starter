import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request, ValidationPipe, Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  ChangeAppointmentStatusDto,
  GetAvailableSlotsDto
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from '@prisma/client';

const normalizeStatusParam = (value?: string): AppointmentStatus | undefined => {
  if (!value) return undefined;
  const normalized = value.replace(/-/g, '_').toUpperCase();
  if (normalized in AppointmentStatus) {
    return AppointmentStatus[normalized as keyof typeof AppointmentStatus];
  }
  return undefined;
};

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) { }

  // --- API MỚI: Lấy slot trống ---
  @Get('available-slots')
  @ApiOperation({ summary: 'Lấy danh sách khung giờ trống (slots)' })
  async getAvailableSlots(@Query(ValidationPipe) dto: GetAvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(dto);
  }

  // --- API Đặt lịch (Đã nâng cấp) ---
  @Post()
  @ApiOperation({ summary: 'Tạo cuộc hẹn mới' })
  async createAppointment(@Body(ValidationPipe) dto: CreateAppointmentDto, @Request() req) {
    // Tự động lấy branch_id từ user nếu user là nhân viên và chưa gửi branch_id
    const payload = {
      ...dto,
      branch_id: dto.branch_id || req.user.branch_id
    };
    return this.appointmentsService.createAppointment(payload, req.user.id);
  }

  // --- Các API cũ (GetAll, GetById, Update, Cancel...) ---

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cuộc hẹn với bộ lọc' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAllAppointments(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('roomId') roomId?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('x-branch-id') branchHeader?: string,
  ) {
    const effectiveBranchId = branchId || branchHeader || undefined;
    const normalizedStatus = normalizeStatusParam(status);
    return this.appointmentsService.getAllAppointments({
      userId: req.user.id,
      userRole: req.user.role,
      userBranchId: req.user.branch_id,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status: normalizedStatus,
      patientId,
      doctorId,
      roomId,
      branchId: effectiveBranchId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  async getAppointmentById(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentById(id);
  }

  @Put(':id')
  async updateAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.updateAppointment(id, dto, req.user.id);
  }

  @Put(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: ChangeAppointmentStatusDto,
    @Request() req,
  ) {
    return this.appointmentsService.changeAppointmentStatus(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.appointmentsService.cancelAppointment(id, req.user.id, reason);
  }

  @Delete(':id')
  async deleteAppointment(@Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(id);
  }

  @Get(':id/status-history')
  async getHistory(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentStatusHistory(id);
  }
}