import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppointmentStatus, InvoiceStatus, Prisma } from '@prisma/client';

const decimalToNumber = (value?: Prisma.Decimal | number | null) =>
  value ? Number(value) : 0;

const EXPIRING_DAYS = 30;
const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
    private inventoryService: InventoryService,
  ) {}

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
      totalBranches,
      totalRooms,
      totalSpecializations,
      totalMedications,
      totalNews,
      appointmentByStatusRaw,
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
          status: InvoiceStatus.UNPAID,
        },
      }),
      this.prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),
      this.prisma.branch.count(),
      this.prisma.room.count(),
      this.prisma.specialization.count(),
      this.prisma.medication.count(),
      this.prisma.news.count(),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const appointmentByStatus = (appointmentByStatusRaw ?? []).reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPatients,
      totalDoctors,
      todayAppointments,
      totalAppointments,
      pendingInvoices,
      totalRevenue: decimalToNumber(totalRevenue._sum.amount),
      totalBranches,
      totalRooms,
      totalSpecializations,
      totalMedications,
      totalNews,
      appointmentByStatus,
    };
  }

  // Get appointments by date range (grouped by date for line chart)
  async getAppointmentsByDateRange(startDate: Date, endDate: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { start_time: true },
    });

    const byDate = appointments.reduce<Record<string, number>>((acc, a) => {
      const d = a.start_time.toISOString().split('T')[0];
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
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
      acc[date] += decimalToNumber(payment.amount);
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
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
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
          status: InvoiceStatus.UNPAID,
        },
        include: {
          items: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    const totalUnpaid = unpaidInvoices.reduce(
      (sum, inv) => sum + decimalToNumber(inv.total_amount),
      0,
    );

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
      todayAppointments: todayAppointments.length,
      todayAppointmentsList: todayAppointments,
      todayShifts,
      weeklyStats,
    };
  }

  // Get weekly appointment stats for doctor
  private async getWeeklyAppointmentStats(doctorId: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
  }> {
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

    let total = 0;
    let completed = 0;
    let cancelled = 0;
    for (const item of appointments) {
      total += item._count.id;
      if (item.status === 'COMPLETED') completed = item._count.id;
      if (item.status === 'CANCELLED') cancelled = item._count.id;
    }
    return { total, completed, cancelled };
  }

  /**
   * Tổng hợp thông báo cho header (thuốc sắp hết hạn/hết, liên hệ mới, tin nhắn chưa đọc).
   */
  async getNotifications(userId: string, userRole: string, branchId?: string | null) {
    const now = new Date();
    const expiringLimit = new Date(now);
    expiringLimit.setDate(expiringLimit.getDate() + EXPIRING_DAYS);

    const [newContactsCount, conversations, inventory] = await Promise.all([
      this.prisma.contact.count({ where: { status: 'NEW' } }),
      this.chatService.getAllConversations(userId, userRole),
      branchId ? this.inventoryService.getBranchInventory(branchId) : Promise.resolve([]),
    ]);

    const unreadMessagesCount = (conversations as any[]).reduce((sum, c) => sum + (c.unread_count || 0), 0);

    const expiringMedications: { id: string; name: string; expiry_date: string; available_qty: number }[] = [];
    const lowStockMedications: { id: string; name: string; available_qty: number }[] = [];

    for (const med of inventory as any[]) {
      const available = med.available_qty ?? 0;
      if (available > 0 && available < LOW_STOCK_THRESHOLD) {
        lowStockMedications.push({
          id: med.id,
          name: med.name,
          available_qty: available,
        });
      }
      const batches = med.inventories || [];
      for (const batch of batches) {
        const exp = batch.expiry_date ? new Date(batch.expiry_date) : null;
        if (exp && exp > now && exp <= expiringLimit && (batch.quantity - (batch.pending_quantity || 0)) > 0) {
          expiringMedications.push({
            id: med.id,
            name: med.name,
            expiry_date: batch.expiry_date,
            available_qty: batch.quantity - (batch.pending_quantity || 0),
          });
          break;
        }
      }
    }

    return {
      newContactsCount,
      unreadMessagesCount,
      expiringMedications: expiringMedications.slice(0, 20),
      lowStockMedications: lowStockMedications.slice(0, 20),
    };
  }

  /**
   * Báo cáo kho thuốc: thuốc sắp hết hạn, thuốc tồn thấp.
   */
  async getInventoryReport(branchId?: string) {
    const branches = branchId
      ? await this.prisma.branch.findMany({ where: { id: branchId } })
      : await this.prisma.branch.findMany({ where: { is_active: true } });
    const now = new Date();
    const expiringLimit = new Date(now);
    expiringLimit.setDate(expiringLimit.getDate() + EXPIRING_DAYS);

    const expiring: { branchName: string; medicationName: string; expiry_date: string; available_qty: number }[] = [];
    const lowStock: { branchName: string; medicationName: string; available_qty: number }[] = [];

    for (const branch of branches) {
      const inventory = await this.inventoryService.getBranchInventory(branch.id);
      for (const med of inventory as any[]) {
        const available = med.available_qty ?? 0;
        if (available > 0 && available < LOW_STOCK_THRESHOLD) {
          lowStock.push({
            branchName: branch.name,
            medicationName: med.name,
            available_qty: available,
          });
        }
        const batches = med.inventories || [];
        for (const batch of batches) {
          const exp = batch.expiry_date ? new Date(batch.expiry_date) : null;
          const qty = batch.quantity - (batch.pending_quantity || 0);
          if (exp && exp > now && exp <= expiringLimit && qty > 0) {
            expiring.push({
              branchName: branch.name,
              medicationName: med.name,
              expiry_date: batch.expiry_date,
              available_qty: qty,
            });
            break;
          }
        }
      }
    }
    return { expiring, lowStock };
  }
}
