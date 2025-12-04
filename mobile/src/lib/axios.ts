import axios from 'axios';
import { secureStorage } from './secure-storage';

// Thay thế ngrok URL bằng địa chỉ IP chính xác của bạn
const API_BASE_URL = 'http://192.168.100.248:3000/api';

// Xóa các headers liên quan đến ngrok vì không còn cần thiết
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await secureStorage.deleteItem('access_token');
      await secureStorage.deleteItem('user');
      // Navigation to login will be handled by the component
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
