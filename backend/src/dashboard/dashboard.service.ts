import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Admin Dashboard Stats
  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      totalDoctors,
      todayAppointments,
      totalAppointments,
      pendingInvoices,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.doctor.count(),
      this.prisma.appointment.count({
        where: {
          start_time: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.appointment.count(),
      this.prisma.invoice.count({
        where: {
          status: 'unpaid',
        },
      }),
      this.prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalPatients,
      totalDoctors,
      todayAppointments,
      totalAppointments,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  // Get appointments by date range
  async getAppointmentsByDateRange(startDate: Date, endDate: Date) {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return appointments.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  // Get revenue by date range
  async getRevenueByDateRange(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        paid_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        paid_at: true,
        amount: true,
      },
    });

    // Group by date
    const revenueByDate = payments.reduce((acc, payment) => {
      const date = payment.paid_at.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(revenueByDate).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  // Get upcoming appointments (for admin)
  async getUpcomingAppointments(limit: number = 10) {
    const now = new Date();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        start_time: {
          gte: now,
        },
        status: {
          in: ['scheduled', 'confirmed'],
        },
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
      orderBy: {
        start_time: 'asc',
      },
      take: limit,
    });

    return appointments;
  }

  // Patient Dashboard
  async getPatientDashboard(patientId: string) {
    const now = new Date();

    const [upcomingAppointments, recentPrescriptions, unpaidInvoices] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          patient_id: patientId,
          start_time: {
            gte: now,
          },
          status: {
            in: ['scheduled', 'confirmed'],
          },
        },
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
          start_time: 'asc',
        },
        take: 5,
      }),
      this.prisma.prescription.findMany({
        where: {
          patient_id: patientId,
        },
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
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: {
          patient_id: patientId,
          status: 'unpaid',
        },
        include: {
          items: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    return {
      upcomingAppointments,
      recentPrescriptions,
      unpaidInvoices,
      totalUnpaid,
    };
  }

  // Doctor Dashboard
  async getDoctorDashboard(doctorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, todayShifts, weeklyStats] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          doctor_assigned_id: doctorId,
          start_time: {
            gte: today,
            lt: tomorrow,
          },
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
          room: true,
        },
        orderBy: {
          start_time: 'asc',
        },
      }),
      this.prisma.doctorShift.findMany({
        where: {
          doctor_id: doctorId,
          start_time: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          room: true,
        },
        orderBy: {
          start_time: 'asc',
        },
      }),
      this.getWeeklyAppointmentStats(doctorId),
    ]);

    return {
      todayAppointments,
      todayShifts,
      weeklyStats,
    };
  }

  // Get weekly appointment stats for doctor
  private async getWeeklyAppointmentStats(doctorId: string) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        doctor_assigned_id: doctorId,
        start_time: {
          gte: weekAgo,
          lte: today,
        },
      },
      _count: {
        id: true,
      },
    });

    return appointments.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }
}
