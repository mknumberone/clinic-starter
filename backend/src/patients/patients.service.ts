import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  // Get patient profile
  async getProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            full_name: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    return patient;
  }

  // Update patient profile
  async updateProfile(patientId: string, userId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    if (patient.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật hồ sơ này');
    }

    // Update user info
    if (dto.full_name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { full_name: dto.full_name },
      });
    }

    // Update patient info
    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
        gender: dto.gender,
        address: dto.address,
        emergency_contact: dto.emergency_contact,
        insurance: dto.insurance,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            full_name: true,
          },
        },
      },
    });

    return {
      message: 'Cập nhật hồ sơ thành công',
      patient: updated,
    };
  }

  // Get patient appointments
  async getAppointments(patientId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    if (patient.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin này');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: {
        start_time: 'desc',
      },
    });

    return appointments;
  }

  // Get patient prescriptions
  async getPrescriptions(patientId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    if (patient.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin này');
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        items: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return prescriptions;
  }

  // Get patient invoices
  async getInvoices(patientId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    if (patient.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin này');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { patient_id: patientId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return invoices;
  }
}
