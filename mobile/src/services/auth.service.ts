import axiosInstance from '../lib/axios';

export interface SendOtpDto {
  phone: string;
}

export interface LoginDto {
  phone: string;
  otp: string;
}

export interface LoginResponse {
  access_token: string; // Backend trả về access_token, không phải token
  user: {
    id: string;
    phone: string;
    full_name: string;
    email?: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    branch_id?: string | null;
    patient_id?: string | null;
    doctor_id?: string | null;
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
