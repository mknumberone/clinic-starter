import axiosInstance from '@/lib/axios';

export const medicalRecordService = {
    // Lấy danh sách bệnh án của tôi
    getMyRecords: async () => {
        const response = await axiosInstance.get('/medical-records/my-records');
        return Array.isArray(response.data) ? response.data : [];
    },

    // Lấy chi tiết (API này có thể dùng chung với appointmentService hoặc gọi trực tiếp)
    getDetail: async (id: string) => {
        const response = await axiosInstance.get(`/medical-records/${id}`);
        return response.data;
    }
};