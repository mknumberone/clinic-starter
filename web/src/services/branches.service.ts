import axiosInstance from '@/lib/axios';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  image?: string;
  is_active?: boolean;
}

export const branchesService = {
  // Hàm lấy danh sách chi nhánh (Fix lỗi parsing data)
  getBranches: async () => {
    try {
      const response = await axiosInstance.get('/branches');

      // LOGIC AN TOÀN: Kiểm tra mọi trường hợp backend có thể trả về
      if (Array.isArray(response.data)) return response.data;
      if (response.data && Array.isArray(response.data.data)) return response.data.data;
      if (response.data && Array.isArray(response.data.result)) return response.data.result;

      return [];
    } catch (error) {
      console.error("Lỗi API Branch:", error);
      return [];
    }
  },

  getAllBranches: async () => {
    return branchesService.getBranches(); // Tái sử dụng hàm trên
  },

  getBranchById: async (id: string) => {
    const response = await axiosInstance.get(`/branches/${id}`);
    return response.data;
  },

  createBranch: async (data: any) => {
    const response = await axiosInstance.post('/branches', data);
    return response.data;
  },

  updateBranch: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: string) => {
    const response = await axiosInstance.delete(`/branches/${id}`);
    return response.data;
  }
};