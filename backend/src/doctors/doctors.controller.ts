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
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateSpecializationDto,
  UpdateSpecializationDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreateDoctorShiftDto,
  UpdateDoctorShiftDto
} from './dto/doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  // ============= DOCTORS =============

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bác sĩ' })
  @ApiResponse({ status: 200, description: 'Danh sách bác sĩ' })
  async getAllDoctors() {
    return this.doctorsService.getAllDoctors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết bác sĩ' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @ApiResponse({ status: 200, description: 'Thông tin bác sĩ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async getDoctorById(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bác sĩ' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @ApiBody({ type: UpdateDoctorDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bác sĩ' })
  async updateDoctor(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateDoctorDto,
  ) {
    return this.doctorsService.updateDoctor(id, dto);
  }

  @Get(':id/shifts')
  @ApiOperation({ summary: 'Lấy danh sách ca trực của bác sĩ' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Danh sách ca trực' })
  async getDoctorShifts(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.doctorsService.getDoctorShifts(id, start, end);
  }

  @Get(':id/available-slots')
  @ApiOperation({ summary: 'Lấy các khung giờ trống của bác sĩ' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @ApiQuery({ name: 'date', description: 'Ngày cần kiểm tra (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Các khung giờ trống' })
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(id, new Date(date));
  }
}

@ApiTags('specializations')
@Controller('specializations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SpecializationsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả chuyên khoa' })
  @ApiResponse({ status: 200, description: 'Danh sách chuyên khoa' })
  async getAllSpecializations() {
    return this.doctorsService.getAllSpecializations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết chuyên khoa' })
  @ApiParam({ name: 'id', description: 'Specialization ID' })
  @ApiResponse({ status: 200, description: 'Thông tin chuyên khoa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  async getSpecializationById(@Param('id') id: string) {
    return this.doctorsService.getSpecializationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo chuyên khoa mới' })
  @ApiBody({ type: CreateSpecializationDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Chuyên khoa đã tồn tại' })
  async createSpecialization(@Body(ValidationPipe) dto: CreateSpecializationDto) {
    return this.doctorsService.createSpecialization(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật chuyên khoa' })
  @ApiParam({ name: 'id', description: 'Specialization ID' })
  @ApiBody({ type: UpdateSpecializationDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  async updateSpecialization(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateSpecializationDto,
  ) {
    return this.doctorsService.updateSpecialization(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa chuyên khoa' })
  @ApiParam({ name: 'id', description: 'Specialization ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chuyên khoa' })
  async deleteSpecialization(@Param('id') id: string) {
    return this.doctorsService.deleteSpecialization(id);
  }
}

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RoomsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả phòng khám' })
  @ApiResponse({ status: 200, description: 'Danh sách phòng' })
  async getAllRooms() {
    return this.doctorsService.getAllRooms();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết phòng khám' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Thông tin phòng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  async getRoomById(@Param('id') id: string) {
    return this.doctorsService.getRoomById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phòng khám mới' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Mã phòng đã tồn tại' })
  async createRoom(@Body(ValidationPipe) dto: CreateRoomDto) {
    return this.doctorsService.createRoom(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật phòng khám' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  async updateRoom(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateRoomDto,
  ) {
    return this.doctorsService.updateRoom(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phòng khám' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  async deleteRoom(@Param('id') id: string) {
    return this.doctorsService.deleteRoom(id);
  }
}

@ApiTags('doctor-shifts')
@Controller('doctor-shifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DoctorShiftsController {
  constructor(private doctorsService: DoctorsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo ca trực mới cho bác sĩ' })
  @ApiBody({ type: CreateDoctorShiftDto })
  @ApiResponse({ status: 201, description: 'Tạo ca trực thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bác sĩ hoặc phòng' })
  @ApiResponse({ status: 409, description: 'Ca trực bị trùng' })
  async createDoctorShift(@Body(ValidationPipe) dto: CreateDoctorShiftDto) {
    return this.doctorsService.createDoctorShift(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật ca trực' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiBody({ type: UpdateDoctorShiftDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ca trực' })
  async updateDoctorShift(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateDoctorShiftDto,
  ) {
    return this.doctorsService.updateDoctorShift(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ca trực' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ca trực' })
  async deleteDoctorShift(@Param('id') id: string) {
    return this.doctorsService.deleteDoctorShift(id);
  }
}
