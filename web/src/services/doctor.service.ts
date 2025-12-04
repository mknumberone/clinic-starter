import axiosInstance from '@/lib/axios';

// --- Interfaces giữ nguyên ---
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
  specializationId?: string; // Hỗ trợ cả 2 tên biến
  branchId?: string;
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
  // Lấy danh sách bác sĩ
  getDoctors: (params?: DoctorListParams): Promise<DoctorListResponse> => {
    // Map params cho chuẩn backend
    const queryParams = {
      ...params,
      specialization_id: params?.specialization || params?.specializationId
    };

    return axiosInstance.get('/doctors', { params: queryParams }).then((res: any) => {
      // Xử lý dữ liệu trả về an toàn
      const raw = res.data;
      return {
        data: Array.isArray(raw) ? raw : (raw.data || []),
        pagination: raw.pagination || {}
      };
    });
  },

  getDoctorById: (id: string): Promise<DoctorWithDetails> => {
    return axiosInstance.get(`/doctors/${id}`).then((res: any) => res.data);
  },

  getDoctorShifts: (doctorId: string, params?: { date?: string }): Promise<any> => {
    return axiosInstance.get(`/doctors/${doctorId}/shifts`, { params }).then((res: any) => res.data);
  },

  // ---> CẬP NHẬT HÀM NÀY: Xử lý mảng an toàn cho Chuyên khoa <---
  getSpecializations: async (): Promise<Specialization[]> => {
    try {
      const response = await axiosInstance.get('/specializations');
      // Logic kiểm tra mọi trường hợp data trả về
      if (Array.isArray(response.data)) return response.data;
      if (response.data && Array.isArray(response.data.data)) return response.data.data;
      return [];
    } catch (error) {
      console.error("Lỗi lấy chuyên khoa:", error);
      return [];
    }
  },

  // ---> CẬP NHẬT HÀM NÀY: Xử lý mảng an toàn cho Phòng khám <---
  getRooms: async (params?: { specialization_id?: string }): Promise<Room[]> => {
    try {
      const response = await axiosInstance.get('/rooms', { params });
      if (Array.isArray(response.data)) return response.data;
      if (response.data && Array.isArray(response.data.data)) return response.data.data;
      return [];
    } catch (error) {
      console.error("Lỗi lấy phòng khám:", error);
      return [];
    }
  },


};