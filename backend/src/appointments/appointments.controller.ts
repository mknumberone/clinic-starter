import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  ValidationPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, ChangeAppointmentStatusDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cuộc hẹn mới' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({ status: 201, description: 'Đặt lịch thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc trùng lịch' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân/bác sĩ/phòng' })
  async createAppointment(
    @Body(ValidationPipe) dto: CreateAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.createAppointment(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cuộc hẹn với bộ lọc' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Lọc theo bệnh nhân' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Lọc theo bác sĩ' })
  @ApiQuery({ name: 'roomId', required: false, description: 'Lọc theo phòng' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Từ ngày (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Đến ngày (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Danh sách cuộc hẹn' })
  async getAllAppointments(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getAllAppointments({
      userId: req.user.id,
      userRole: req.user.role,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      patientId,
      doctorId,
      roomId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Thông tin cuộc hẹn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async getAppointmentById(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async updateAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.updateAppointment(id, dto, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Thay đổi trạng thái cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiBody({ type: ChangeAppointmentStatusDto })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async changeAppointmentStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: ChangeAppointmentStatusDto,
    @Request() req,
  ) {
    return this.appointmentsService.changeAppointmentStatus(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        reason: { type: 'string', example: 'Bệnh nhân có việc bận' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'Hủy cuộc hẹn thành công' })
  @ApiResponse({ status: 400, description: 'Không thể hủy cuộc hẹn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async cancelAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.appointmentsService.cancelAppointment(id, req.user.id, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async deleteAppointment(@Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(id);
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Lấy lịch sử thay đổi trạng thái' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Lịch sử trạng thái' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc hẹn' })
  async getAppointmentStatusHistory(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentStatusHistory(id);
  }
}
