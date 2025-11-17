import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Ngrok tunnel - hoạt động mọi nơi, không cần cùng mạng
const API_BASE_URL = 'https://piperaceous-overconstant-vaughn.ngrok-free.dev/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bỏ qua trang cảnh báo ngrok (free plan)
  },
  timeout: 15000, // 15 seconds timeout (ngrok có thể chậm hơn)
});

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
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
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user');
      // Navigation to login will be handled by the component
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
