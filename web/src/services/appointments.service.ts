import axiosInstance from '@/lib/axios';

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  roomId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  roomId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  diagnosis?: string;
  patient: {
    id: number;
    userId: number;
    user: {
      name: string;
      phone: string;
    };
  };
  doctor: {
    id: number;
    userId: number;
    user: {
      name: string;
    };
    specialization: {
      name: string;
    };
  };
  room: {
    roomNumber: string;
    floor: number;
  };
}

export const appointmentsService = {
  createAppointment: async (data: CreateAppointmentDto) => {
    const response = await axiosInstance.post<Appointment>('/appointments', data);
    return response.data;
  },

  getAppointments: async (params?: {
    status?: string;
    patientId?: number;
    doctorId?: number;
    roomId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axiosInstance.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: number) => {
    const response = await axiosInstance.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  updateAppointmentStatus: async (id: number, status: string, notes?: string) => {
    const response = await axiosInstance.put(`/appointments/${id}/status`, { status, notes });
    return response.data;
  },

  cancelAppointment: async (id: number, reason?: string) => {
    const response = await axiosInstance.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },
};
