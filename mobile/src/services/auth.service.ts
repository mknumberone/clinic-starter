import axiosInstance from '../lib/axios';

export interface SendOtpDto {
  phone: string;
}

export interface LoginDto {
  phone: string;
  otp: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    phone: string;
    full_name: string;
    email?: string;
    role: string;
  };
}

export const authService = {
  sendOtp: (data: SendOtpDto): Promise<{ message: string }> => {
    return axiosInstance.post('/auth/send-otp', data).then((res) => res.data);
  },

  login: (data: LoginDto): Promise<LoginResponse> => {
    return axiosInstance.post('/auth/login', data).then((res) => res.data);
  },

  getProfile: (): Promise<any> => {
    return axiosInstance.get('/auth/me').then((res) => res.data);
  },
};
