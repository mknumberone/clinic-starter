import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  // Get all patients with pagination and filters (Admin/Doctor)
  async getPatients(params: {
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

    // Search by name or phone
    if (params.search) {
      where.user = {
        OR: [
          { full_name: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search } },
        ],
      };
    }

    // Filter by gender
    if (params.gender) {
      where.gender = params.gender;
    }

    // Filter by age range (calculate date_of_birth range)
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
            select: {
              id: true,
              email: true,
              phone: true,
              full_name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.patient.count({ where }),
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

    // Get appointments
    const appointments = await this.prisma.appointment.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: {
        start_time: 'desc',
      },
      take: 20,
    });

    // Get prescriptions
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
        doctor: {
          full_name: presc.doctor.user.full_name,
        },
        items: presc.items.map((item) => ({
          name: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
        })),
      })),
    };
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
