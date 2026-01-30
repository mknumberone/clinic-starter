import axiosInstance from '@/lib/axios';

export interface Specialization {
    id: string;
    name: string;
    description?: string;
}

export const specializationService = {
    getSpecializations: async () => {
        try {
            const response = await axiosInstance.get('/specializations');

            // LOGIC AN TOÀN
            if (Array.isArray(response.data)) return response.data;
            if (response.data && Array.isArray(response.data.data)) return response.data.data;

            return [];
        } catch (error) {
            console.error("Lỗi API Specialization:", error);
            return [];
        }
    }
};