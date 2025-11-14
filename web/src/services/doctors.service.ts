import axiosInstance from '@/lib/axios';

export interface Doctor {
  id: number;
  userId: number;
  specializationId: number;
  licenseNumber: string;
  yearsOfExperience: number;
  qualifications?: string;
  bio?: string;
  consultationFee: number;
  user: {
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  specialization: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface Specialization {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  _count?: {
    doctors: number;
  };
}

export interface Room {
  id: number;
  roomNumber: string;
  floor: number;
  capacity: number;
  specializationId?: number;
  specialization?: {
    name: string;
  };
}

export const doctorsService = {
  getDoctors: async (params?: { specializationId?: number }) => {
    const response = await axiosInstance.get<Doctor[]>('/doctors', { params });
    return response.data;
  },

  getDoctor: async (id: number) => {
    const response = await axiosInstance.get<Doctor>(`/doctors/${id}`);
    return response.data;
  },

  getDoctorShifts: async (doctorId: number, params?: { startDate?: string; endDate?: string }) => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/shifts`, { params });
    return response.data;
  },

  getDoctorAvailableSlots: async (doctorId: number, date: string) => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/available-slots`, {
      params: { date },
    });
    return response.data;
  },

  // Specializations
  getSpecializations: async () => {
    const response = await axiosInstance.get<Specialization[]>('/specializations');
    return response.data;
  },

  // Rooms
  getRooms: async (params?: { specializationId?: number }) => {
    const response = await axiosInstance.get<Room[]>('/rooms', { params });
    return response.data;
  },
};
