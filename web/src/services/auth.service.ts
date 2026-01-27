import axiosInstance from '@/lib/axios';

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

export interface RegisterEmailDto {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginEmailDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  access_token?: string;
  token?: string; // Fallback cho backward compatibility
  user: {
    id: string;
    phone?: string;
    full_name: string;
    email?: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'BRANCH_MANAGER' | 'RECEPTIONIST';
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

  // Đăng ký bằng Email
  registerEmail: async (data: RegisterEmailDto) => {
    const response = await axiosInstance.post('/auth/register-email', data);
    return response.data;
  },

  // Đăng nhập bằng Email
  loginEmail: async (data: LoginEmailDto) => {
    const response = await axiosInstance.post('/auth/login-email', data);
    return response.data;
  },

  // Xác thực Token từ Email
  verifyEmail: async (token: string) => {
    const response = await axiosInstance.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Gửi lại email xác thực
  resendVerificationEmail: async (email: string) => {
    const response = await axiosInstance.post('/auth/resend-verification', { email });
    return response.data;
  }
};
