import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Select, Spin } from 'antd';
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
  ShopOutlined,
  ScheduleOutlined,
  DatabaseOutlined // <--- 1. THÊM IMPORT ICON NÀY,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
// ---> 1. GIỮ NGUYÊN TÊN FILE CŨ CỦA BẠN (số nhiều)
import { branchesService } from '@/services/branches.service';

const { Header, Sider, Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { branches, selectedBranch, setBranches, selectBranch } = useBranchStore();

  useEffect(() => {
    let isMounted = true;
    const loadBranches = async () => {
      setBranchLoading(true);
      try {
        // ---> 2. GỌI ĐÚNG HÀM TRONG FILE CŨ (getBranches)
        const data = await branchesService.getAllBranches();
        if (!isMounted) return;
        setBranches(data);

        if (user?.branch_id) {
          selectBranch(user.branch_id);
        } else if (!selectedBranch && data.length > 0) {
          selectBranch(data[0].id);
        }
      } catch (error) {
        console.error('Lỗi tải chi nhánh:', error);
      } finally {
        if (isMounted) setBranchLoading(false);
      }
    };

    loadBranches();
    return () => { isMounted = false; };
  }, []);

  const getMenuItems = () => {
    const role = user?.role;
    const commonItems = [
      { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate(`/${role?.toLowerCase()}/dashboard`) },
    ];

    if (role === 'ADMIN') {
      return [
        ...commonItems,
        { key: 'patients', icon: <UserOutlined />, label: 'Bệnh nhân', onClick: () => navigate('/admin/patients') },
        { key: 'staff', icon: <TeamOutlined />, label: 'Quản lý Nhân sự', onClick: () => navigate('/admin/staff') },
        { key: 'doctors', icon: <TeamOutlined />, label: 'Bác sĩ', onClick: () => navigate('/admin/doctors') },
        { key: 'specializations', icon: <MedicineBoxOutlined />, label: 'Chuyên khoa & Phòng', onClick: () => navigate('/admin/specializations') },
        { key: 'appointments', icon: <CalendarOutlined />, label: 'Lịch hẹn', onClick: () => navigate('/admin/appointments') },
        { key: 'prescriptions', icon: <FileTextOutlined />, label: 'Đơn thuốc', onClick: () => navigate('/admin/prescriptions') },
        { key: 'invoices', icon: <DollarOutlined />, label: 'Hóa đơn', onClick: () => navigate('/admin/invoices') },
        { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ', onClick: () => navigate('/admin/profile') },
        {
          key: 'branches',
          icon: <ShopOutlined />,
          label: 'Quản lý Chi nhánh',
          onClick: () => navigate('/admin/branches'),
        },
        {
          key: 'medications',
          icon: <DatabaseOutlined />,
          label: 'Quản lý Kho thuốc',
          onClick: () => navigate('/admin/medications')
        },
        // ---> Đã xóa mục Bệnh nhân bị lặp ở đây <---
        {
          key: 'shifts',
          icon: <ScheduleOutlined />,
          label: 'Quản lý Lịch trực',
          onClick: () => navigate('/admin/shifts'),
        },
      ];
    }

    if (role === 'DOCTOR') {
      return [
        ...commonItems,
        { key: 'appointments', icon: <CalendarOutlined />, label: 'Lịch khám', onClick: () => navigate('/doctor/appointments') },
        { key: 'patients', icon: <UserOutlined />, label: 'Bệnh nhân', onClick: () => navigate('/doctor/patients') },
        { key: 'prescriptions', icon: <MedicineBoxOutlined />, label: 'Đơn thuốc', onClick: () => navigate('/doctor/prescriptions') },
        { key: 'schedule', icon: <CalendarOutlined />, label: 'Lịch trực', onClick: () => navigate('/doctor/schedule') },
        { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ', onClick: () => navigate('/doctor/profile') },
      ];
    }

    if (role === 'BRANCH_MANAGER') {
      return [
        ...commonItems,
        { key: 'staff', icon: <TeamOutlined />, label: 'Nhân sự Chi nhánh', onClick: () => navigate('/manager/staff') },
        { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân', onClick: () => navigate('/manager/profile') },
        {
          key: 'shifts',
          icon: <ScheduleOutlined />,
          label: 'Quản lý Lịch trực',
          // ---> 3. SỬA LẠI LINK ĐÚNG CHO MANAGER (Trước đây là /admin/shifts)
          onClick: () => navigate('/manager/shifts'),
        },
      ];
    }

    if (role === 'RECEPTIONIST') {
      return [
        ...commonItems,
        { key: 'appointments', icon: <CalendarOutlined />, label: 'Lịch hẹn & Check-in', onClick: () => navigate('/receptionist/appointments') },
        { key: 'invoices', icon: <DollarOutlined />, label: 'Thu ngân', onClick: () => navigate('/receptionist/invoices') },
        { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân', onClick: () => navigate('/receptionist/profile') },
      ];
    }

    // PATIENT
    return [
      ...commonItems,
      { key: 'book-appointment', icon: <CalendarOutlined />, label: 'Đặt lịch khám', onClick: () => navigate('/patient/book-appointment') },
      { key: 'appointments', icon: <FileTextOutlined />, label: 'Lịch hẹn', onClick: () => navigate('/patient/appointments') },
      { key: 'prescriptions', icon: <MedicineBoxOutlined />, label: 'Đơn thuốc', onClick: () => navigate('/patient/prescriptions') },
      { key: 'invoices', icon: <DollarOutlined />, label: 'Hóa đơn', onClick: () => navigate('/patient/invoices') },
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ', onClick: () => navigate('/patient/profile') },
      {
        key: 'medical-records', // Key này để active menu
        icon: <FileTextOutlined />,
        label: 'Hồ sơ bệnh án',
        onClick: () => navigate('/patient/medical-records')
      },
    ];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân', onClick: () => navigate(`/${user?.role?.toLowerCase()}/profile`) },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout, danger: true },
  ];

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-red-500',
      DOCTOR: 'bg-blue-500',
      BRANCH_MANAGER: 'bg-orange-500',
      RECEPTIONIST: 'bg-cyan-500',
      PATIENT: 'bg-green-500',
    };
    const roleLabels: Record<string, string> = {
      ADMIN: 'Quản trị',
      DOCTOR: 'Bác sĩ',
      BRANCH_MANAGER: 'Quản lý',
      RECEPTIONIST: 'Lễ tân',
      PATIENT: 'Bệnh nhân',
    };

    return (
      <div className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wide leading-tight inline-block ${roleColors[user?.role || 'PATIENT']}`}>
        {roleLabels[user?.role || 'PATIENT']}
      </div>
    );
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="shadow-xl z-20"
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
        width={240}
      >
        <div className="flex items-center justify-center h-[64px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">C</div>
            {!collapsed && <h1 className="text-white text-lg font-bold m-0 tracking-wide uppercase">Clinic</h1>}
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split('/').pop() || 'dashboard']}
          items={getMenuItems()}
          className="border-r-0 mt-2"
          style={{ background: '#001529' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Header
          className="shadow-md sticky top-0 z-10 px-4"
          style={{
            background: 'linear-gradient(to right, rgb(138, 43, 226), rgb(255, 105, 180))',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '16px',
            paddingRight: '24px'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined className="text-white" /> : <MenuFoldOutlined className="text-white" />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg hover:bg-white/10 flex items-center justify-center w-10 h-10 rounded-full transition-colors"
            style={{ color: 'white' }}
          />

          <div className="flex items-center gap-6 h-full">
            <div className="flex flex-col items-end justify-center mr-2">
              <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider mb-[2px]">
                Chi nhánh
              </span>
              {branchLoading ? (
                <Spin size="small" />
              ) : (
                <Select
                  size="small"
                  placeholder="Chọn chi nhánh"
                  style={{ width: 160 }}
                  dropdownStyle={{ minWidth: 200 }}
                  className="custom-header-select"
                  suffixIcon={<span className="text-white/80 text-[10px]">▼</span>}
                  bordered={false}
                  options={branches.map((branch) => ({ label: branch.name, value: branch.id }))}
                  value={selectedBranch?.id ?? undefined}
                  onChange={(value) => selectBranch(value)}
                  disabled={!!user?.branch_id}
                />
              )}
            </div>

            <Badge count={5} size="small" offset={[-4, 4]}>
              <Button
                type="text"
                icon={<BellOutlined className="text-xl text-white" />}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 pl-4 pr-1 py-1.5 rounded-full transition-all border border-transparent hover:border-white/20">
                <div className="hidden md:flex flex-col items-end justify-center">
                  <span className="text-sm font-bold text-white leading-tight mb-1">
                    {user?.full_name || 'Người dùng'}
                  </span>
                  {getRoleBadge()}
                </div>
                <Avatar
                  size="large"
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  className="bg-white/20 text-white border-2 border-white/40 shadow-sm"
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="m-6 p-6 bg-white rounded-xl shadow-sm min-h-[calc(100vh-112px)]">
          {children}
        </Content>
      </Layout>

      <style>{`
        .custom-header-select .ant-select-selector {
          background-color: rgba(255, 255, 255, 0.15) !important;
          color: white !important;
          border-radius: 4px !important;
          height: 24px !important;
          padding: 0 8px !important;
          display: flex;
          align-items: center;
          box-shadow: none !important;
        }
        .custom-header-select .ant-select-selection-item {
          color: white !important;
          font-weight: 600;
          font-size: 13px;
          line-height: 22px !important;
        }
        .custom-header-select .ant-select-selection-placeholder {
          color: rgba(255,255,255,0.7) !important;
          line-height: 22px !important;
        }
        .custom-header-select:hover .ant-select-selector {
          background-color: rgba(255, 255, 255, 0.25) !important;
        }
        .ant-layout-header {
          padding-inline: 0 !important;
        }
      `}</style>
    </Layout>
  );
}