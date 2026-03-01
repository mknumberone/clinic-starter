import axiosInstance from '@/lib/axios';

export interface RevenueSummary {
  totalRevenue: number;
  paymentCount: number;
  avgPerDay: number;
  previousRevenue: number;
  changePercent: number;
  from: string;
  to: string;
}

export interface RevenueByDayItem {
  date: string;
  amount: number;
}

export interface RevenueByBranchItem {
  branchId: string;
  branchName: string;
  amount: number;
}

export interface RevenueByDoctorItem {
  doctorId: string;
  doctorName: string;
  specializationName: string;
  amount: number;
}

export interface RevenueBySpecializationItem {
  specializationId: string;
  specializationName: string;
  amount: number;
}

export interface PatientsByMonthItem {
  month: string;
  count: number;
}

export interface AppointmentsByDoctorItem {
  doctorId: string;
  doctorName: string;
  specializationName: string;
  count: number;
}

const params = (p: { startDate: string; endDate: string; branchId?: string }) => {
  const q: Record<string, string> = { startDate: p.startDate, endDate: p.endDate };
  if (p.branchId) q.branchId = p.branchId;
  return q;
};

export const analyticsService = {
  getRevenueSummary: (p: { startDate: string; endDate: string; branchId?: string }) =>
    axiosInstance.get<RevenueSummary>('/analytics/revenue/summary', { params: params(p) }).then((r) => r.data),

  getRevenueByDay: (p: { startDate: string; endDate: string; branchId?: string }) =>
    axiosInstance
      .get<RevenueByDayItem[]>('/analytics/revenue/by-day', { params: params(p) })
      .then((r) => r.data),

  getRevenueByBranch: (p: { startDate: string; endDate: string }) =>
    axiosInstance
      .get<RevenueByBranchItem[]>('/analytics/revenue/by-branch', {
        params: { startDate: p.startDate, endDate: p.endDate },
      })
      .then((r) => r.data),

  getRevenueByDoctor: (p: { startDate: string; endDate: string; branchId?: string }) =>
    axiosInstance
      .get<RevenueByDoctorItem[]>('/analytics/revenue/by-doctor', { params: params(p) })
      .then((r) => r.data),

  getRevenueBySpecialization: (p: { startDate: string; endDate: string; branchId?: string }) =>
    axiosInstance
      .get<RevenueBySpecializationItem[]>('/analytics/revenue/by-specialization', { params: params(p) })
      .then((r) => r.data),

  getPatientsByMonth: (p: { startDate: string; endDate: string }) =>
    axiosInstance
      .get<PatientsByMonthItem[]>('/analytics/patients/by-month', { params: { startDate: p.startDate, endDate: p.endDate } })
      .then((r) => r.data),

  getAppointmentsByDoctor: (p: { startDate: string; endDate: string; branchId?: string }) =>
    axiosInstance
      .get<AppointmentsByDoctorItem[]>('/analytics/appointments/by-doctor', { params: params(p) })
      .then((r) => r.data),
};
