// File: src/doctors/doctors.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateDoctorDto,
  CreateSpecializationDto,
  UpdateSpecializationDto
} from './dto/doctor.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) { }

  // ============= DOCTORS =============

  async getAllDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string; // ID của chuyên khoa
    branchId?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Tìm kiếm
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { user: { full_name: { contains: params.search, mode: 'insensitive' } } },
        { user: { phone: { contains: params.search } } },
      ];
    }

    // 2. Lọc theo Chi nhánh
    if (params?.branchId) {
      where.user = { branch_id: params.branchId };
    }

    // 3. LỌC THEO CHUYÊN KHOA (Bổ sung mới)
    if (params?.specialization) {
      where.specialization_id = params.specialization;
    }

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
              avatar: true,
              branch_id: true,
            },
          },
          specialization: true, // Include để Frontend hiển thị tên khoa
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            branch_id: true, // Lấy branch để form edit hiển thị
          },
        },
        specialization: true, // Lấy chuyên khoa
        shifts: {
          include: {
            room: {
              include: {
                specialization: true,
              },
            },
          },
          orderBy: {
            start_time: 'asc',
          },
          take: 5,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Thống kê nhanh
    const [total, completed, upcoming] = await Promise.all([
      this.prisma.appointment.count({ where: { doctor_assigned_id: id } }),
      this.prisma.appointment.count({
        where: { doctor_assigned_id: id, status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.appointment.count({
        where: {
          doctor_assigned_id: id,
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
          start_time: { gte: new Date() }
        }
      }),
    ]);

    return {
      ...doctor,
      appointmentStats: {
        total,
        completed,
        upcoming,
      },
    };
  }

  async updateDoctor(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Không tìm thấy bác sĩ');

    if (dto.code && dto.code !== doctor.code) {
      const existing = await this.prisma.doctor.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Mã bác sĩ đã tồn tại');
    }

    // Chuẩn bị data update cho bảng Doctor
    const updateData: any = {
      code: dto.code,
      title: dto.title,
      biography: dto.biography,
      average_time: dto.average_time,
    };

    // Logic cập nhật chuyên khoa (Handle connect/disconnect)
    if (dto.specialization_id) {
      updateData.specialization = {
        connect: { id: dto.specialization_id }
      };
    } else if (dto.specialization_id === null) {
      // Nếu gửi null nghĩa là muốn xóa chuyên khoa của bác sĩ này
      updateData.specialization = {
        disconnect: true
      };
    }

    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...updateData,
        // Cập nhật bảng User (Nested update)
        user: {
          update: {
            full_name: dto.full_name,
            phone: dto.phone,
            branch_id: dto.branch_id,
          }
        }
      },
      include: {
        user: true,
        specialization: true,
      },
    });
  }

  // ============= SPECIALIZATIONS (Giữ nguyên) =============

  async getAllSpecializations() {
    return this.prisma.specialization.findMany({
      include: {
        _count: {
          select: { rooms: true, doctors: true }
        }
      },
    });
  }

  async getSpecializationById(id: string) {
    const specialization = await this.prisma.specialization.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });

    if (!specialization) {
      throw new NotFoundException('Không tìm thấy chuyên khoa');
    }

    return specialization;
  }

  async createSpecialization(dto: CreateSpecializationDto) {
    const existing = await this.prisma.specialization.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Chuyên khoa đã tồn tại');
    }

    return this.prisma.specialization.create({
      data: dto,
    });
  }

  async updateSpecialization(id: string, dto: UpdateSpecializationDto) {
    const specialization = await this.prisma.specialization.findUnique({
      where: { id },
    });

    if (!specialization) {
      throw new NotFoundException('Không tìm thấy chuyên khoa');
    }

    if (dto.name && dto.name !== specialization.name) {
      const existing = await this.prisma.specialization.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Tên chuyên khoa đã tồn tại');
      }
    }

    return this.prisma.specialization.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSpecialization(id: string) {
    const specialization = await this.prisma.specialization.findUnique({
      where: { id },
    });

    if (!specialization) {
      throw new NotFoundException('Không tìm thấy chuyên khoa');
    }

    await this.prisma.specialization.delete({
      where: { id },
    });

    return { message: 'Xóa chuyên khoa thành công' };
  }

  async getDoctorShifts(doctorId: string) {
    // Tìm các ca trực của bác sĩ này
    return this.prisma.doctorShift.findMany({
      where: { doctor_id: doctorId },
      include: {
        room: true, // Lấy thông tin phòng để hiển thị tên phòng
      },
      orderBy: {
        start_time: 'desc', // Sắp xếp ngày mới nhất lên đầu
      },
    });
  }
}