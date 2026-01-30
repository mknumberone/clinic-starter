import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, Avatar, MenuProps, Space } from 'antd';
import {
    DownOutlined,
    UserOutlined,
    LogoutOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    CalendarOutlined,
    HistoryOutlined,
    CaretDownOutlined // Icon mũi tên nhỏ cho menu dropdown
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { openLogin, openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Hàm cuộn trang (giữ nguyên logic cũ)
    const scrollToSection = (id: string) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // --- 1. CẤU HÌNH MENU DROPDOWN "VỀ DYM" ---
    const aboutMenu: MenuProps['items'] = [
        {
            key: 'about-dym',
            label: 'DYM Medical Center Vietnam',
            onClick: () => navigate('/about'), // Bạn có thể thay bằng navigate('/about') sau này
        },
        {
            key: 'branches',
            label: 'Các cơ sở phòng khám',
            onClick: () => navigate('/facilities'),
        },
        {
            key: 'team',
            label: 'Đội ngũ y khoa',
            // Map với section "doctors" ở Landing Page nếu muốn scroll xuống
            onClick: () => navigate('/doctors'),
        },
    ];

    // --- 2. CẤU HÌNH MENU DROPDOWN "DỊCH VỤ" ---
    const serviceMenu: MenuProps['items'] = [
        {
            key: 'specialties',
            label: 'Các chuyên khoa',
            onClick: () => scrollToSection('services'), // Scroll xuống phần Service
        },
        {
            key: 'packages',
            label: 'Các gói khám',
            onClick: () => console.log('Packages clicked'),
        },
        {
            key: 'vaccine',
            label: 'Tiêm chủng Vaccine',
            onClick: () => console.log('Vaccine clicked'),
        },
        {
            key: 'insurance',
            label: 'Sử dụng bảo hiểm',
            onClick: () => console.log('Insurance clicked'),
        },
    ];

    // --- 3. MENU USER (GIỮ NGUYÊN) ---
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'home',
            label: 'Trang chủ',
            icon: <UserOutlined />,
            onClick: () => navigate('/'),
        },
        {
            key: 'profile',
            label: 'Hồ sơ cá nhân',
            icon: <UserOutlined />,
            onClick: () => navigate('/patient/profile'),
        },
        { type: 'divider' },
        {
            key: 'booking',
            label: 'Đặt lịch khám mới',
            icon: <CalendarOutlined />,
            onClick: openBooking,
        },
        {
            key: 'appointments',
            label: 'Lịch hẹn của tôi',
            icon: <HistoryOutlined />,
            onClick: () => navigate('/patient/appointments'),
        },
        {
            key: 'records',
            label: 'Hồ sơ bệnh án',
            icon: <FileTextOutlined />,
            onClick: () => navigate('/patient/medical-records'),
        },
        {
            key: 'prescriptions',
            label: 'Đơn thuốc & Hóa đơn',
            icon: <MedicineBoxOutlined />,
            onClick: () => navigate('/patient/prescriptions'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    // CSS Class chung cho các nút Menu để tránh lặp code
    const menuLinkStyle = "text-[15px] font-bold text-gray-200 hover:text-[#009CAA] transition-colors uppercase tracking-wide py-2 cursor-pointer flex items-center gap-1 bg-transparent border-none outline-none";

    return (
        <header className="fixed w-full top-0 z-50 bg-[#003553] text-white shadow-lg h-[90px] transition-all">
            <div className="landing-container h-full">
                <div className="flex justify-between items-center h-full">

                    {/* --- LOGO --- */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-white text-[#003553] rounded-xl flex items-center justify-center font-extrabold text-2xl shadow-md group-hover:scale-105 transition-transform">
                            C
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-wide leading-none text-white uppercase font-sans">CLINIC</span>
                            <span className="text-[11px] text-[#009CAA] tracking-[0.2em] uppercase font-semibold mt-1">Medical Center</span>
                        </div>
                    </div>

                    {/* --- MENU GIỮA (ĐÃ CẬP NHẬT DROPDOWN) --- */}
                    <nav className="hidden xl:flex items-center gap-8">
                        {/* 1. TRANG CHỦ */}
                        <button onClick={() => scrollToSection('home')} className={menuLinkStyle}>
                            TRANG CHỦ
                        </button>

                        {/* 2. VỀ DYM (Dropdown) */}
                        <Dropdown menu={{ items: aboutMenu }} placement="bottom" arrow={{ pointAtCenter: true }}>
                            <button className={menuLinkStyle}>
                                VỀ DYM <CaretDownOutlined className="text-xs" />
                            </button>
                        </Dropdown>

                        {/* 3. DỊCH VỤ (Dropdown) */}
                        <Dropdown menu={{ items: serviceMenu }} placement="bottom" arrow={{ pointAtCenter: true }}>
                            <button className={menuLinkStyle}>
                                DỊCH VỤ <CaretDownOutlined className="text-xs" />
                            </button>
                        </Dropdown>

                        {/* 4. TIN TỨC */}
                        <button onClick={() => navigate('/news')} className={menuLinkStyle}>
                            TIN TỨC
                        </button>

                        {/* 5. LIÊN HỆ */}
                        <button onClick={() => navigate('/contact')} className={menuLinkStyle}>
                            LIÊN HỆ
                        </button>
                    </nav>

                    {/* --- RIGHT SECTION: AUTH STATE --- */}
                    <div className="flex items-center gap-5">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="primary"
                                    className="bg-[#009CAA] hover:!bg-[#0086b3] border-none font-bold h-10 px-6 rounded-full shadow-lg hidden md:block"
                                    onClick={openBooking}
                                >
                                    ĐẶT LỊCH KHÁM
                                </Button>

                                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={['click']}>
                                    <div className="flex items-center gap-3 cursor-pointer hover:bg-white/10 px-3 py-2 rounded-full transition-all border border-transparent hover:border-white/10">
                                        <div className="text-right hidden md:block">
                                            <div className="text-sm font-bold text-white leading-tight">{user.full_name}</div>
                                            <div className="text-[10px] text-[#009CAA] uppercase tracking-wider font-bold">BỆNH NHÂN</div>
                                        </div>
                                        <Avatar
                                            size="large"
                                            src={user.avatar}
                                            icon={<UserOutlined />}
                                            className="bg-[#009CAA] border-2 border-white/20"
                                        />
                                        <DownOutlined className="text-xs text-gray-400" />
                                    </div>
                                </Dropdown>
                            </div>
                        ) : (
                            <>
                                <div className="hidden lg:flex flex-col items-end text-right mr-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Hotline hỗ trợ</span>
                                    <span className="text-lg font-bold text-[#009CAA] leading-none">1900 29 29 29</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="text"
                                        className="text-white hover:text-[#009CAA] font-semibold hidden sm:inline-block"
                                        onClick={openLogin}
                                    >
                                        Đăng nhập
                                    </Button>
                                    <Button
                                        type="primary"
                                        className="bg-[#009CAA] hover:!bg-[#0086b3] border-none font-bold h-12 px-8 rounded-full shadow-lg text-[15px] uppercase tracking-wide transform hover:scale-105 transition-all"
                                        onClick={openRegister}
                                    >
                                        ĐẶT LỊCH NGAY
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}