import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- INTERFACE USER CẬP NHẬT ---
export interface User {
  id: string;
  phone: string;
  full_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'BRANCH_MANAGER' | 'RECEPTIONIST';
  branch_id?: string;
  avatar?: string;
  email?: string;

  // ĐÃ UPDATE: Thêm thông tin bệnh nhân (nếu role là PATIENT)
  patient?: {
    id: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    // Thêm các trường khác nếu backend trả về
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      const logoutState = {
        token: null,
        user: null,
        isAuthenticated: false,
      };

      // Xử lý event logout từ interceptor (nếu có)
      if (typeof window !== 'undefined') {
        window.addEventListener('auth-logout', () => {
          set(logoutState);
        });
      }

      return {
        user: null,
        token: null,
        isAuthenticated: false,

        login: (token, user) => {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            token,
            user,
            isAuthenticated: true,
          });
        },

        logout: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          set(logoutState);
        },

        updateUser: (updatedData) =>
          set((state) => {
            if (!state.user) return state;
            const newUser = { ...state.user, ...updatedData };
            localStorage.setItem('user', JSON.stringify(newUser));
            return { user: newUser };
          }),
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);