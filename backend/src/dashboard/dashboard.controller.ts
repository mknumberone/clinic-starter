import { Controller, Get, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin/stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan cho admin' })
  @ApiResponse({ status: 200, description: 'Thống kê tổng quan' })
  async getAdminStats(@Request() req) {
    // TODO: Add role-based guard for admin only
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/appointments')
  @ApiOperation({ summary: 'Lấy thống kê cuộc hẹn theo khoảng thời gian' })
  @ApiQuery({ name: 'startDate', example: '2025-01-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', example: '2025-12-31', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Thống kê cuộc hẹn' })
  async getAppointmentsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getAppointmentsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('admin/revenue')
  @ApiOperation({ summary: 'Lấy thống kê doanh thu theo khoảng thời gian' })
  @ApiQuery({ name: 'startDate', example: '2025-01-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', example: '2025-12-31', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Thống kê doanh thu' })
  async getRevenueByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getRevenueByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('admin/upcoming-appointments')
  @ApiOperation({ summary: 'Lấy danh sách cuộc hẹn sắp tới' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số lượng kết quả' })
  @ApiResponse({ status: 200, description: 'Danh sách cuộc hẹn sắp tới' })
  async getUpcomingAppointments(@Query('limit', ParseIntPipe) limit?: number) {
    return this.dashboardService.getUpcomingAppointments(limit || 10);
  }

  @Get('patient')
  @ApiOperation({ summary: 'Lấy dashboard cho bệnh nhân' })
  @ApiResponse({ status: 200, description: 'Dashboard bệnh nhân' })
  async getPatientDashboard(@Request() req) {
    if (!req.user.patient_id) {
      return { message: 'Bạn không phải là bệnh nhân' };
    }
    return this.dashboardService.getPatientDashboard(req.user.patient_id);
  }

  @Get('doctor')
  @ApiOperation({ summary: 'Lấy dashboard cho bác sĩ' })
  @ApiResponse({ status: 200, description: 'Dashboard bác sĩ' })
  async getDoctorDashboard(@Request() req) {
    if (!req.user.doctor_id) {
      return { message: 'Bạn không phải là bác sĩ' };
    }
    return this.dashboardService.getDoctorDashboard(req.user.doctor_id);
  }
}
