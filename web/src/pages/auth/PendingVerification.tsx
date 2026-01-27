import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, message, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { authService } from '@/services/auth.service';

export default function PendingVerification() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const email = searchParams.get('email') || '';

    const handleResendEmail = async (values: { email: string }) => {
        try {
            setLoading(true);
            const response = await authService.resendVerificationEmail(values.email);
            message.success(response.message || 'Email xác thực đã được gửi lại!');
            setEmailSent(true);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-5">
                <Card className="w-full max-w-md shadow-xl">
                    <Result
                        status="success"
                        title="Email đã được gửi!"
                        subTitle="Vui lòng kiểm tra hộp thư của bạn và nhấn vào link xác thực trong email."
                        extra={[
                            <Button type="primary" key="check" onClick={() => window.location.reload()}>
                                Kiểm tra email
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-5">
            <Card className="w-full max-w-md shadow-xl">
                <div className="text-center mb-6">
                    <MailOutlined className="text-6xl text-blue-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Chờ xác thực tài khoản</h2>
                    <p className="text-gray-600">
                        Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 mb-2">
                        <strong>Vui lòng làm theo các bước sau:</strong>
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                        <li>Kiểm tra hộp thư đến (Inbox) của email bạn đã đăng ký</li>
                        <li>Tìm email từ "Clinic" với tiêu đề "Xác thực tài khoản của bạn"</li>
                        <li>Nhấn vào nút "Xác thực tài khoản" hoặc link trong email</li>
                        <li>Sau khi xác thực thành công, bạn có thể đăng nhập</li>
                    </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                        <strong>💡 Lưu ý:</strong> Nếu không thấy email, hãy kiểm tra thư mục Spam/Junk.
                    </p>
                </div>

                <Form
                    onFinish={handleResendEmail}
                    layout="vertical"
                    initialValues={email ? { email } : undefined}
                >
                    <Form.Item
                        name="email"
                        label="Email của bạn"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-blue-500" />}
                            placeholder="example@email.com"
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
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Gửi lại email xác thực
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-4">
                    <Button type="link" onClick={() => navigate('/login')}>
                        Quay lại đăng nhập
                    </Button>
                </div>
            </Card>
        </div>
    );
}
