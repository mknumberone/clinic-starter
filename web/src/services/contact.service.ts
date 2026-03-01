import axiosInstance from '@/lib/axios';

export interface CreateContactRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  branch_id?: string;
  patient_id?: string;
}

export const contactService = {
  create: (data: CreateContactRequest) =>
    axiosInstance.post('/contacts', data).then((res) => res.data),

  getAll: (params?: { status?: string; branchId?: string; page?: number; limit?: number }) =>
    axiosInstance.get('/contacts', { params }).then((res) => res.data),

  getById: (id: string) => axiosInstance.get(`/contacts/${id}`).then((res) => res.data),

  update: (id: string, data: { status?: string; admin_reply?: string }) =>
    axiosInstance.put(`/contacts/${id}`, data).then((res) => res.data),
};
