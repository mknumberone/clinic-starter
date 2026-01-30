import axiosInstance from '../lib/axios';

export interface Prescription {
    id: string;
    created_at: string;
    notes?: string;
    doctor?: { user: { full_name: string } };
    items: any[];
}

export interface Invoice {
    id: string;
    created_at: string;
    total_amount: number;
    status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
    items: any[];
}

export const prescriptionService = {
    // Lấy danh sách đơn thuốc
    getMyPrescriptions: (patientId: string) => {
        return axiosInstance.get(`/patients/${patientId}/prescriptions`).then((res) => res.data);
    },
    // Lấy chi tiết đơn thuốc
    getPrescriptionById: (id: string) => {
        return axiosInstance.get(`/prescriptions/${id}`).then((res) => res.data);
    },
    // Lấy danh sách hóa đơn
    getMyInvoices: (patientId: string) => {
        return axiosInstance.get(`/patients/${patientId}/invoices`).then((res) => res.data);
    },
    // Lấy chi tiết hóa đơn
    getInvoiceById: (id: string) => {
        return axiosInstance.get(`/prescriptions/invoices/${id}`).then((res) => res.data);
    },
};