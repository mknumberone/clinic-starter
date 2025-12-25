import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Steps, Card } from 'antd';
import { PhoneOutlined, SafetyOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';

const { Step } = Steps;

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSendOtp = async (values: { phone: string }) => {
    try {
      setLoading(true);
      await authService.sendOtp({ phone: values.phone });
      setPhone(values.phone);
      setCurrentStep(1);
      message.success('Mã OTP đã được gửi (Mặc định: 123456)');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    try {
      setLoading(true);
      const response = await authService.register({
        phone,
        otp: values.otp,
        full_name: values.full_name,
        email: values.email,
      });
      login(response.token, response.user);
      message.success('Đăng ký thành công!');
      navigate('/patient/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <Card
        className="w-full max-w-md shadow-2xl"
        title={
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-600 m-0">🏥 Clinic Manager</h2>
            <p className="text-gray-600 mt-2 mb-0">Đăng ký tài khoản mới</p>
          </div>
        }
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Số điện thoại" icon={<PhoneOutlined />} />
          <Step title="Thông tin" icon={<UserOutlined />} />
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
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Tiếp tục
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form onFinish={handleRegister} layout="vertical">
            <Form.Item
              name="otp"
              label="Mã OTP"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
              extra="Mã OTP mặc định: 123456"
            >
              <Input prefix={<SafetyOutlined />} placeholder="123456" maxLength={6} />
            </Form.Item>

            <Form.Item
              name="full_name"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item name="email" label="Email (tùy chọn)">
              <Input prefix={<MailOutlined />} type="email" placeholder="example@email.com" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Đăng ký
              </Button>
            </Form.Item>
            <Button type="link" block onClick={() => setCurrentStep(0)}>
              ← Quay lại
            </Button>
          </Form>
        )}

        <div className="text-center mt-4">
          <Link to="/login">
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
}
