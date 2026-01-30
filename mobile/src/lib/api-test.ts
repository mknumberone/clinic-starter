import axios from 'axios';

// Test connection to backend
export const testConnection = async () => {
  const API_BASE_URL = 'http://192.168.100.248:3000/api';

  console.log('🔍 Testing connection to:', API_BASE_URL);

  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });

    console.log('✅ Connected! Status:', response.status);
    console.log('📦 Response:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Connection failed!');

    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout - Backend không phản hồi');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused - Backend không chạy hoặc firewall block');
    } else if (error.message.includes('Network')) {
      console.error('📡 Network error - Kiểm tra WiFi và IP');
    } else {
      console.error('Error:', error.message);
    }

    return false;
  }
};
