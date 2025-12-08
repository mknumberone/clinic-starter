import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ValidationPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/patient.dto';
import { CreatePatientDto } from './dto/create-patient.dto'; // Đảm bảo đã tạo file này
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) { }

  // ---> API MỚI: TẠO BỆNH NHÂN <---
  // Lưu ý: Tạm thời bỏ UseGuards nếu muốn cho phép đăng ký public, 
  // hoặc giữ nguyên nếu chỉ Admin/Staff được tạo.
  @Post()
  @UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập (Admin/Lễ tân tạo hộ)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo hồ sơ bệnh nhân mới (kèm tài khoản)' })
  async create(@Body(ValidationPipe) dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách bệnh nhân (Admin/Doctor)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, enum: ['male', 'female', 'other'] })
  @ApiQuery({ name: 'minAge', required: false, type: Number })
  @ApiQuery({ name: 'maxAge', required: false, type: Number })
  @ApiQuery({ name: 'user_id', required: false, type: String, description: 'Filter by user_id' })
  @ApiResponse({ status: 200, description: 'Danh sách bệnh nhân' })
  async getPatients(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('gender') gender?: string,
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
    @Query('user_id') filterUserId?: string,
  ) {
    return this.patientsService.getPatients({
      userId: req.user.id,
      userRole: req.user.role,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      gender,
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      filterUserId,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Thông tin bệnh nhân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân' })
  async getProfile(@Param('id') id: string) {
    return this.patientsService.getProfile(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật hồ sơ bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiBody({ type: UpdatePatientDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân' })
  async updateProfile(
    @Param('id') id: string,
    @Request() req,
    @Body(ValidationPipe) dto: UpdatePatientDto,
  ) {
    return this.patientsService.updateProfile(id, req.user.id, dto);
  }

  @Get(':id/appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách lịch hẹn của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách lịch hẹn' })
  async getAppointments(@Param('id') id: string, @Request() req) {
    return this.patientsService.getAppointments(id, req.user.id);
  }

  @Get(':id/prescriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách đơn thuốc của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn thuốc' })
  async getPrescriptions(@Param('id') id: string, @Request() req) {
    return this.patientsService.getPrescriptions(id, req.user.id);
  }

  @Get(':id/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách hóa đơn' })
  async getInvoices(@Param('id') id: string, @Request() req) {
    return this.patientsService.getInvoices(id, req.user.id);
  }
}