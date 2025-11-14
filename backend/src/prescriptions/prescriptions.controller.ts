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
  ValidationPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { 
  CreatePrescriptionDto,
  CreateMedicationDto,
  UpdateMedicationDto,
  CreateInvoiceDto,
  UpdateInvoiceStatusDto,
  CreatePaymentDto
} from './dto/prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn thuốc mới' })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiResponse({ status: 201, description: 'Tạo đơn thuốc thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân/bác sĩ' })
  async createPrescription(@Body(ValidationPipe) dto: CreatePrescriptionDto) {
    return this.prescriptionsService.createPrescription(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn thuốc' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Lọc theo bệnh nhân' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Lọc theo bác sĩ' })
  @ApiQuery({ name: 'appointmentId', required: false, description: 'Lọc theo cuộc hẹn' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn thuốc' })
  async getAllPrescriptions(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('appointmentId') appointmentId?: string,
  ) {
    return this.prescriptionsService.getAllPrescriptions({
      patientId,
      doctorId,
      appointmentId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn thuốc' })
  @ApiParam({ name: 'id', description: 'Prescription ID' })
  @ApiResponse({ status: 200, description: 'Thông tin đơn thuốc' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn thuốc' })
  async getPrescriptionById(@Param('id') id: string) {
    return this.prescriptionsService.getPrescriptionById(id);
  }
}

@ApiTags('medications')
@Controller('medications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MedicationsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thuốc' })
  @ApiResponse({ status: 200, description: 'Danh sách thuốc' })
  async getAllMedications() {
    return this.prescriptionsService.getAllMedications();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết thuốc' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  @ApiResponse({ status: 200, description: 'Thông tin thuốc' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thuốc' })
  async getMedicationById(@Param('id') id: string) {
    return this.prescriptionsService.getMedicationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm thuốc mới vào danh mục' })
  @ApiBody({ type: CreateMedicationDto })
  @ApiResponse({ status: 201, description: 'Thêm thuốc thành công' })
  @ApiResponse({ status: 400, description: 'Mã thuốc đã tồn tại' })
  async createMedication(@Body(ValidationPipe) dto: CreateMedicationDto) {
    return this.prescriptionsService.createMedication(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thuốc' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  @ApiBody({ type: UpdateMedicationDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thuốc' })
  async updateMedication(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateMedicationDto,
  ) {
    return this.prescriptionsService.updateMedication(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thuốc khỏi danh mục' })
  @ApiParam({ name: 'id', description: 'Medication ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thuốc' })
  async deleteMedication(@Param('id') id: string) {
    return this.prescriptionsService.deleteMedication(id);
  }
}

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InvoicesController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hóa đơn mới' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({ status: 201, description: 'Tạo hóa đơn thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân' })
  async createInvoice(@Body(ValidationPipe) dto: CreateInvoiceDto) {
    return this.prescriptionsService.createInvoice(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Lọc theo bệnh nhân' })
  @ApiResponse({ status: 200, description: 'Danh sách hóa đơn' })
  async getAllInvoices(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.prescriptionsService.getAllInvoices({ status, patientId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hóa đơn' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Thông tin hóa đơn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  async getInvoiceById(@Param('id') id: string) {
    return this.prescriptionsService.getInvoiceById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái hóa đơn' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiBody({ type: UpdateInvoiceStatusDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateInvoiceStatusDto,
  ) {
    return this.prescriptionsService.updateInvoiceStatus(id, dto);
  }
}

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán cho hóa đơn' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Thanh toán thành công' })
  @ApiResponse({ status: 400, description: 'Số tiền thanh toán không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  async createPayment(@Body(ValidationPipe) dto: CreatePaymentDto) {
    return this.prescriptionsService.createPayment(dto);
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Lấy danh sách thanh toán của hóa đơn' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Danh sách thanh toán' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  async getPaymentsByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.prescriptionsService.getPaymentsByInvoice(invoiceId);
  }
}
