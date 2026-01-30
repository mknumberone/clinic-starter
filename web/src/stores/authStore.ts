import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- 1. ĐỊNH NGHĨA INTERFACES ---

// Interface cho Chi nhánh (nếu backend trả về object branch lồng nhau)
export interface Branch {
  id: string;
  name: string;
  address?: string;
}

// Interface User (Cập nhật đầy đủ các trường ID)
export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'BRANCH_MANAGER' | 'RECEPTIONIST';

  avatar?: string;

  // --- CÁC TRƯỜNG ID LIÊN KẾT (QUAN TRỌNG ĐỂ FIX LỖI) ---
  branch_id?: string | null;
  patient_id?: string | null; // <--- Dùng cho đặt lịch (BookingModal)
  doctor_id?: string | null;  // <--- Dùng cho bác sĩ

  // --- CÁC OBJECT CHI TIẾT (OPTIONAL) ---
  branch?: Branch;
  patient?: {
    id: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// --- 2. KHỞI TẠO STORE ---

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // Trạng thái mặc định khi logout
      const logoutState = {
        token: null,
        user: null,
        isAuthenticated: false,
      };

      // Lắng nghe event logout từ axios interceptor (nếu có cấu hình)
      if (typeof window !== 'undefined') {
        window.addEventListener('auth-logout', () => {
          set(logoutState);
        });
      }

      return {
        // State ban đầu
        user: null,
        token: null,
        isAuthenticated: false,

        // Hàm Login: Lưu token & user vào state + localStorage
        login: (token, user) => {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            token,
            user,
            isAuthenticated: true,
          });
        },

        // Hàm Logout: Xóa hết dữ liệu
        logout: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          set(logoutState);
        },

        // Hàm Update User: Cập nhật thông tin user mà không cần login lại
        updateUser: (updatedData) =>
          set((state) => {
            if (!state.user) return state;

            const newUser = { ...state.user, ...updatedData };

            // Cập nhật cả trong storage để F5 không bị mất dữ liệu mới
            localStorage.setItem('user', JSON.stringify(newUser));

            return { user: newUser };
          }),
      };
    },
    {
      name: 'auth-storage', // Tên key trong LocalStorage
      storage: createJSONStorage(() => localStorage),
      // Chỉ định các field muốn lưu vào storage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);