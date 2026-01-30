import axiosInstance from '@/lib/axios';

// --- INTERFACES (Đồng bộ với Prisma Schema) ---

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string; // Tên thuốc
  medication_id?: string;
  quantity: number;
  amount: number;      // Thành tiền (Decimal ở backend về đây là number hoặc string)
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER';
  paid_at: string;
}

export interface Invoice {
  id: string;
  appointment_id?: string;
  patient_id?: string;
  branch_id: string;
  total_amount: number;
  // Enum status khớp với Backend (IN HOA)
  status: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  created_at: string;
  updated_at: string;

  // Relations
  patient?: {
    user: {
      full_name: string;
      phone: string;
    };
  };
  appointment?: {
    start_time: string;
    appointment_type: string;
  };
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceListParams {
  status?: string;
  patientId?: string;
}

export const invoiceService = {
  // 1. Lấy danh sách hóa đơn
  // API Backend: GET /prescriptions/invoices/list/all
  getInvoices: async (params?: InvoiceListParams) => {
    const response = await axiosInstance.get('/prescriptions/invoices/list/all', { params });
    // Đảm bảo luôn trả về mảng
    return Array.isArray(response.data) ? response.data : [];
  },

  // 2. Lấy chi tiết 1 hóa đơn
  // API Backend: GET /prescriptions/invoices/:id
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await axiosInstance.get(`/prescriptions/invoices/${id}`);
    return response.data;
  },

  // 3. Tạo thanh toán (Thu tiền)
  // API Backend: POST /prescriptions/payments
  createPayment: async (data: { invoice_id: string; amount: number; payment_method: string }) => {
    const response = await axiosInstance.post('/prescriptions/payments', data);
    return response.data;
  }
};