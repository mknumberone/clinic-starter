import axiosInstance from '@/lib/axios';

export interface Prescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  appointment?: {
    start_time: string;
    appointment_type: string;
  };
  patient?: {
    user: {
      full_name: string;
      phone: string;
    };
  };
  doctor?: {
    title: string;
    user: {
      full_name: string;
    };
  };
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
  medication?: {
    code: string;
    name: string;
    form: string;
  };
}

export interface PrescriptionListParams {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PrescriptionListResponse {
  data: Prescription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePrescriptionDto {
  appointment_id: string;
  patient_id: string;
  diagnosis?: string;
  notes?: string;
  items: Array<{
    medication_id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
  }>;
}

export const prescriptionService = {
  getPrescriptions: (params?: PrescriptionListParams): Promise<PrescriptionListResponse> => {
    return axiosInstance.get('/prescriptions', { params }).then((res: any) => res.data);
  },

  getPrescriptionById: (id: string): Promise<Prescription> => {
    return axiosInstance.get(`/prescriptions/${id}`).then((res: any) => res.data);
  },

  createPrescription: (data: CreatePrescriptionDto): Promise<Prescription> => {
    return axiosInstance.post('/prescriptions', data).then((res: any) => res.data);
  },

  updatePrescription: (id: string, data: Partial<CreatePrescriptionDto>): Promise<Prescription> => {
    return axiosInstance.put(`/prescriptions/${id}`, data).then((res: any) => res.data);
  },

  deletePrescription: (id: string): Promise<void> => {
    return axiosInstance.delete(`/prescriptions/${id}`).then((res: any) => res.data);
  },
};
