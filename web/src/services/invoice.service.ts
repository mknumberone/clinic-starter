import axiosInstance from '@/lib/axios';

export interface Invoice {
  id: string;
  appointment_id: string;
  patient_id: string;
  total_amount: number;
  paid_amount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  due_date?: string;
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
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  transaction_id?: string;
  paid_at: string;
  notes?: string;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInvoiceDto {
  appointment_id: string;
  patient_id: string;
  items: Array<{
    description: string;
    quantity: number;
    amount: number;
  }>;
  notes?: string;
}

export interface CreatePaymentDto {
  amount: number;
  method: string;
  transaction_id?: string;
  notes?: string;
}

export const invoiceService = {
  getInvoices: (params?: InvoiceListParams): Promise<InvoiceListResponse> => {
    return axiosInstance.get('/invoices', { params }).then((res: any) => res.data);
  },

  getInvoiceById: (id: string): Promise<Invoice> => {
    return axiosInstance.get(`/invoices/${id}`).then((res: any) => res.data);
  },

  createInvoice: (data: CreateInvoiceDto): Promise<Invoice> => {
    return axiosInstance.post('/invoices', data).then((res: any) => res.data);
  },

  updateInvoice: (id: string, data: Partial<CreateInvoiceDto>): Promise<Invoice> => {
    return axiosInstance.put(`/invoices/${id}`, data).then((res: any) => res.data);
  },

  deleteInvoice: (id: string): Promise<void> => {
    return axiosInstance.delete(`/invoices/${id}`).then((res: any) => res.data);
  },

  createPayment: (invoiceId: string, data: CreatePaymentDto): Promise<Payment> => {
    return axiosInstance
      .post(`/invoices/${invoiceId}/payments`, data)
      .then((res: any) => res.data);
  },
};
