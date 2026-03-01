import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Steps, Card, Checkbox } from 'antd';
import { PhoneOutlined, SafetyOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { auth, toE164 } from '@/lib/firebase';

const { Step } = Steps;

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSamplePhoneMode, setUseSamplePhoneMode] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const confirmationResultRef = useRef<{ confirm: (code: string) => Promise<any> } | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const handleSendOtp = async (values: { phone: string }) => {
    try {
      setLoading(true);
      if (useSamplePhoneMode) {
        await authService.sendOtp({ phone: values.phone });
        setPhone(values.phone);
        setCurrentStep(1);
        message.success('Mã OTP mẫu: 123456');
        return;
      }
      const phoneE164 = toE164(values.phone);
      if (!recaptchaContainerRef.current) throw new Error('Recaptcha container chưa sẵn sàng');
      recaptchaContainerRef.current.innerHTML = '';
      const recaptchaVerifier = new RecaptchaVerifier(
        recaptchaContainerRef.current,
        { size: 'invisible' },
        auth
      );
      const confirmationResult = await signInWithPhoneNumber(auth, phoneE164, recaptchaVerifier);
      confirmationResultRef.current = confirmationResult;
      setPhone(values.phone);
      setCurrentStep(1);
      message.success('Mã OTP đã được gửi đến số điện thoại của bạn');
    } catch (error: any) {
      message.error(error?.message || error?.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    try {
      setLoading(true);
      if (useSamplePhoneMode) {
        const response = await authService.register({
          phone,
          otp: values.otp,
          full_name: values.full_name,
          email: values.email,
        });
        const token = response.access_token || response.token;
        if (!token) throw new Error('Không nhận được token');
        login(token, response.user);
        message.success('Đăng ký thành công!');
        navigate('/patient/dashboard');
        return;
      }
      const confirmation = confirmationResultRef.current;
      if (!confirmation) throw new Error('Vui lòng gửi lại OTP');
      const result = await confirmation.confirm(values.otp);
      const idToken = await result.user.getIdToken();
      const response = await authService.registerPhoneFirebase({
        idToken,
        full_name: values.full_name,
        email: values.email,
      });
      const token = response.access_token || response.token;
      if (!token) throw new Error('Không nhận được token');
      login(token, response.user);
      message.success('Đăng ký thành công!');
      navigate('/patient/dashboard');
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Đăng ký thất bại');
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
        <div ref={recaptchaContainerRef} style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true" />
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
              <Checkbox checked={useSamplePhoneMode} onChange={(e) => setUseSamplePhoneMode(e.target.checked)}>
                Dùng số mẫu (OTP: 123456)
              </Checkbox>
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
              extra={useSamplePhoneMode ? 'Mã OTP mẫu: 123456' : 'Nhập mã OTP nhận được qua tin nhắn SMS'}
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
