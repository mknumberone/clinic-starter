import axiosInstance from '@/lib/axios';

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  todayAppointments?: number;
  pendingInvoices?: number;
  totalBranches?: number;
  totalRooms?: number;
  totalSpecializations?: number;
  totalMedications?: number;
  totalNews?: number;
  paidInvoices?: number;
  appointmentByStatus?: Record<string, number>;
}

export interface AppointmentStats {
  date: string;
  count: number;
}

export interface RevenueStats {
  date: string;
  amount: number;
}

export const dashboardService = {
  getAdminStats: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await axiosInstance.get<AdminStats>('/dashboard/admin/stats', { params });
    return response.data;
  },

  getAdminAppointments: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await axiosInstance.get<AppointmentStats[]>('/dashboard/admin/appointments', { params });
    return response.data;
  },

  getAdminRevenue: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await axiosInstance.get<RevenueStats[]>('/dashboard/admin/revenue', { params });
    return response.data;
  },

  getAdminUpcomingAppointments: async (limit?: number) => {
    const response = await axiosInstance.get('/dashboard/admin/upcoming-appointments', {
      params: { limit },
    });
    return response.data;
  },

  getPatientDashboard: async () => {
    const response = await axiosInstance.get('/dashboard/patient');
    return response.data;
  },

  getDoctorDashboard: async () => {
    const response = await axiosInstance.get('/dashboard/doctor');
    return response.data;
  },

  getNotifications: async () => {
    const response = await axiosInstance.get<{
      newContactsCount: number;
      unreadMessagesCount: number;
      expiringMedications: { id: string; name: string; expiry_date: string; available_qty: number }[];
      lowStockMedications: { id: string; name: string; available_qty: number }[];
    }>('/dashboard/notifications');
    return response.data;
  },

  getInventoryReport: async (branchId?: string) => {
    const response = await axiosInstance.get<{
      expiring: { branchName: string; medicationName: string; expiry_date: string; available_qty: number }[];
      lowStock: { branchName: string; medicationName: string; available_qty: number }[];
    }>('/dashboard/admin/inventory-report', { params: branchId ? { branchId } : {} });
    return response.data;
  },
};
