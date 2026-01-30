import { useState, useEffect } from 'react';
import { Modal, Tabs, Form, Input, Button, message, Steps, Radio } from 'antd';
import { PhoneOutlined, SafetyOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthModalStore } from '@/stores/authModalStore';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;

type AuthMethod = 'phone' | 'email';

export default function AuthModal() {
    const { isOpen, view, closeModal, openLogin, openRegister } = useAuthModalStore();
    const { login } = useAuthStore();
    const navigate = useNavigate();

    // Local state
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [phone, setPhone] = useState('');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setPhone('');
            setAuthMethod('phone'); // Reset về phone mỗi khi mở modal
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
            case 'BRANCH_MANAGER': navigate('/branch_manager/dashboard'); break;
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
            const token = response.access_token || response.token;
            if (!token) throw new Error('Không nhận được token');
            handleAuthSuccess(token, response.user);
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
            const token = response.access_token || response.token;
            if (!token) throw new Error('Không nhận được token');
            handleAuthSuccess(token, response.user);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS CHO EMAIL AUTH ---
    const handleRegisterEmail = async (values: { email: string; password: string; full_name: string }) => {
        try {
            setLoading(true);
            const response = await authService.registerEmail(values);
            message.success(response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
            closeModal();
            // Chuyển đến trang chờ xác thực
            navigate(`/pending-verification?email=${encodeURIComponent(values.email)}`);
        } catch (error: any) {
            console.error('Lỗi đăng ký email:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginEmail = async (values: { email: string; password: string }) => {
        try {
            setLoading(true);
            const response = await authService.loginEmail(values);
            const token = response.access_token || response.token;
            if (!token) throw new Error('Không nhận được token');
            handleAuthSuccess(token, response.user);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại';
            if (error.response?.status === 403) {
                message.warning('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực.');
                closeModal();
                // Chuyển đến trang chờ xác thực
                navigate(`/pending-verification?email=${encodeURIComponent(values.email)}`);
            } else {
                message.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // ... (Phần render Form Login/Register giữ nguyên như cũ) ...
    // Để tiết kiệm không gian, tôi chỉ viết lại phần logic quan trọng ở trên.
    // Bạn giữ nguyên phần return UI của Modal nhé.

    // --- RENDER FORM LOGIN ---
    const renderLoginForm = () => {
        if (authMethod === 'email') {
            return (
                <div className="pt-4">
                    <Form onFinish={handleLoginEmail} layout="vertical">
                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                            <Input prefix={<MailOutlined className="text-[#009CAA]" />} placeholder="Email" size="large" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}>
                            <Input.Password prefix={<LockOutlined className="text-[#009CAA]" />} placeholder="Mật khẩu" size="large" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">ĐĂNG NHẬP</Button>
                    </Form>
                </div>
            );
        }

        return (
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
    };

    // --- RENDER FORM REGISTER ---
    const renderRegisterForm = () => {
        if (authMethod === 'email') {
            return (
                <div className="pt-4">
                    <Form onFinish={handleRegisterEmail} layout="vertical">
                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                            <Input prefix={<MailOutlined className="text-[#009CAA]" />} placeholder="Email" size="large" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}>
                            <Input.Password prefix={<LockOutlined className="text-[#009CAA]" />} placeholder="Mật khẩu" size="large" />
                        </Form.Item>
                        <Form.Item name="full_name" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
                            <Input prefix={<UserOutlined className="text-[#009CAA]" />} placeholder="Họ và tên" size="large" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading} className="bg-[#009CAA] font-bold">ĐĂNG KÝ</Button>
                    </Form>
                </div>
            );
        }

        return (
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
    };

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
            <div className="mb-4">
                <Radio.Group value={authMethod} onChange={(e) => setAuthMethod(e.target.value)} className="w-full flex justify-center">
                    <Radio.Button value="phone">
                        <PhoneOutlined /> Số điện thoại
                    </Radio.Button>
                    <Radio.Button value="email">
                        <MailOutlined /> Email
                    </Radio.Button>
                </Radio.Group>
            </div>
            <Tabs
                activeKey={view}
                onChange={(key) => {
                    key === 'login' ? openLogin() : openRegister();
                    setCurrentStep(0); // Reset step khi đổi tab
                }}
                centered
                items={[
                    { key: 'login', label: 'Đăng nhập', children: renderLoginForm() },
                    { key: 'register', label: 'Đăng ký', children: renderRegisterForm() },
                ]}
            />
        </Modal>
    );
}