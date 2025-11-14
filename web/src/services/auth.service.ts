import { axiosInstance } from '../lib/axios';

export interface SendOtpDto {
  phone: string;
}

export interface RegisterDto {
  phone: string;
  otp: string;
  full_name: string;
  email?: string;
}

export interface LoginDto {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    phone: string;
    full_name: string;
    email?: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  };
}

export const authService = {
  sendOtp: async (data: SendOtpDto) => {
    const response = await axiosInstance.post('/auth/send-otp', data);
    return response.data;
  },

  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};
