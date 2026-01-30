import axiosInstance from '../lib/axios';

export interface MobileMedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  symptoms?: string | null;
  clinical_data?: any;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    title?: string | null;
    user?: {
      full_name: string;
      phone?: string | null;
    };
    specialization?: {
      id: string;
      name: string;
    };
  };
  appointment?: {
    id: string;
    start_time: string;
    end_time: string;
    appointment_type?: string | null;
    branch?: {
      id: string;
      name: string;
    };
  };
  prescriptions?: any[];
}

export const medicalRecordService = {
  // Lấy danh sách bệnh án của bệnh nhân đang đăng nhập
  getMyRecords: async (): Promise<MobileMedicalRecord[]> => {
    const response = await axiosInstance.get('/medical-records/my-records');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Lấy chi tiết 1 bệnh án theo appointment_id (dùng trên màn chi tiết)
  getByAppointmentId: async (appointmentId: string): Promise<MobileMedicalRecord | null> => {
    const res = await axiosInstance.get(`/medical-records`, {
      params: { appointment_id: appointmentId },
    });
    const data = res.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  },
};

