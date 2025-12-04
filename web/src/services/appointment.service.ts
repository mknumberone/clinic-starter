import axiosInstance from '@/lib/axios';

// --- DTO Interfaces ---
export interface GetAvailableSlotsDto {
  branch_id: string;
  date: string; // YYYY-MM-DD
  doctor_id?: string;
  specialization_id?: string;
}

export interface CreateAppointmentPayload {
  patient_id: string;
  branch_id: string;
  doctor_assigned_id?: string;
  room_id?: string;
  start_time: string; // ISO String
  end_time: string;   // ISO String
  appointment_type?: string;
  notes?: string;
  // Các trường cho định kỳ (Backend xử lý logic này)
  is_recurring?: boolean;
  recurring_count?: number;
  interval_months?: number;
}

export interface Appointment {
  id: string;
  patient?: { user: { full_name: string; phone: string; avatar?: string } };
  doctor?: { title: string; code: string; user: { full_name: string }; specialization?: { name: string } };
  branch?: { name: string; address: string };
  room?: { name: string; code: string };
  start_time: string;
  end_time: string;
  status: string;
  appointment_type?: string;
  notes?: string;
}

export const appointmentService = {
  // 1. API Lấy danh sách
  getAppointments: async (params: any) => {
    const response = await axiosInstance.get('/appointments', { params });
    return {
      data: Array.isArray(response.data) ? response.data : (response.data.data || []),
      pagination: response.data.pagination || {}
    };
  },

  // 2. API Lấy khung giờ trống (ĐÃ UPDATE: Nhận Object DTO)
  getAvailableSlots: async (params: GetAvailableSlotsDto) => {
    // Backend API nhận query params
    const response = await axiosInstance.get('/appointments/available-slots', {
      params: {
        branch_id: params.branch_id,
        date: params.date,
        doctor_id: params.doctor_id,
        specialization_id: params.specialization_id
      }
    });
    return response.data; // Trả về mảng string ['08:00', '08:30'...]
  },

  // 3. API Tạo lịch hẹn (ĐÃ UPDATE: Type Payload chuẩn)
  createAppointment: async (data: CreateAppointmentPayload) => {
    const response = await axiosInstance.post('/appointments', data);
    return response.data;
  },

  // 4. API Lấy chi tiết
  getAppointmentById: async (id: string) => {
    const response = await axiosInstance.get(`/appointments/${id}`);
    return response.data;
  },

  // 5. Các hàm bổ trợ khác (Update, Cancel, Status...)
  updateAppointment: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/appointments/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: string, status: string, reason?: string) => {
    const response = await axiosInstance.put(`/appointments/${id}/status`, { status, reason });
    return response.data;
  },

  cancelAppointment: async (id: string, reason: string) => {
    const response = await axiosInstance.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  }
};