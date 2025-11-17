import axiosInstance from '@/lib/axios';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_assigned_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointment_type: string;
  notes?: string;
  created_at: string;
  patient?: {
    user: {
      full_name: string;
      phone: string;
    };
  };
  doctor?: {
    code: string;
    title: string;
    user: {
      full_name: string;
    };
  };
  room?: {
    name: string;
    code: string;
  };
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentListResponse {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAppointmentDto {
  patient_id: string;
  doctor_assigned_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: string;
  notes?: string;
}

export const appointmentService = {
  getAppointments: (params?: AppointmentListParams): Promise<AppointmentListResponse> => {
    return axiosInstance.get('/appointments', { params }).then((res: any) => res.data);
  },

  getAppointmentById: (id: string): Promise<Appointment> => {
    return axiosInstance.get(`/appointments/${id}`).then((res: any) => res.data);
  },

  createAppointment: (data: CreateAppointmentDto): Promise<Appointment> => {
    return axiosInstance.post('/appointments', data).then((res: any) => res.data);
  },

  updateAppointmentStatus: (id: string, data: UpdateAppointmentStatusDto): Promise<Appointment> => {
    return axiosInstance.put(`/appointments/${id}/status`, data).then((res: any) => res.data);
  },

  cancelAppointment: (id: string, reason: string): Promise<void> => {
    return axiosInstance.post(`/appointments/${id}/cancel`, { reason }).then((res: any) => res.data);
  },

  getAvailableSlots: (doctorId: string, date: string): Promise<any> => {
    return axiosInstance
      .get(`/doctors/${doctorId}/available-slots`, { params: { date } })
      .then((res: any) => res.data);
  },
};
