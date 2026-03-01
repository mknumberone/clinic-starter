import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const toNumber = (v?: Prisma.Decimal | number | null) => (v ? Number(v) : 0);

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private dateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Tổng doanh thu, số giao dịch, so sánh với kỳ trước.
   */
  async getRevenueSummary(params: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const wherePayment: Prisma.PaymentWhereInput = {
      paid_at: { gte: start, lte: end },
    };

    const invoiceWhere: Prisma.InvoiceWhereInput = {};
    if (params.branchId) {
      invoiceWhere.branch_id = params.branchId;
    }

    const [current, invoicesForCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          ...wherePayment,
          invoice: invoiceWhere,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.findMany({
        where: {
          ...wherePayment,
          invoice: invoiceWhere,
        },
        select: { amount: true, paid_at: true },
      }),
    ]);

    const totalRevenue = toNumber(current._sum.amount);
    const paymentCount = current._count.id;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const avgPerDay = totalRevenue / days;

    // Kỳ trước cùng độ dài
    const periodMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodMs);

    const prev = await this.prisma.payment.aggregate({
      where: {
        paid_at: { gte: prevStart, lte: prevEnd },
        invoice: params.branchId ? { branch_id: params.branchId } : undefined,
      },
      _sum: { amount: true },
    });
    const previousRevenue = toNumber(prev._sum.amount);
    const changePercent =
      previousRevenue === 0
        ? (totalRevenue > 0 ? 100 : 0)
        : Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);

    return {
      totalRevenue,
      paymentCount,
      avgPerDay: Math.round(avgPerDay),
      previousRevenue,
      changePercent,
      from: params.startDate,
      to: params.endDate,
    };
  }

  /**
   * Doanh thu theo ngày (cho biểu đồ line/bar).
   */
  async getRevenueByDay(params: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const payments = await this.prisma.payment.findMany({
      where: {
        paid_at: { gte: start, lte: end },
        invoice: params.branchId ? { branch_id: params.branchId } : undefined,
      },
      select: { paid_at: true, amount: true },
    });

    const byDate: Record<string, number> = {};
    payments.forEach((p) => {
      const d = p.paid_at.toISOString().split('T')[0];
      byDate[d] = (byDate[d] || 0) + toNumber(p.amount);
    });
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Doanh thu theo chi nhánh.
   */
  async getRevenueByBranch(params: { startDate: string; endDate: string }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const payments = await this.prisma.payment.findMany({
      where: { paid_at: { gte: start, lte: end } },
      include: { invoice: { select: { branch_id: true } } },
    });

    const branchIds = [...new Set(
      payments
        .map((p) => p.invoice.branch_id)
        .filter((id): id is string => !!id),
    )];
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    });
    const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));

    const map: Record<string, { branchId: string; branchName: string; amount: number }> = {};
    payments.forEach((p) => {
      const bid = p.invoice.branch_id || 'unknown';
      const name = bid !== 'unknown' ? (branchMap[bid] || 'Không xác định') : 'Không xác định';
      if (!map[bid]) map[bid] = { branchId: bid, branchName: name, amount: 0 };
      map[bid].amount += toNumber(p.amount);
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Doanh thu theo bác sĩ.
   */
  async getRevenueByDoctor(params: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      payments: { some: { paid_at: { gte: start, lte: end } } },
    };
    if (params.branchId) invoiceWhere.branch_id = params.branchId;

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        payments: {
          where: { paid_at: { gte: start, lte: end } },
          select: { amount: true },
        },
        appointment: {
          include: {
            doctor: {
              select: {
                id: true,
                user: { select: { full_name: true } },
                specialization: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const map: Record<
      string,
      { doctorId: string; doctorName: string; specializationName: string; amount: number }
    > = {};
    invoices.forEach((inv) => {
      const doctorId = inv.appointment?.doctor_assigned_id || 'unknown';
      const doctorName =
        inv.appointment?.doctor?.user?.full_name || 'Không gán bác sĩ';
      const specName = inv.appointment?.doctor?.specialization?.name || '—';
      const amount = inv.payments.reduce((s, p) => s + toNumber(p.amount), 0);
      if (!map[doctorId]) {
        map[doctorId] = { doctorId, doctorName, specializationName: specName, amount: 0 };
      }
      map[doctorId].amount += amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Doanh thu theo chuyên khoa (từ appointment -> doctor -> specialization).
   */
  async getRevenueBySpecialization(params: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      payments: { some: { paid_at: { gte: start, lte: end } } },
      appointment: { isNot: null },
    };
    if (params.branchId) invoiceWhere.branch_id = params.branchId;

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        payments: {
          where: { paid_at: { gte: start, lte: end } },
          select: { amount: true },
        },
        appointment: {
          include: {
            doctor: {
              select: {
                specialization_id: true,
                specialization: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const map: Record<string, { specializationId: string; specializationName: string; amount: number }> = {};
    invoices.forEach((inv) => {
      const specId = inv.appointment?.doctor?.specialization_id || 'unknown';
      const specName = inv.appointment?.doctor?.specialization?.name || 'Không chuyên khoa';
      const amount = inv.payments.reduce((s, p) => s + toNumber(p.amount), 0);
      if (!map[specId]) {
        map[specId] = { specializationId: specId, specializationName: specName, amount: 0 };
      }
      map[specId].amount += amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Bệnh nhân mới theo tháng.
   */
  async getPatientsByMonth(params: { startDate: string; endDate: string }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const patients = await this.prisma.patient.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { created_at: true },
    });
    const byMonth: Record<string, number> = {};
    patients.forEach((p) => {
      const key = p.created_at.toISOString().slice(0, 7); // YYYY-MM
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Lịch hẹn theo bác sĩ (số lượng).
   */
  async getAppointmentsByDoctor(params: {
    startDate: string;
    endDate: string;
    branchId?: string;
  }) {
    const { start, end } = this.dateRange(params.startDate, params.endDate);
    const where: Prisma.AppointmentWhereInput = {
      start_time: { gte: start, lte: end },
    };
    if (params.branchId) where.branch_id = params.branchId;

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            user: { select: { full_name: true } },
            specialization: { select: { name: true } },
          },
        },
      },
    });

    const map: Record<
      string,
      { doctorId: string; doctorName: string; specializationName: string; count: number }
    > = {};
    appointments.forEach((a) => {
      const doctorId = a.doctor_assigned_id || 'unknown';
      const doctorName = a.doctor?.user?.full_name || 'Chưa gán bác sĩ';
      const specName = a.doctor?.specialization?.name || '—';
      if (!map[doctorId]) {
        map[doctorId] = { doctorId, doctorName, specializationName: specName, count: 0 };
      }
      map[doctorId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }
}
