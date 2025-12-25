import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Steps, Card } from 'antd';
import { PhoneOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';

const { Step } = Steps;

const redirectByRole = (role: string, navigate: ReturnType<typeof useNavigate>) => {
  switch (role) {
    case 'ADMIN':
      navigate('/admin/dashboard', { replace: true });
      break;
    case 'DOCTOR':
      navigate('/doctor/dashboard', { replace: true });
      break;
    case 'BRANCH_MANAGER': // <--- THÊM MỚI
      navigate('/manager/dashboard', { replace: true });
      break;
    case 'RECEPTIONIST':   // <--- THÊM MỚI
      navigate('/receptionist/dashboard', { replace: true });
      break;
    case 'PATIENT':
      navigate('/', { replace: true });
      break;
    default:
      // Nếu role lạ, đá về login
      navigate('/login', { replace: true });
  }
};
export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role, navigate);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSendOtp = async (values: { phone: string }) => {
    try {
      setLoading(true);
      await authService.sendOtp({ phone: values.phone });
      setPhone(values.phone);
      setCurrentStep(1);
      message.success('Mã OTP đã được gửi đến số điện thoại của bạn (Mặc định: 123456)');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (values: { otp: string }) => {
    try {
      setLoading(true);
      const response = await authService.login({
        phone,
        otp: values.otp,
      });

      console.log('Login response:', response);
      console.log('User role:', response.user.role);

      login(response.token, response.user);
      message.success('Đăng nhập thành công!');

      // Navigate based on role
      redirectByRole(response.user.role, navigate);
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500">
      <Card
        className="w-full max-w-md shadow-2xl"
        title={
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-600 m-0">🏥 Clinic Manager</h2>
            <p className="text-gray-600 mt-2 mb-0">Đăng nhập vào hệ thống</p>
          </div>
        }
      >
        <Steps current={currentStep} className="mb-6">
          <Step title="Số điện thoại" icon={<PhoneOutlined />} />
          <Step title="Xác thực OTP" icon={<SafetyOutlined />} />
        </Steps>

        {currentStep === 0 && (
          <Form onFinish={handleSendOtp} layout="vertical">
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="0987654321"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Gửi mã OTP
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form onFinish={handleVerifyOtp} layout="vertical">
            <Form.Item
              name="otp"
              label="Mã OTP"
              rules={[
                { required: true, message: 'Vui lòng nhập mã OTP!' },
                { len: 6, message: 'Mã OTP phải có 6 chữ số!' }
              ]}
              extra="Mã OTP mặc định trong môi trường phát triển: 123456"
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="123456"
                size="large"
                maxLength={6}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Xác nhận
              </Button>
            </Form.Item>
            <Button
              type="link"
              block
              onClick={() => setCurrentStep(0)}
            >
              ← Quay lại
            </Button>
          </Form>
        )}

        <div className="text-center mt-4">
          <Link to="/register">
            <UserOutlined /> Chưa có tài khoản? Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
}
