import axiosInstance from '../lib/axios';

// --- INTERFACES CŨ (GIỮ LẠI ĐỂ KHÔNG LỖI APP) ---
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
  branch?: {
    name: string;
    address: string;
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
  // Dữ liệu quan trọng cho hồ sơ bệnh án
  medical_record?: MedicalRecord;
  prescriptions?: { items: PrescriptionItem[] }[];
}

export interface PrescriptionItem {
  id: string;
  medication: { name: string; unit: string };
  quantity: number;
  dosage: string;
  frequency: string; // Cách dùng (Sáng/Chiều...)
  duration?: string;
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

// --- INTERFACES CHO TÍNH NĂNG MỚI ---
export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface Specialty {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  user: {
    full_name: string;
  };
  specialty_id: string;
}

export interface CreateAppointmentDto {
  patient_id: string; // Thêm trường này theo yêu cầu backend
  doctor_assigned_id?: string;
  branch_id: string;
  start_time: string;
  end_time: string;
  notes: string;
  appointment_type?: string;
  source?: string;
}

export interface MedicalRecord {
  id: string;
  diagnosis: string;
  symptoms: string;
  heart_rate?: number;
  temperature?: number;
  blood_pressure?: string;
  weight?: number;
  height?: number;
  note?: string;
}

// --- SERVICE ĐẦY ĐỦ ---
export const appointmentService = {

  // 1. CÁC HÀM CŨ (KHÔI PHỤC LẠI) - Để màn hình Danh sách & Chi tiết chạy được
  getMyAppointments: (): Promise<AppointmentListResponse> => {
    return axiosInstance.get('/appointments').then((res) => res.data);
  },

  getAppointmentById: (id: string): Promise<Appointment> => {
    return axiosInstance.get(`/appointments/${id}`).then((res) => res.data);
  },

  // 2. CÁC HÀM CHO FORM ĐẶT LỊCH (Branches, Specialties, Doctors)
  getBranches: () => axiosInstance.get('/branches').then(res => res.data),

  // [SỬA LỖI 1]: Đổi endpoint sang /specializations (hoặc bạn kiểm tra lại API Swagger backend xem tên đúng là gì)
  getSpecialties: (): Promise<Specialty[]> => {
    return axiosInstance.get('/specializations')
      .then((res) => res.data)
      .catch((err) => {
        console.error("Lỗi lấy chuyên khoa:", err);
        return []; // Trả về rỗng để không crash app
      });
  },

  getDoctors: (branchId?: string, specialtyId?: string): Promise<Doctor[]> => {
    const params: any = {};
    if (branchId) params.branch_id = branchId;

    // Lưu ý: Kiểm tra lại với Backend xem họ dùng 'specialization_id' hay 'specialty_id'
    // Tôi để cả 2 để chắc chắn trúng
    if (specialtyId) {
      params.specialization_id = specialtyId;
      params.specialty_id = specialtyId;
    }

    return axiosInstance.get('/doctors', { params }).then((res) => {
      // LOGIC MỚI: Kiểm tra cấu trúc dữ liệu trả về
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data; // Trường hợp có phân trang { data: [], pagination: ... }
      }
      if (Array.isArray(res.data)) {
        return res.data; // Trường hợp trả về mảng trực tiếp []
      }
      return []; // Fallback nếu dữ liệu lạ
    });
  },

  // Hàm lấy Slot
  getAvailableSlots: (branchId: string, specialtyId: string, date: string, doctorId?: string) => {
    const params = {
      branch_id: branchId,
      specialization_id: specialtyId,
      date: date,
      doctor_id: doctorId || undefined
    };
    return axiosInstance.get('/appointments/available-slots', { params }).then(res => res.data);
  },

  createAppointment: (data: any) => axiosInstance.post('/appointments', data).then(res => res.data),
};