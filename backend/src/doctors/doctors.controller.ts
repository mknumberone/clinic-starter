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
import { DoctorsService } from './doctors.service';
import {
  UpdateDoctorDto,
  CreateSpecializationDto,
  UpdateSpecializationDto
} from './dto/doctor.dto';
import {
  CreateExaminationPackageDto,
  UpdateExaminationPackageDto
} from './dto/examination-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) { }

  // ============= DOCTORS API =============

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bác sĩ' })
  // Khai báo cả 2 kiểu tham số để Swagger hiển thị rõ
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, description: 'Dành cho Admin (CamelCase)' })
  @ApiQuery({ name: 'branch_id', required: false, description: 'Dành cho Frontend mới (SnakeCase)' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Dành cho Admin (CamelCase)' })
  @ApiQuery({ name: 'specialization_id', required: false, description: 'Dành cho Frontend mới (SnakeCase)' })
  async getAllDoctors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,

    // Hứng cả 2 kiểu tham số
    @Query('branchId') branchId?: string,
    @Query('branch_id') branch_id?: string,
    @Query('specialization') specialization?: string,
    @Query('specialization_id') specialization_id?: string,
  ) {
    // --- LOGIC AN TOÀN: Ưu tiên lấy cái nào có giá trị ---
    // Nếu Frontend gửi branch_id -> lấy branch_id
    // Nếu Admin gửi branchId -> lấy branchId
    const finalBranchId = branchId || branch_id;
    const finalSpecId = specialization || specialization_id;

    // Gọi Service như cũ (Service không cần sửa gì cả)
    return this.doctorsService.getAllDoctors({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      branchId: finalBranchId, // Truyền giá trị đã chuẩn hóa
      specialization: finalSpecId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết bác sĩ' })
  async getDoctorById(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  @Get(':id/shifts')
  @ApiOperation({ summary: 'Lấy lịch trực của bác sĩ' })
  async getDoctorShifts(@Param('id') id: string) {
    return this.doctorsService.getDoctorShifts(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bác sĩ' })
  async updateDoctor(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateDoctorDto,
  ) {
    return this.doctorsService.updateDoctor(id, dto);
  }
}

// ============= SPECIALIZATIONS API (Public GET, Protected CRUD) =============
@ApiTags('specializations')
@Controller('specializations')
export class SpecializationsController {
  constructor(private doctorsService: DoctorsService) { }

  @Get()
  async getAllSpecializations() {
    return this.doctorsService.getAllSpecializations();
  }

  @Get(':id')
  async getSpecializationById(@Param('id') id: string) {
    return this.doctorsService.getSpecializationById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async createSpecialization(@Body(ValidationPipe) dto: CreateSpecializationDto) {
    return this.doctorsService.createSpecialization(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async updateSpecialization(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateSpecializationDto,
  ) {
    return this.doctorsService.updateSpecialization(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async deleteSpecialization(@Param('id') id: string) {
    return this.doctorsService.deleteSpecialization(id);
  }
}

// ============= EXAMINATION PACKAGES API (Public GET, Protected CRUD) =============
@ApiTags('examination-packages')
@Controller('examination-packages')
export class ExaminationPackagesController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  async getAllExaminationPackages(@Query('specialization_id') specializationId?: string) {
    return this.doctorsService.getAllExaminationPackages(specializationId);
  }

  @Get(':id')
  async getExaminationPackageById(@Param('id') id: string) {
    return this.doctorsService.getExaminationPackageById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async createExaminationPackage(@Body(ValidationPipe) dto: CreateExaminationPackageDto) {
    return this.doctorsService.createExaminationPackage(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async updateExaminationPackage(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateExaminationPackageDto,
  ) {
    return this.doctorsService.updateExaminationPackage(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async deleteExaminationPackage(@Param('id') id: string) {
    return this.doctorsService.deleteExaminationPackage(id);
  }
}