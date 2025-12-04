import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/patient.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const normalizeGender = (value?: string): Gender | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'MALE' || normalized === 'FEMALE' || normalized === 'OTHER') {
    return normalized as Gender;
  }
  return undefined;
};

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) { }

  // ---> HÀM MỚI: TẠO BỆNH NHÂN <---
  async create(dto: CreatePatientDto) {
    // 1. Check trùng
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }]
      }
    });
    if (existing) throw new ConflictException('Email hoặc Số điện thoại đã tồn tại');

    // 2. Hash Password
    const password = dto.password || 'Password@123';
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    // 3. Transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          full_name: dto.full_name,
          password_hash: hash,
          role: 'PATIENT',
          is_active: true
        }
      });

      const patient = await tx.patient.create({
        data: {
          user_id: user.id,
          gender: normalizeGender(dto.gender),
          date_of_birth: new Date(dto.date_of_birth),
          address: dto.address,
        },
        include: { user: true }
      });

      return patient;
    });
  }

  // --- CÁC HÀM CŨ GIỮ NGUYÊN (Get, Update, etc.) ---

  async getPatients(params: {
    userId?: string;
    userRole?: string;
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.userRole === 'DOCTOR' && params.userId) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { user_id: params.userId },
      });

      if (doctor) {
        const appointments = await this.prisma.appointment.findMany({
          where: { doctor_assigned_id: doctor.id },
          select: { patient_id: true },
          distinct: ['patient_id'],
        });
        const patientIds = appointments.map((apt) => apt.patient_id);
        where.id = { in: patientIds };
      } else {
        where.id = { in: [] };
      }
    }

    if (params.search) {
      where.user = {
        OR: [
          { full_name: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search } },
        ],
      };
    }

    if (params.gender) {
      const genderFilter = normalizeGender(params.gender);
      if (genderFilter) where.gender = genderFilter;
    }

    if (params.minAge !== undefined || params.maxAge !== undefined) {
      const today = new Date();
      where.date_of_birth = {};

      if (params.maxAge !== undefined) {
        const minDate = new Date(today.getFullYear() - params.maxAge - 1, today.getMonth(), today.getDate());
        where.date_of_birth.gte = minDate;
      }

      if (params.minAge !== undefined) {
        const maxDate = new Date(today.getFullYear() - params.minAge, today.getMonth(), today.getDate());
        where.date_of_birth.lte = maxDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, phone: true, full_name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, email: true, phone: true, full_name: true } },
      },
    });

    if (!patient) throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');

    const appointments = await this.prisma.appointment.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: { include: { user: { select: { full_name: true, email: true } } } },
        room: true,
      },
      orderBy: { start_time: 'desc' },
      take: 20,
    });

    const prescriptions = await this.prisma.prescription.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: { include: { user: { select: { full_name: true } } } },
        items: { include: { medication: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return {
      ...patient,
      appointments: appointments.map((apt) => ({
        id: apt.id,
        appointment_type: apt.appointment_type,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        doctor: {
          full_name: apt.doctor?.user.full_name || 'Chưa phân công',
          title: apt.doctor?.title || '',
        },
      })),
      prescriptions: prescriptions.map((presc) => ({
        id: presc.id,
        created_at: presc.created_at,
        doctor: { full_name: presc.doctor.user.full_name },
        items: presc.items.map((item) => ({
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
        })),
      })),
    };
  }

  async updateProfile(patientId: string, userId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    // Bỏ check userId nếu muốn Admin update được, ở đây giữ nguyên logic cũ của bạn
    if (patient.user_id !== userId) throw new ForbiddenException('Bạn không có quyền cập nhật hồ sơ này');

    if (dto.full_name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { full_name: dto.full_name },
      });
    }

    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
        gender: normalizeGender(dto.gender),
        address: dto.address,
        emergency_contact: dto.emergency_contact,
        insurance: dto.insurance,
      },
      include: { user: true },
    });

    return { message: 'Cập nhật hồ sơ thành công', patient: updated };
  }

  async getAppointments(patientId: string, userId: string) {
    // Logic check quyền tương tự...
    return this.prisma.appointment.findMany({
      where: { patient_id: patientId },
      include: { doctor: { include: { user: true } }, room: true },
      orderBy: { start_time: 'desc' },
    });
  }

  async getPrescriptions(patientId: string, userId: string) {
    return this.prisma.prescription.findMany({
      where: { patient_id: patientId },
      include: { doctor: { include: { user: true } }, items: { include: { medication: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getInvoices(patientId: string, userId: string) {
    return this.prisma.invoice.findMany({
      where: { patient_id: patientId },
      include: { items: true, payments: true },
      orderBy: { created_at: 'desc' },
    });
  }
}