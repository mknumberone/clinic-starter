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
  ValidationPipe,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import {
  CreatePrescriptionDto,
  CreateMedicationDto,
  UpdateMedicationDto,
  CreatePaymentDto
} from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) { }

  // ============= PRESCRIPTIONS =============

  @Post()
  @ApiOperation({ summary: 'Tạo đơn thuốc (Tự động tạo Hóa đơn UNPAID)' })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiResponse({ status: 201, description: 'Tạo đơn thuốc và hóa đơn thành công' })
  async createPrescription(
    @Body(ValidationPipe) dto: CreatePrescriptionDto,
    // Dùng Request để lấy thông tin user đang đăng nhập (branch hiện tại của bác sĩ)
    @Request() req: any,
  ) {
    const userBranchId = req.user?.branch_id;
    return this.prescriptionsService.createPrescription(dto, userBranchId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn thuốc' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  async getAllPrescriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.prescriptionsService.getAllPrescriptions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      patientId,
      doctorId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn thuốc' })
  @ApiParam({ name: 'id' })
  async getPrescriptionById(@Param('id') id: string) {
    return this.prescriptionsService.getPrescriptionById(id);
  }

  // ============= MEDICATIONS (Thuốc) =============

  // Tìm đoạn @Get('medications/list') và thay thế bằng đoạn này:

  @Get('medications/list')
  @ApiOperation({ summary: 'Lấy danh sách thuốc kèm số lượng tồn kho' })
  async getMedicationsList(@Request() req) {
    // Lấy branch_id của user đang đăng nhập (nếu có)
    // Nếu là Admin thì có thể xem tất cả hoặc cần truyền query param (ở đây mình mặc định lấy tất cả nếu là admin chưa chọn branch)
    const branchId = req.user.branch_id;
    return this.prescriptionsService.getMedicationsList(branchId);
  }

  @Post('medications')
  @ApiOperation({ summary: 'Thêm thuốc mới' })
  async createMedication(@Body(ValidationPipe) dto: CreateMedicationDto) {
    return this.prescriptionsService.createMedication(dto);
  }

  @Put('medications/:id')
  @ApiOperation({ summary: 'Cập nhật thuốc' })
  async updateMedication(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateMedicationDto,
  ) {
    return this.prescriptionsService.updateMedication(id, dto);
  }

  @Delete('medications/:id')
  @ApiOperation({ summary: 'Xóa thuốc' })
  async deleteMedication(@Param('id') id: string) {
    return this.prescriptionsService.deleteMedication(id);
  }

  // ============= INVOICES & PAYMENTS (Hóa đơn & Thanh toán) =============

  @Post('payments')
  @ApiOperation({ summary: 'Thanh toán hóa đơn (Tự động trừ kho khi PAID)' })
  @ApiBody({ type: CreatePaymentDto })
  async createPayment(@Body(ValidationPipe) dto: CreatePaymentDto) {
    return this.prescriptionsService.createPayment(dto);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Lấy chi tiết hóa đơn' })
  async getInvoiceById(@Param('id') id: string) {
    return this.prescriptionsService.getInvoiceById(id);
  }

  @Get('invoices/list/all')
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  async getAllInvoices(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.prescriptionsService.getAllInvoices({ status, patientId });
  }
}