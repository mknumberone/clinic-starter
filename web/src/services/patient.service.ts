import axiosInstance from '@/lib/axios';

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  blood_group?: string;
  allergies?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email?: string;
    phone: string;
  };
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
}

export interface PatientListResponse {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientDetail extends Patient {
  appointments?: Array<{
    id: string;
    appointment_type: string;
    start_time: string;
    end_time: string;
    status: string;
    doctor: {
      full_name: string;
      title: string;
    };
  }>;
  prescriptions?: Array<{
    id: string;
    created_at: string;
    doctor: {
      full_name: string;
    };
    items: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
  }>;
}

export const patientService = {
  getPatients: (params?: PatientListParams): Promise<PatientListResponse> => {
    return axiosInstance.get('/patients', { params }).then((res: any) => res.data);
  },

  getPatientById: (id: string): Promise<PatientDetail> => {
    return axiosInstance.get(`/patients/${id}`).then((res: any) => res.data);
  },

  updatePatient: (id: string, data: Partial<Patient>): Promise<Patient> => {
    return axiosInstance.patch(`/patients/${id}`, data).then((res: any) => res.data);
  },

  deletePatient: (id: string): Promise<void> => {
    return axiosInstance.delete(`/patients/${id}`).then((res: any) => res.data);
  },
};
