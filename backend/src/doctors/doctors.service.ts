import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  // ============= DOCTORS =============
  
  async getAllDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by name, code, or phone
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { user: { full_name: { contains: params.search, mode: 'insensitive' } } },
        { user: { phone: { contains: params.search } } },
      ];
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
            },
          },
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
          },
        },
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
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Get appointment stats
    const [total, completed, upcoming] = await Promise.all([
      this.prisma.appointment.count({ where: { doctor_assigned_id: id } }),
      this.prisma.appointment.count({ where: { doctor_assigned_id: id, status: 'completed' } }),
      this.prisma.appointment.count({ 
        where: { 
          doctor_assigned_id: id, 
          status: { in: ['scheduled', 'confirmed'] },
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
    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Check code uniqueness if updating
    if (dto.code && dto.code !== doctor.code) {
      const existing = await this.prisma.doctor.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Mã bác sĩ đã tồn tại');
      }
    }

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  // ============= SPECIALIZATIONS =============

  async getAllSpecializations() {
    return this.prisma.specialization.findMany({
      include: {
        rooms: true,
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

  // ============= ROOMS =============

  async getAllRooms() {
    return this.prisma.room.findMany({
      include: {
        specialization: true,
        shifts: {
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
          },
        },
      },
    });
  }

  async getRoomById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        specialization: true,
        shifts: {
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
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  async createRoom(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Mã phòng đã tồn tại');
    }

    if (dto.specialization_id) {
      const specialization = await this.prisma.specialization.findUnique({
        where: { id: dto.specialization_id },
      });
      if (!specialization) {
        throw new NotFoundException('Không tìm thấy chuyên khoa');
      }
    }

    return this.prisma.room.create({
      data: dto,
      include: {
        specialization: true,
      },
    });
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    if (dto.code && dto.code !== room.code) {
      const existing = await this.prisma.room.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Mã phòng đã tồn tại');
      }
    }

    if (dto.specialization_id) {
      const specialization = await this.prisma.specialization.findUnique({
        where: { id: dto.specialization_id },
      });
      if (!specialization) {
        throw new NotFoundException('Không tìm thấy chuyên khoa');
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: {
        specialization: true,
      },
    });
  }

  async deleteRoom(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    await this.prisma.room.delete({ where: { id } });
    return { message: 'Xóa phòng thành công' };
  }

  // ============= DOCTOR SHIFTS =============

  async getDoctorShifts(doctorId: string, startDate?: Date, endDate?: Date) {
    const where: any = { doctor_id: doctorId };

    if (startDate && endDate) {
      where.start_time = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.doctorShift.findMany({
      where,
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
    });
  }

  async createDoctorShift(dto: CreateDoctorShiftDto) {
    // Validate doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctor_id },
    });
    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Validate room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.room_id },
    });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    // Check time validity
    const startTime = new Date(dto.start_time);
    const endTime = new Date(dto.end_time);

    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    // Check for conflicting shifts
    const conflictingShift = await this.prisma.doctorShift.findFirst({
      where: {
        doctor_id: dto.doctor_id,
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

    if (conflictingShift) {
      throw new ConflictException('Ca trực bị trùng với ca trực khác');
    }

    return this.prisma.doctorShift.create({
      data: {
        doctor_id: dto.doctor_id,
        room_id: dto.room_id,
        start_time: startTime,
        end_time: endTime,
        recurrence: dto.recurrence,
      },
      include: {
        room: {
          include: {
            specialization: true,
          },
        },
      },
    });
  }

  async updateDoctorShift(id: string, dto: UpdateDoctorShiftDto) {
    const shift = await this.prisma.doctorShift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca trực');
    }

    if (dto.room_id) {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.room_id },
      });
      if (!room) {
        throw new NotFoundException('Không tìm thấy phòng');
      }
    }

    const startTime = dto.start_time ? new Date(dto.start_time) : shift.start_time;
    const endTime = dto.end_time ? new Date(dto.end_time) : shift.end_time;

    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    return this.prisma.doctorShift.update({
      where: { id },
      data: {
        room_id: dto.room_id,
        start_time: dto.start_time ? new Date(dto.start_time) : undefined,
        end_time: dto.end_time ? new Date(dto.end_time) : undefined,
        recurrence: dto.recurrence,
      },
      include: {
        room: {
          include: {
            specialization: true,
          },
        },
      },
    });
  }

  async deleteDoctorShift(id: string) {
    const shift = await this.prisma.doctorShift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca trực');
    }

    await this.prisma.doctorShift.delete({ where: { id } });
    return { message: 'Xóa ca trực thành công' };
  }

  // Get available time slots for a doctor
  async getAvailableSlots(doctorId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get doctor's shifts for the day
    const shifts = await this.prisma.doctorShift.findMany({
      where: {
        doctor_id: doctorId,
        start_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Get doctor's appointments for the day
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctor_assigned_id: doctorId,
        start_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    return {
      shifts,
      bookedSlots: appointments,
    };
  }
}
