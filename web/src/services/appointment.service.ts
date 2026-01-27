import axiosInstance from '../lib/axios';

// --- INTERFACES ---
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
  branch?: { name: string; address: string; };
  doctor?: {
    id?: string;
    code: string;
    title: string;
    user: {
      full_name: string;
      avatar?: string; // Thêm avatar nếu cần
    };
    specialization?: { // <--- Thêm cái này để sửa lỗi specialization
      id: string;
      name: string;
    };
  };
  patient?: {
    id: string;
    user: {
      full_name: string;
      phone?: string;
      email?: string;
      avatar?: string;
    };
    gender?: string;
    birthday?: string;
  };
  room?: { name: string; code: string; };
  medical_record?: any;
  prescriptions?: any[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string; // Link ảnh bìa
  icon?: string; // Link icon
  content?: string; // Nội dung HTML chi tiết
}

export interface Doctor {
  id: string;
  user: { 
    full_name: string;
    avatar?: string;
  };
  title?: string;
  biography?: string;
  average_time?: number;
  specialization_id?: string;
  specialty_id?: string;
}

export interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  roomId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const appointmentService = {
  // --- 1. CÁC HÀM CŨ (GIỮ NGUYÊN ĐỂ KHÔNG LỖI APP) ---
  getMyAppointments: () => {
    return axiosInstance.get('/appointments').then((res) => res.data);
  },

  getAppointmentById: (id: string) => {
    return axiosInstance.get(`/appointments/${id}`).then((res) => res.data);
  },

  // Lấy danh sách lịch hẹn với bộ lọc (cho Admin, Doctor, Manager)
  getAppointments: (params: GetAppointmentsParams = {}) => {
    const queryParams: any = {};

    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.status) queryParams.status = params.status;
    if (params.doctorId) queryParams.doctorId = params.doctorId;
    if (params.patientId) queryParams.patientId = params.patientId;
    if (params.roomId) queryParams.roomId = params.roomId;
    if (params.branchId) queryParams.branchId = params.branchId;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    return axiosInstance.get('/appointments', { params: queryParams }).then((res) => {
      // Xử lý response an toàn
      const data = res.data;
      if (data && data.data && Array.isArray(data.data)) {
        return {
          data: data.data,
          pagination: data.pagination || { total: data.data.length, page: params.page || 1, limit: params.limit || 10 }
        };
      }
      if (Array.isArray(data)) {
        return {
          data: data,
          pagination: { total: data.length, page: params.page || 1, limit: params.limit || 10 }
        };
      }
      return { data: [], pagination: { total: 0, page: 1, limit: 10 } };
    });
  },

  // Đổi trạng thái lịch hẹn
  changeStatus: (id: string, status: string) => {
    return axiosInstance.put(`/appointments/${id}/status`, { status }).then((res) => res.data);
  },

  // Hủy lịch hẹn
  cancelAppointment: (id: string, reason?: string) => {
    return axiosInstance.post(`/appointments/${id}/cancel`, { reason }).then((res) => res.data);
  },

  // --- 2. CÁC HÀM MỚI CHO BOOKING MODAL (CẦN THÊM VÀO ĐÂY) ---

  // Lấy danh sách chi nhánh
  getBranches: (): Promise<Branch[]> => {
    return axiosInstance.get('/branches').then(res => res.data);
  },

  // Lấy danh sách chuyên khoa
  getSpecialties: (): Promise<Specialty[]> => {
    // Endpoint backend có thể là /specializations hoặc /specialties, hãy check lại swagger nếu lỗi 404
    return axiosInstance.get('/specializations')
      .then((res) => res.data)
      .catch(() => []); // Trả về rỗng nếu lỗi
  },

  // Lấy chi tiết chuyên khoa theo ID
  getSpecialtyById: (id: string): Promise<Specialty> => {
    return axiosInstance.get(`/specializations/${id}`).then((res) => res.data);
  },

  // Lấy danh sách bác sĩ (có lọc)
  getDoctors: (branchId?: string, specialtyId?: string): Promise<Doctor[]> => {
    const params: any = {};
    if (branchId) params.branch_id = branchId;
    if (specialtyId) {
      params.specialization_id = specialtyId; // Thử cả 2 trường hợp tên field
      params.specialty_id = specialtyId;
    }

    return axiosInstance.get('/doctors', { params }).then((res) => {
      // Xử lý linh hoạt cấu trúc trả về
      if (res.data && Array.isArray(res.data.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data;
      return [];
    });
  },

  // Lấy giờ khám trống ( QUAN TRỌNG: Hàm này nhận 4 tham số)
  getAvailableSlots: (branchId: string, specialtyId: string, date: string, doctorId?: string) => {
    const params = {
      branch_id: branchId,
      specialization_id: specialtyId,
      date: date,
      doctor_id: doctorId || undefined
    };
    return axiosInstance.get('/appointments/available-slots', { params }).then(res => res.data);
  },

  // Tạo lịch hẹn
  createAppointment: (data: any) => {
    return axiosInstance.post('/appointments', data).then(res => res.data);
  },
};