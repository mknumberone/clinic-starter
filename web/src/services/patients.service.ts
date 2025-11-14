import { axiosInstance } from '../lib/axios';

export interface Patient {
  id: number;
  userId: number;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  user: {
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    avatar?: string;
  };
}

export const patientsService = {
  getPatient: async (id: number) => {
    const response = await axiosInstance.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  updatePatient: async (id: number, data: Partial<Patient>) => {
    const response = await axiosInstance.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  getPatientAppointments: async (id: number) => {
    const response = await axiosInstance.get(`/patients/${id}/appointments`);
    return response.data;
  },

  getPatientPrescriptions: async (id: number) => {
    const response = await axiosInstance.get(`/patients/${id}/prescriptions`);
    return response.data;
  },

  getPatientInvoices: async (id: number) => {
    const response = await axiosInstance.get(`/patients/${id}/invoices`);
    return response.data;
  },
};
