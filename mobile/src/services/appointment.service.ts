import axiosInstance from '../lib/axios';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_assigned_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_type: string;
  notes?: string;
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

export interface AppointmentListResponse {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const appointmentService = {
  getMyAppointments: (): Promise<AppointmentListResponse> => {
    return axiosInstance.get('/appointments').then((res) => res.data);
  },

  getAppointmentById: (id: string): Promise<Appointment> => {
    return axiosInstance.get(`/appointments/${id}`).then((res) => res.data);
  },
};
