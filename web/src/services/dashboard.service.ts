import { axiosInstance } from '../lib/axios';

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
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
};
