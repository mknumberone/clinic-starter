import { useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Spin, Empty } from 'antd';
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    HeartFilled,
    MedicineBoxFilled,
    MedicineBoxOutlined,
    PhoneOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    RightOutlined,
    GiftOutlined,
    StarFilled,
    UserOutlined,
    CalendarOutlined,
    ArrowRightOutlined,
    TrophyFilled,
    ThunderboltFilled,
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointment.service';
import axiosInstance from '@/lib/axios';

import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { useEffect } from 'react';

export default function LandingPage() {
    const navigate = useNavigate();
    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();
    const { isAuthenticated, token } = useAuthStore();
    const { connect, disconnect } = useSocketStore();

    // Khởi tạo socket connection cho user đã đăng nhập
    useEffect(() => {
        if (token) {
            connect(token);
        }
        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    const handleBookingClick = () => {
        if (isAuthenticated) {
            openBooking();
        } else {
            openRegister();
        }
    };

    // Lấy danh sách chuyên khoa
    const { data: specialties = [], isFetching: loadingSpecialties } = useQuery({
        queryKey: ['specialties'],
        queryFn: appointmentService.getSpecialties
    });

    // Lấy danh sách gói khám nổi bật
    const { data: allPackages = [], isFetching: loadingPackages } = useQuery({
        queryKey: ['examination-packages'],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get('/examination-packages');
                return res.data || [];
            } catch (error) {
                console.error('Error fetching packages:', error);
                return [];
            }
        },
    });

    // Lọc gói khám nổi bật từ danh sách
    const featuredPackages = allPackages
        .filter((pkg: any) => pkg.is_featured === true)
        .slice(0, 6);

    const stats = [
        { num: '30+', label: 'Bác sĩ chuyên khoa', icon: <UserOutlined /> },
        { num: '160,000+', label: 'Lượt khám mỗi năm', icon: <MedicineBoxOutlined /> },
        { num: '99%', label: 'Khách hàng hài lòng', icon: <StarFilled /> },
        { num: '15+', label: 'Năm kinh nghiệm', icon: <TrophyFilled /> },
    ];

    const features = [
        {
            icon: <SafetyCertificateFilled />,
            title: 'Chuẩn Nhật Bản',
            desc: 'Quy trình khám chữa bệnh theo tiêu chuẩn y tế Nhật Bản',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: <ThunderboltFilled />,
            title: 'Đặt lịch nhanh',
            desc: 'Đặt lịch online 24/7, không cần chờ đợi',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: <HeartFilled />,
            title: 'Chăm sóc tận tâm',
            desc: 'Đội ngũ nhân viên thân thiện, chu đáo',
            color: 'from-red-500 to-orange-500'
        },
        {
            icon: <CheckCircleFilled />,
            title: 'Thiết bị hiện đại',
            desc: 'Máy móc nhập khẩu từ Nhật Bản và châu Âu',
            color: 'from-green-500 to-emerald-500'
        },
    ];

    const processSteps = [
        {
            step: '01',
            title: 'Đặt lịch hẹn',
            desc: 'Chọn chuyên khoa, bác sĩ và thời gian phù hợp',
            icon: <CalendarOutlined />
        },
        {
            step: '02',
            title: 'Khám bệnh',
            desc: 'Bác sĩ thăm khám và tư vấn chi tiết',
            icon: <MedicineBoxOutlined />
        },
        {
            step: '03',
            title: 'Nhận kết quả',
            desc: 'Nhận kết quả và đơn thuốc (nếu có)',
            icon: <CheckCircleFilled />
        },
        {
            step: '04',
            title: 'Theo dõi',
            desc: 'Theo dõi tình trạng sức khỏe qua hệ thống',
            icon: <HeartFilled />
        },
    ];

    /* Section header component - dùng chung, mọi thứ căn giữa */
    const SectionHeader = ({ tag, title, desc }: { tag: string; title: string; desc?: string }) => (
        <div className="landing-section-header">
            <Tag color="cyan" className="mb-3 px-4 py-1 text-base font-semibold">
                {tag}
            </Tag>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#003553] mb-4 text-center">
                {title}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded mb-4"></div>
            {desc && <p className="text-slate-600 text-base max-w-2xl text-center">{desc}</p>}
        </div>
    );

    return (
        <div className="min-h-screen font-sans text-slate-800 bg-white">
            <Navbar />

            {/* ===================== HERO SECTION ===================== */}
            <section style={{ marginBottom: '30px' }} className="relative mt-[90px] min-h-[90vh] flex items-center bg-gradient-to-br from-[#003553] via-[#004d73] to-[#006994] overflow-hidden pt-24 pb-0">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-900/10 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="landing-container relative z-10 w-full">
                    <div className="landing-section-content">
                        <div className="grid lg:grid-cols-2 gap-16 items-center justify-items-center w-full max-w-6xl mx-auto">
                            {/* Left Content - centered */}
                            <div className="text-center space-y-8 w-full flex flex-col items-center">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded bg-white/10 backdrop-blur border border-white/20 text-white font-medium text-sm">
                                    <SafetyCertificateFilled className="text-cyan-400" />
                                    Hệ thống y tế chuẩn Nhật Bản
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.2]">
                                    Chăm Sóc Sức Khỏe
                                    <span className="block text-cyan-400 mt-2">
                                        Toàn Diện & Tận Tâm
                                    </span>
                                </h1>

                                <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                                    Phòng khám đa khoa với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại và dịch vụ chăm sóc tận tâm nhất cho sức khỏe của bạn và gia đình.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="large"
                                    onClick={handleBookingClick}
                                    className="h-12 px-8 rounded-lg text-base font-bold bg-cyan-500 border-none text-white hover:!bg-cyan-600 shadow-lg shadow-cyan-500/30"
                                    icon={<CalendarOutlined />}
                                >
                                    Đặt Lịch Khám Ngay
                                </Button>
                                <Button
                                    size="large"
                                    className="h-12 px-8 rounded-lg text-base font-semibold bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20"
                                    onClick={() => navigate('/contact')}
                                >
                                    <PhoneOutlined className="mr-2" />
                                    1900 29 29 29
                                </Button>
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap justify-center gap-8 pt-4 text-white/70 text-sm">
                                <div className="flex items-center gap-2">
                                    <ClockCircleOutlined className="text-cyan-400 text-lg" />
                                    <span>Mở cửa: 7:00 - 20:00</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <EnvironmentOutlined className="text-cyan-400 text-lg" />
                                    <span>Số 1 Đại Cồ Việt, Hà Nội</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Image */}
                        <div className="relative hidden lg:block w-full max-w-lg mx-auto">
                            <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-white/10">
                                <img
                                    src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80"
                                    alt="Medical Team"
                                    className="w-full h-[520px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#003553]/80 via-transparent to-transparent"></div>
                            </div>

                            {/* Floating Card */}
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg p-5 shadow-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <CheckCircleFilled className="text-3xl text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-2xl">15,000+</p>
                                        <p className="text-slate-500">Khách hàng tin dùng mỗi năm</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== STATS SECTION ===================== */}
            <section style={{ marginBottom: '30px' }} className="pt-12 pb-12 bg-gradient-to-r from-cyan-50 to-sky-50 relative z-10">
                <div className="landing-container">
                    <div className="landing-section-content">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-5xl mx-auto">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#009CAA] to-[#006680] rounded-lg mb-3 text-white text-xl">
                                    {stat.icon}
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-bold text-[#003553] mb-2">
                                    {stat.num}
                                </h3>
                                <p className="text-slate-600 font-medium text-sm">{stat.label}</p>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== FEATURES SECTION ===================== */}
            <section style={{ marginBottom: '30px' }} className="py-12 bg-white">
                <div className="landing-container">
                    <div className="landing-section-content">
                        <SectionHeader
                            tag="Tại Sao Chọn Chúng Tôi"
                            title="Dịch Vụ Y Tế Chất Lượng Cao"
                            desc="Chúng tôi cam kết mang đến trải nghiệm khám chữa bệnh tốt nhất với đội ngũ chuyên nghiệp và công nghệ hiện đại"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto w-full">
                        {features.map((feature, idx) => (
                            <Card
                                key={idx}
                                className="text-center border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-lg hover:-translate-y-1"
                            >
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-2xl`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-[#003553] mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    {feature.desc}
                                </p>
                            </Card>
                        ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== SPECIALTIES SECTION ===================== */}
            <section id="services" style={{ marginBottom: '30px' }} className="py-12 bg-gradient-to-b from-white to-slate-50">
                <div className="landing-container">
                    <div className="landing-section-content">
                        <SectionHeader
                            tag="Chuyên Khoa"
                            title="Đa Dạng Chuyên Khoa Khám Chữa Bệnh"
                            desc="Phòng khám cung cấp đầy đủ các chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại đáp ứng mọi nhu cầu khám chữa bệnh"
                        />

                        {loadingSpecialties ? (
                            <div className="flex justify-center py-12 w-full"><Spin size="large" /></div>
                        ) : specialties.length === 0 ? (
                            <div className="flex justify-center py-12 w-full"><Empty description="Chưa có chuyên khoa" /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-6xl mx-auto w-full">
                            {specialties.slice(0, 8).map((item: any) => (
                                <Card
                                    key={item.id}
                                    className="group cursor-pointer border border-slate-200 hover:border-cyan-300 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden h-full"
                                    styles={{ body: { padding: '2rem' } }}
                                    onClick={() => navigate(`/specialties/${item.id}`)}
                                    cover={
                                        item.image ? (
                                            <div className="h-40 overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-40 bg-gradient-to-br from-[#009CAA] to-[#006680] flex items-center justify-center">
                                                <MedicineBoxFilled className="text-6xl text-white/50" />
                                            </div>
                                        )
                                    }
                                >
                                    <div className="text-center flex flex-col items-center">
                                        {item.icon && (
                                            <div className="w-14 h-14 mx-auto rounded-lg flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-105 bg-cyan-50 text-cyan-600">
                                                <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <h4 className="font-bold text-[#003553] text-lg mb-3 group-hover:text-cyan-600 transition-colors text-center line-clamp-2">
                                            {item.name}
                                        </h4>
                                        {item.description && (
                                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-center text-cyan-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Xem chi tiết <RightOutlined className="ml-1 text-xs" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            </div>
                        )}

                        {specialties.length > 8 && (
                            <div className="flex justify-center mt-10">
                                <Button
                                    size="large"
                                    type="primary"
                                    className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-11 px-8 font-bold rounded-lg"
                                    onClick={() => navigate('/doctors')}
                                >
                                    Xem tất cả chuyên khoa <ArrowRightOutlined className="ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===================== EXAMINATION PACKAGES SECTION ===================== */}
            {featuredPackages.length > 0 && (
                <section style={{ marginBottom: '30px' }} className="py-12 bg-white">
                    <div className="landing-container">
                        <div className="landing-section-content">
                            <div className="landing-section-header">
                            <Tag color="gold" className="mb-3 px-4 py-1 text-base font-semibold">
                                Gói Khám Nổi Bật
                            </Tag>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#003553] mb-4">
                                Các Gói Khám Sức Khỏe Phù Hợp
                            </h2>
                            <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded mb-4"></div>
                            <p className="text-slate-600 text-base max-w-2xl mx-auto">
                                Chọn gói khám phù hợp với nhu cầu của bạn, tiết kiệm thời gian và chi phí
                            </p>
                        </div>

                        {loadingPackages ? (
                            <div className="flex justify-center py-12"><Spin size="large" /></div>
                        ) : (
                            <div className="max-w-6xl mx-auto w-full">
                                <div
                                    className="grid gap-6 w-full"
                                    style={{
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
                                        justifyItems: 'center',
                                    }}
                                >
                                    {featuredPackages.map((pkg: any) => (
                                        <div key={pkg.id} className="w-full min-w-0">
                                            <Card
                                                hoverable
                                                className="h-full rounded-lg overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 w-full"
                                            cover={
                                                pkg.image ? (
                                                    <img
                                                        alt={pkg.name}
                                                        src={pkg.image}
                                                        className="h-48 object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-48 bg-gradient-to-br from-[#009CAA] to-[#006680] flex items-center justify-center">
                                                        <GiftOutlined className="text-6xl text-white/50" />
                                                    </div>
                                                )
                                            }
                                            onClick={() => {
                                                if (pkg.specialization?.id) {
                                                    navigate(`/specialties/${pkg.specialization.id}`);
                                                }
                                            }}
                                        >
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <Tag color="gold" className="mb-2">Nổi bật</Tag>
                                                    {pkg.specialization && (
                                                        <Tag color="blue">{pkg.specialization.name}</Tag>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-[#003553] mb-3 line-clamp-2">
                                                    {pkg.name}
                                                </h3>
                                                {pkg.description && (
                                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                        {pkg.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <div className="text-2xl font-bold text-[#009CAA]">
                                                            {new Intl.NumberFormat('vi-VN').format(Number(pkg.price))} đ
                                                        </div>
                                                        {pkg.original_price && Number(pkg.original_price) > Number(pkg.price) && (
                                                            <div className="text-sm text-gray-400 line-through">
                                                                {new Intl.NumberFormat('vi-VN').format(Number(pkg.original_price))} đ
                                                            </div>
                                                        )}
                                                    </div>
                                                    {pkg.duration && (
                                                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                                                            <ClockCircleOutlined />
                                                            <span>{pkg.duration} phút</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    type="primary"
                                                    block
                                                    className="bg-[#009CAA] hover:!bg-[#0086b3] border-none font-bold rounded-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBookingClick();
                                                    }}
                                                >
                                                    Đặt lịch ngay
                                                </Button>
                                            </div>
                                        </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </section>
            )}

            {/* ===================== PROCESS SECTION ===================== */}
            <section style={{ marginBottom: '30px' }} className="py-12 bg-gradient-to-br from-slate-50 to-cyan-50">
                <div className="landing-container">
                    <div className="landing-section-content">
                        <SectionHeader
                            tag="Quy Trình Khám"
                            title="Quy Trình Khám Chữa Bệnh Đơn Giản"
                            desc="Chỉ với 4 bước đơn giản, bạn đã có thể đặt lịch và khám bệnh tại phòng khám của chúng tôi"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
                        {processSteps.map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 text-center h-full">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#009CAA] to-[#006680] rounded-lg flex items-center justify-center text-white text-2xl">
                                        {step.icon}
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-cyan-100 rounded flex items-center justify-center">
                                        <span className="text-cyan-600 font-bold text-sm">{step.step}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#003553] mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm">
                                        {step.desc}
                                    </p>
                                </div>
                                {idx < processSteps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRightOutlined className="text-3xl text-cyan-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== WHY CHOOSE US SECTION ===================== */}
            <section style={{ marginBottom: '30px' }} className="py-16 bg-white">
                <div className="landing-container">
                    <div className="landing-section-content">
                        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-center justify-center max-w-6xl mx-auto w-full">
                            {/* Left - Image - centered */}
                            <div className="lg:w-1/2 w-full flex justify-center">
                                <div className="rounded-lg overflow-hidden shadow-xl max-w-lg w-full mx-auto border border-slate-100">
                                    <img
                                        src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80"
                                        alt="Modern Medical Equipment"
                                        className="w-full h-[520px] object-cover"
                                    />
                                </div>
                            </div>

                            {/* Right - Content - centered */}
                            <div className="lg:w-1/2 w-full flex flex-col items-center text-center">
                                <div className="w-full max-w-md mx-auto mb-8">
                                    <Tag color="cyan" className="mb-4 px-4 py-1.5 text-base font-semibold">
                                        Tại Sao Chọn Chúng Tôi
                                    </Tag>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#003553] mb-5">
                                        Dịch Vụ Y Tế Chất Lượng Cao
                                    </h2>
                                    <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded mx-auto"></div>
                                </div>

                                <div className="space-y-5 w-full max-w-lg mx-auto">
                                    {[
                                        { title: 'Đội ngũ bác sĩ giàu kinh nghiệm', desc: 'Các bác sĩ được đào tạo bài bản tại Nhật Bản và các nước tiên tiến' },
                                        { title: 'Trang thiết bị hiện đại', desc: 'Máy móc, thiết bị y tế được nhập khẩu từ Nhật Bản và châu Âu' },
                                        { title: 'Quy trình khám linh hoạt', desc: 'Đặt lịch online, khám nhanh chóng, không phải chờ đợi lâu' },
                                        { title: 'Chăm sóc tận tâm', desc: 'Đội ngũ nhân viên thân thiện, chu đáo trong từng dịch vụ' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-5 p-5 bg-gradient-to-r from-slate-50 to-cyan-50/80 rounded-lg shadow-sm border border-slate-100 hover:shadow-lg hover:border-cyan-100 transition-all duration-300 items-center justify-center text-center">
                                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <CheckCircleFilled className="text-2xl text-white" />
                                            </div>
                                            <div className="flex flex-col flex-1 text-center">
                                                <h4 className="font-bold text-[#003553] text-base mb-1">{item.title}</h4>
                                                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== CTA SECTION ===================== */}
            <section style={{ marginBottom: 0, paddingTop: '20px', paddingBottom: '20px' }} className="bg-gradient-to-r from-[#003553] to-[#004d73] relative overflow-hidden min-h-[280px] flex items-center">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[150px]"></div>
                </div>

                <div className="landing-container relative z-10">
                    <div className="landing-section-content">
                        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full space-y-8">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                            Sẵn Sàng Chăm Sóc Sức Khỏe Của Bạn?
                        </h2>
                        <p className="text-white/80 text-base lg:text-lg leading-relaxed max-w-2xl">
                            Đặt lịch hẹn ngay hôm nay để được thăm khám và tư vấn bởi đội ngũ bác sĩ chuyên nghiệp của chúng tôi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-2">
                            <Button
                                size="large"
                                onClick={handleBookingClick}
                                className="h-12 px-10 rounded-lg text-base font-bold bg-cyan-500 text-white border-none hover:!bg-cyan-600 shadow-lg shadow-cyan-500/30"
                                icon={<CalendarOutlined />}
                            >
                                Đặt Lịch Khám Ngay
                            </Button>
                            <Button
                                size="large"
                                className="h-12 px-10 rounded-lg text-base font-semibold bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/70"
                                onClick={() => navigate('/contact')}
                            >
                                <PhoneOutlined className="mr-2" />
                                Liên Hệ Tư Vấn
                            </Button>
                        </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            {/* Global Components */}
            <AuthModal />
            <BookingModal />
            <ChatWidget />
        </div>
    );
}
