import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, message } from 'antd';
import { authService } from '@/services/auth.service';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            authService.verifyEmail(token)
                .then((response) => {
                    setStatus('success');
                    message.success(response.message || 'Xác thực thành công!');
                })
                .catch((err) => {
                    console.error('Verify email error:', err);
                    setStatus('error');
                    const errorMessage = err.response?.data?.message || 'Xác thực thất bại';
                    message.error(errorMessage);
                });
        } else {
            setStatus('error');
            message.error('Thiếu token xác thực');
        }
    }, [token]);

    if (status === 'loading') {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spin size="large" tip="Đang xác thực tài khoản của bạn..." />
            </div>
        );
    }

    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                {status === 'success' ? (
                    <Result
                        status="success"
                        title="Xác thực thành công!"
                        subTitle="Tài khoản của bạn đã được kích hoạt. Bây giờ bạn có thể đăng nhập."
                        extra={[
                            <Button type="primary" key="login" onClick={() => navigate('/')}>
                                Đăng nhập ngay
                            </Button>
                        ]}
                    />
                ) : (
                    <Result
                        status="error"
                        title="Xác thực thất bại"
                        subTitle="Liên kết xác thực không hợp lệ hoặc đã hết hạn."
                        extra={[
                            <Button type="primary" key="resend" onClick={() => navigate('/pending-verification')}>
                                Gửi lại email xác thực
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                Quay lại trang chủ
                            </Button>
                        ]}
                    />
                )}
            </div>
        </div>
    );
}