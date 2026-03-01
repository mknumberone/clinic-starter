import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('revenue/summary')
  @ApiOperation({ summary: 'Tổng quan doanh thu (tổng, TB/ngày, % so với kỳ trước)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getRevenueSummary({
      startDate,
      endDate,
      branchId: branchId || undefined,
    });
  }

  @Get('revenue/by-day')
  @ApiOperation({ summary: 'Doanh thu theo ngày' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueByDay(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getRevenueByDay({
      startDate,
      endDate,
      branchId: branchId || undefined,
    });
  }

  @Get('revenue/by-branch')
  @ApiOperation({ summary: 'Doanh thu theo chi nhánh' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getRevenueByBranch(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getRevenueByBranch({ startDate, endDate });
  }

  @Get('revenue/by-doctor')
  @ApiOperation({ summary: 'Doanh thu theo bác sĩ' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueByDoctor(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getRevenueByDoctor({
      startDate,
      endDate,
      branchId: branchId || undefined,
    });
  }

  @Get('revenue/by-specialization')
  @ApiOperation({ summary: 'Doanh thu theo chuyên khoa' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueBySpecialization(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getRevenueBySpecialization({
      startDate,
      endDate,
      branchId: branchId || undefined,
    });
  }

  @Get('patients/by-month')
  @ApiOperation({ summary: 'Bệnh nhân mới theo tháng' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getPatientsByMonth(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getPatientsByMonth({ startDate, endDate });
  }

  @Get('appointments/by-doctor')
  @ApiOperation({ summary: 'Lịch hẹn theo bác sĩ' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getAppointmentsByDoctor(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getAppointmentsByDoctor({
      startDate,
      endDate,
      branchId: branchId || undefined,
    });
  }
}
