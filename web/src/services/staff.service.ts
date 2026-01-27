import axiosInstance from '@/lib/axios';

export interface Staff {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    role: 'ADMIN' | 'BRANCH_MANAGER' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
    branch_id?: string;
    avatar?: string;
    branch?: {
        id: string;
        name: string;
    };
    created_at: string;
    is_active: boolean; // <--- MỚI
}

export interface CreateStaffDto {
    email: string;
    phone: string;
    full_name: string;
    password: string;
    role: string;
    branch_id?: string;
}

export const staffService = {
    // Lấy danh sách nhân viên
    getStaffs: async (): Promise<Staff[]> => {
        const response = await axiosInstance.get('/staff');
        return response.data; // Backend trả về mảng user
    },

    // Tạo nhân viên mới
    createStaff: async (data: CreateStaffDto): Promise<Staff> => {
        const response = await axiosInstance.post('/staff', data);
        return response.data;
    },

    // Thêm hàm update
    updateStaff: async (id: string, data: any): Promise<Staff> => {
        const response = await axiosInstance.put(`/staff/${id}`, data);
        return response.data;
    },
};