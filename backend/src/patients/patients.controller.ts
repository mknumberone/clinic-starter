import { Controller, Get, Put, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Thông tin bệnh nhân' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân' })
  async getProfile(@Param('id') id: string) {
    return this.patientsService.getProfile(id);
  }

  @Put(':id')
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
  @ApiOperation({ summary: 'Lấy danh sách lịch hẹn của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách lịch hẹn' })
  async getAppointments(@Param('id') id: string, @Request() req) {
    return this.patientsService.getAppointments(id, req.user.id);
  }

  @Get(':id/prescriptions')
  @ApiOperation({ summary: 'Lấy danh sách đơn thuốc của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn thuốc' })
  async getPrescriptions(@Param('id') id: string, @Request() req) {
    return this.patientsService.getPrescriptions(id, req.user.id);
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn của bệnh nhân' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Danh sách hóa đơn' })
  async getInvoices(@Param('id') id: string, @Request() req) {
    return this.patientsService.getInvoices(id, req.user.id);
  }
}
