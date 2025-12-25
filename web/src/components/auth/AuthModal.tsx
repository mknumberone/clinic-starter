import { useState, useEffect } from 'react';
import { Modal, Tabs, Form, Input, Button, message, Steps } from 'antd';
import { PhoneOutlined, SafetyOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthModalStore } from '@/stores/authModalStore';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const { Step } = Steps;

export default function AuthModal() {
    const { isOpen, view, closeModal, openLogin, openRegister } = useAuthModalStore();
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Local state
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setPhone('');
        }
    }, [isOpen, view]);

    // --- LOGIC QUAN TRỌNG: XỬ LÝ SAU KHI ĐĂNG NHẬP THÀNH CÔNG ---
    const handleAuthSuccess = (token: string, user: any) => {
        login(token, user);
        message.success(view === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
        closeModal(); // Đóng popup ngay lập tức

        // Điều hướng dựa trên vai trò
        switch (user.role) {
            case 'ADMIN': navigate('/admin/dashboard'); break;
            case 'DOCTOR': navigate('/doctor/dashboard'); break;
            case 'BRANCH_MANAGER': navigate('/manager/dashboard'); break;
            case 'RECEPTIONIST': navigate('/receptionist/dashboard'); break;

            case 'PATIENT':
                // --- SỬA ĐỔI TẠI ĐÂY ---
                // KHÔNG chuyển hướng sang dashboard nữa.
                // Người dùng sẽ ở lại trang hiện tại (Landing Page)
                // Giao diện Navbar sẽ tự cập nhật nhờ authStore
                break;

            default: navigate('/');
        }
    };

    const handleSendOtp = async (values: { phone: string }) => {
        try {
            setLoading(true);
            await authService.sendOtp({ phone: values.phone });
            setPhone(values.phone);
            setCurrentStep(1);
            message.success('Mã OTP: 123456');
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Gửi OTP thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginVerify = async (values: { otp: string }) => {
        try {
            setLoading(true);
            const response = await authService.login({ phone, otp: values.otp });
            handleAuthSuccess(response.token, response.user);
        } catch (error: any) {
            message.error('OTP không chính xác hoặc tài khoản chưa tồn tại');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterVerify = async (values: any) => {
        try {
            setLoading(true);
            const response = await authService.register({
                phone,
                otp: values.otp,
                full_name: values.full_name,
                email: values.email,
            });
            handleAuthSuccess(response.token, response.user);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    // ... (Phần render Form Login/Register giữ nguyên như cũ) ...
    // Để tiết kiệm không gian, tôi chỉ viết lại phần logic quan trọng ở trên.
    // Bạn giữ nguyên phần return UI của Modal nhé.

    // --- RENDER FORM LOGIN (Copy lại code cũ của bạn vào đây) ---
    const renderLoginForm = () => (
        <div className="pt-4">
            <Steps size="small" current={currentStep} className="mb-6">
                <Step title="SĐT" icon={<PhoneOutlined />} />
                <Step title="OTP" icon={<SafetyOutlined />} />
            </Steps>
            {currentStep === 0 ? (
                <Form onFinish={handleSendOtp} layout="vertical">
                    <Form.Item name="phone" rules={[{ required: true, message: 'Nhập SĐT!', pattern: /^[0-9]{10}$/ }]}>
                        <Input prefix={<PhoneOutlined className="text-[#009CAA]" />} placeholder="09..." size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">GỬI OTP</Button>
                </Form>
            ) : (
                <Form onFinish={handleLoginVerify} layout="vertical">
                    <Form.Item name="otp" rules={[{ required: true, len: 6 }]}>
                        <Input prefix={<LockOutlined className="text-[#009CAA]" />} placeholder="OTP: 123456" size="large" maxLength={6} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">ĐĂNG NHẬP</Button>
                    <Button type="link" block onClick={() => setCurrentStep(0)}>Quay lại</Button>
                </Form>
            )}
        </div>
    );

    // --- RENDER FORM REGISTER (Copy lại code cũ của bạn vào đây) ---
    const renderRegisterForm = () => (
        <div className="pt-4">
            <Steps size="small" current={currentStep} className="mb-6">
                <Step title="SĐT" icon={<PhoneOutlined />} />
                <Step title="Thông tin" icon={<UserOutlined />} />
            </Steps>
            {currentStep === 0 ? (
                <Form onFinish={handleSendOtp} layout="vertical">
                    <Form.Item name="phone" rules={[{ required: true, message: 'Nhập SĐT!', pattern: /^[0-9]{10}$/ }]}>
                        <Input prefix={<PhoneOutlined className="text-[#009CAA]" />} placeholder="SĐT đăng ký" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">TIẾP TỤC</Button>
                </Form>
            ) : (
                <Form onFinish={handleRegisterVerify} layout="vertical">
                    <Form.Item name="otp" rules={[{ required: true }]}>
                        <Input prefix={<LockOutlined />} placeholder="OTP" />
                    </Form.Item>
                    <Form.Item name="full_name" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} placeholder="Họ tên" />
                    </Form.Item>
                    <Form.Item name="email">
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">ĐĂNG KÝ</Button>
                    <Button type="link" block onClick={() => setCurrentStep(0)}>Quay lại</Button>
                </Form>
            )}
        </div>
    );

    return (
        <Modal
            open={isOpen}
            onCancel={closeModal}
            footer={null}
            width={400}
            centered
            maskStyle={{ backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0, 53, 83, 0.5)' }}
        >
            <div className="text-center mb-6">
                <div className="w-10 h-10 bg-[#003553] rounded flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">C</div>
                <h3 className="text-[#003553] font-bold text-lg uppercase">Clinic Manager</h3>
            </div>
            <Tabs
                activeKey={view}
                onChange={(key) => key === 'login' ? openLogin() : openRegister()}
                centered
                items={[
                    { key: 'login', label: 'Đăng nhập', children: renderLoginForm() },
                    { key: 'register', label: 'Đăng ký', children: renderRegisterForm() },
                ]}
            />
        </Modal>
    );
}