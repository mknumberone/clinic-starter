import axiosInstance from '../lib/axios';

export const patientService = {
    // Lấy danh sách bệnh nhân (để tìm hồ sơ của chính mình)
    getPatients: (params?: any) => {
        return axiosInstance.get('/patients', { params }).then((res) => res.data);
    },

    // Lấy chi tiết bệnh nhân theo ID
    getPatientById: (id: string) => {
        return axiosInstance.get(`/patients/${id}`).then((res) => res.data);
    },

    // Cập nhật/Tạo hồ sơ (dùng khi chưa có hồ sơ)
    createOrUpdateProfile: (data: any) => {
        // Tùy endpoint backend của bạn, đây là ví dụ
        return axiosInstance.post('/patients', data).then((res) => res.data);
    }
};