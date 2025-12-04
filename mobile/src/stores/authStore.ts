import { create } from 'zustand';
import { secureStorage } from '../lib/secure-storage';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  branch_id?: string | null;
  patient_id?: string | null;
  doctor_id?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuthData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token, user) => {
    await secureStorage.setItem('access_token', token);
    await secureStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await secureStorage.deleteItem('access_token');
    await secureStorage.deleteItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadAuthData: async () => {
    try {
      const token = await secureStorage.getItem('access_token');
      const userStr = await secureStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      set({ isLoading: false });
    }
  },
}));
