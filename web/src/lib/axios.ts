import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getSelectedBranchId = () => {
  try {
    const persisted = localStorage.getItem('branch-storage');
    if (!persisted) {
      return null;
    }
    const parsed = JSON.parse(persisted);
    return parsed?.state?.selectedBranch?.id || null;
  } catch (error) {
    console.warn('Không thể đọc branch từ localStorage', error);
    return null;
  }
};

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const branchId = getSelectedBranchId();
    if (branchId) {
      config.headers['X-Branch-Id'] = branchId;
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
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      const requestUrl = error.config?.url || '';

      // Only perform global logout/redirect when the user is authenticated
      // and when the 401 did NOT happen on auth endpoints (login/send-otp).
      // This ensures the login page can display server error messages (e.g. "Tài khoản đã bị khoá").
      if (token && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/send-otp')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
