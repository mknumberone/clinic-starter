import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, ChangeAppointmentStatusDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async createAppointment(dto: CreateAppointmentDto, createdBy: string) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patient_id },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    // Validate room if provided
    if (dto.room_id) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.room_id },
      });
      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }
    }

    // Validate doctor if provided
    if (dto.doctor_assigned_id) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: dto.doctor_assigned_id },
      });
      if (!doctor) {
        throw new NotFoundException('Không tìm thấy bác sĩ');
      }
    }

    // Validate time
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Không thể đặt lịch trong quá khứ');
    }

    // Check for conflicting appointments (same doctor or room at same time)
    if (dto.doctor_assigned_id) {
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          doctor_assigned_id: dto.doctor_assigned_id,
          status: {
            notIn: ['cancelled', 'no-show'],
          },
          OR: [
            {
              start_time: {
                lte: endTime,
              },
              end_time: {
                gte: startTime,
              },
            },
          ],
        },
      });

      if (conflictingAppointment) {
        throw new BadRequestException('Bác sĩ đã có lịch hẹn trong khung giờ này');
      }
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patient_id: dto.patient_id,
        room_id: dto.room_id,
        doctor_assigned_id: dto.doctor_assigned_id,
        appointment_type: dto.appointment_type,
        start_time: startTime,
        end_time: endTime,
        source: dto.source || 'online',
        notes: dto.notes,
        status: 'scheduled',
        created_by: createdBy,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
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
    });

    // Create status log
    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: appointment.id,
        new_status: 'scheduled',
        changed_by: createdBy,
      },
    });

    return {
      message: 'Đặt lịch thành công',
      appointment,
    };
  }

  async getAppointmentById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        room: {
          include: {
            specialization: true,
          },
        },
        status_logs: {
          orderBy: {
            created_at: 'desc',
          },
        },
        prescriptions: true,
        invoices: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    return appointment;
  }

  async getAllAppointments(filters?: {
    status?: string;
    patientId?: string;
    doctorId?: string;
    roomId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.patient_id = filters.patientId;
    }

    if (filters?.doctorId) {
      where.doctor_assigned_id = filters.doctorId;
    }

    if (filters?.roomId) {
      where.room_id = filters.roomId;
    }

    if (filters?.startDate && filters?.endDate) {
      where.start_time = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
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
  }

  async updateAppointment(id: string, dto: UpdateAppointmentDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    // Validate room if provided
    if (dto.room_id) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.room_id },
      });
      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }
    }

    // Validate doctor if provided
    if (dto.doctor_assigned_id) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id: dto.doctor_assigned_id },
      });
      if (!doctor) {
        throw new NotFoundException('Không tìm thấy bác sĩ');
      }
    }

    // Validate time if provided
    if (dto.start_time || dto.end_time) {
      const startTime = dto.start_time ? new Date(dto.start_time) : appointment.start_time;
      const endTime = dto.end_time ? new Date(dto.end_time) : appointment.end_time;

      if (startTime >= endTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        room_id: dto.room_id,
        doctor_assigned_id: dto.doctor_assigned_id,
        appointment_type: dto.appointment_type,
        start_time: dto.start_time ? new Date(dto.start_time) : undefined,
        end_time: dto.end_time ? new Date(dto.end_time) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
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
    });

    // Create status log if status changed
    if (dto.status && dto.status !== appointment.status) {
      await this.prisma.appointmentStatusLog.create({
        data: {
          appointment_id: id,
          old_status: appointment.status,
          new_status: dto.status,
          changed_by: userId,
        },
      });
    }

    return {
      message: 'Cập nhật cuộc hẹn thành công',
      appointment: updated,
    };
  }

  async changeAppointmentStatus(id: string, dto: ChangeAppointmentStatusDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
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
    });

    // Create status log
    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: id,
        old_status: appointment.status,
        new_status: dto.status,
        changed_by: userId,
      },
    });

    return {
      message: 'Cập nhật trạng thái thành công',
      appointment: updated,
    };
  }

  async cancelAppointment(id: string, userId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    if (appointment.status === 'cancelled') {
      throw new BadRequestException('Cuộc hẹn đã được hủy');
    }

    if (appointment.status === 'completed') {
      throw new BadRequestException('Không thể hủy cuộc hẹn đã hoàn thành');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: reason ? `${appointment.notes || ''}\nLý do hủy: ${reason}` : appointment.notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
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
    });

    // Create status log
    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: id,
        old_status: appointment.status,
        new_status: 'cancelled',
        changed_by: userId,
      },
    });

    return {
      message: 'Hủy cuộc hẹn thành công',
      appointment: updated,
    };
  }

  async deleteAppointment(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return { message: 'Xóa cuộc hẹn thành công' };
  }

  async getAppointmentStatusHistory(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    return this.prisma.appointmentStatusLog.findMany({
      where: { appointment_id: id },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
