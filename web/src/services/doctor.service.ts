import axiosInstance from '@/lib/axios';

export interface Doctor {
  id: string;
  user_id: string;
  code: string;
  title: string;
  biography?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email?: string;
    phone: string;
  };
}

export interface DoctorWithDetails extends Doctor {
  specializations?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  shifts?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    day_of_week: number;
    room: {
      name: string;
      code: string;
    };
  }>;
  appointmentStats?: {
    total: number;
    completed: number;
    upcoming: number;
  };
}

export interface DoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
}

export interface DoctorListResponse {
  data: Doctor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Specialization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  floor: string;
  capacity: number;
  specialization_id?: string;
  specialization?: {
    name: string;
  };
}

export const doctorService = {
  getDoctors: (params?: DoctorListParams): Promise<DoctorListResponse> => {
    return axiosInstance.get('/doctors', { params }).then((res: any) => res.data);
  },

  getDoctorById: (id: string): Promise<DoctorWithDetails> => {
    return axiosInstance.get(`/doctors/${id}`).then((res: any) => res.data);
  },

  getDoctorShifts: (doctorId: string, params?: { date?: string }): Promise<any> => {
    return axiosInstance.get(`/doctors/${doctorId}/shifts`, { params }).then((res: any) => res.data);
  },

  getSpecializations: (): Promise<Specialization[]> => {
    return axiosInstance.get('/specializations').then((res: any) => res.data);
  },

  getRooms: (params?: { specialization_id?: string }): Promise<Room[]> => {
    return axiosInstance.get('/rooms', { params }).then((res: any) => res.data);
  },
};
