import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleGoBack = () => {
    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        extra={[
          <Button type="primary" key="back" onClick={handleGoBack}>
            Quay về Dashboard
          </Button>,
          <Button key="logout" onClick={handleLogout}>
            Đăng xuất
          </Button>,
        ]}
      />
    </div>
  );
}
