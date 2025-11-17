import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getMenuItems = () => {
    const role = user?.role;
    
    const commonItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate(`/${role?.toLowerCase()}/dashboard`),
      },
    ];

    if (role === 'ADMIN') {
      return [
        ...commonItems,
        {
          key: 'patients',
          icon: <UserOutlined />,
          label: 'Bệnh nhân',
          onClick: () => navigate('/admin/patients'),
        },
        {
          key: 'doctors',
          icon: <TeamOutlined />,
          label: 'Bác sĩ',
          onClick: () => navigate('/admin/doctors'),
        },
        {
          key: 'specializations',
          icon: <MedicineBoxOutlined />,
          label: 'Chuyên khoa & Phòng',
          onClick: () => navigate('/admin/specializations'),
        },
        {
          key: 'appointments',
          icon: <CalendarOutlined />,
          label: 'Lịch hẹn',
          onClick: () => navigate('/admin/appointments'),
        },
        {
          key: 'prescriptions',
          icon: <FileTextOutlined />,
          label: 'Đơn thuốc',
          onClick: () => navigate('/admin/prescriptions'),
        },
        {
          key: 'invoices',
          icon: <DollarOutlined />,
          label: 'Hóa đơn',
          onClick: () => navigate('/admin/invoices'),
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Hồ sơ',
          onClick: () => navigate('/admin/profile'),
        },
      ];
    }

    if (role === 'DOCTOR') {
      return [
        ...commonItems,
        {
          key: 'appointments',
          icon: <CalendarOutlined />,
          label: 'Lịch khám',
          onClick: () => navigate('/doctor/appointments'),
        },
        {
          key: 'patients',
          icon: <UserOutlined />,
          label: 'Bệnh nhân',
          onClick: () => navigate('/doctor/patients'),
        },
        {
          key: 'prescriptions',
          icon: <MedicineBoxOutlined />,
          label: 'Đơn thuốc',
          onClick: () => navigate('/doctor/prescriptions'),
        },
        {
          key: 'schedule',
          icon: <CalendarOutlined />,
          label: 'Lịch trực',
          onClick: () => navigate('/doctor/schedule'),
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Hồ sơ',
          onClick: () => navigate('/doctor/profile'),
        },
      ];
    }

    // PATIENT
    return [
      ...commonItems,
      {
        key: 'book-appointment',
        icon: <CalendarOutlined />,
        label: 'Đặt lịch khám',
        onClick: () => navigate('/patient/book-appointment'),
      },
      {
        key: 'appointments',
        icon: <FileTextOutlined />,
        label: 'Lịch hẹn',
        onClick: () => navigate('/patient/appointments'),
      },
      {
        key: 'prescriptions',
        icon: <MedicineBoxOutlined />,
        label: 'Đơn thuốc',
        onClick: () => navigate('/patient/prescriptions'),
      },
      {
        key: 'invoices',
        icon: <DollarOutlined />,
        label: 'Hóa đơn',
        onClick: () => navigate('/patient/invoices'),
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ',
        onClick: () => navigate('/patient/profile'),
      },
    ];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate(`/${user?.role?.toLowerCase()}/profile`),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('patients')) return 'patients';
    if (path.includes('doctors')) return 'doctors';
    if (path.includes('appointments')) return 'appointments';
    if (path.includes('prescriptions')) return 'prescriptions';
    if (path.includes('invoices')) return 'invoices';
    if (path.includes('schedule')) return 'schedule';
    if (path.includes('profile')) return 'profile';
    if (path.includes('settings')) return 'settings';
    if (path.includes('book-appointment')) return 'book-appointment';
    return 'dashboard';
  };

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-red-500',
      DOCTOR: 'bg-blue-500',
      PATIENT: 'bg-green-500',
    };
    const roleLabels: Record<string, string> = {
      ADMIN: 'Quản trị',
      DOCTOR: 'Bác sĩ',
      PATIENT: 'Bệnh nhân',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs text-white ${roleColors[user?.role || 'PATIENT']}`}>
        {roleLabels[user?.role || 'PATIENT']}
      </span>
    );
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="shadow-lg"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h1 className="text-white text-xl font-bold m-0">
            {collapsed ? '🏥' : '🏥 Clinic'}
          </h1>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={getMenuItems()}
          className="border-r-0"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header className="bg-white shadow-sm px-4 flex items-center justify-between sticky top-0 z-10">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg"
          />

          <div className="flex items-center gap-4">
            <Badge count={5}>
              <Button type="text" icon={<BellOutlined className="text-lg" />} />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
                <div className="text-right">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">{getRoleBadge()}</div>
                </div>
                <Avatar 
                  size="large" 
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="m-6 p-6 bg-gray-50 rounded-lg min-h-[calc(100vh-88px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
