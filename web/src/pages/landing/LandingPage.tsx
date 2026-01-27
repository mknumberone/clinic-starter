import { useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col, Tag, Spin, Empty } from 'antd';
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    HeartFilled,
    MedicineBoxFilled,
    SmileFilled,
    ExperimentFilled,
    MedicineBoxOutlined,
    AudioOutlined,
    TeamOutlined,
    WomanOutlined,
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
    const { isAuthenticated, token, user } = useAuthStore();
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

    return (
        <div className="min-h-screen font-sans text-slate-800 bg-white">
            <Navbar />

            {/* ===================== HERO SECTION ===================== */}
            <section className="relative mt-[90px] min-h-[90vh] flex items-center bg-gradient-to-br from-[#003553] via-[#004d73] to-[#006994] overflow-hidden pt-24">
                {/* Background Pattern */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-900/10 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="landing-container relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left space-y-10">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-medium text-sm">
                                <SafetyCertificateFilled className="text-cyan-400" />
                                Hệ thống y tế chuẩn Nhật Bản
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.2]">
                                Chăm Sóc Sức Khỏe
                                <span className="block text-cyan-400 mt-2">
                                    Toàn Diện & Tận Tâm
                                </span>
                            </h1>

                            <p className="text-lg text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Phòng khám đa khoa với đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại và dịch vụ chăm sóc tận tâm nhất cho sức khỏe của bạn và gia đình.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <Button
                                    size="large"
                                    onClick={handleBookingClick}
                                    className="h-16 px-10 rounded-full text-lg font-bold bg-cyan-500 border-none text-white hover:!bg-cyan-600 shadow-xl shadow-cyan-500/30"
                                    icon={<CalendarOutlined />}
                                >
                                    Đặt Lịch Khám Ngay
                                </Button>
                                <Button
                                    size="large"
                                    className="h-16 px-10 rounded-full text-lg font-semibold bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20"
                                    onClick={() => navigate('/contact')}
                                >
                                    <PhoneOutlined className="mr-2" />
                                    1900 29 29 29
                                </Button>
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4 text-white/70 text-sm">
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
                        <div className="relative hidden lg:block">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                                <img
                                    src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80"
                                    alt="Medical Team"
                                    className="w-full h-[520px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#003553]/80 via-transparent to-transparent"></div>
                            </div>

                            {/* Floating Card */}
                            <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center">
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
            </section>

            {/* ===================== STATS SECTION ===================== */}
            <section className="pt-40 lg:pt-48 pb-20 bg-gradient-to-r from-cyan-50 to-sky-50 -mt-8 relative z-10 rounded-t-3xl shadow-lg">
                <div className="landing-container">
                    <div className="mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#009CAA] to-[#006680] rounded-2xl mb-4 text-white text-2xl">
                                    {stat.icon}
                                </div>
                                <h3 className="text-4xl lg:text-6xl font-bold text-[#003553] mb-3">
                                    {stat.num}
                                </h3>
                                <p className="text-slate-600 font-medium text-lg">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== FEATURES SECTION ===================== */}
            <section className="pt-28 pb-24 bg-white">
                <div className="landing-container">
                    <div className="text-center mb-16">
                        <Tag color="cyan" className="mb-4 px-4 py-1 text-base font-semibold">
                            Tại Sao Chọn Chúng Tôi
                        </Tag>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                            Dịch Vụ Y Tế Chất Lượng Cao
                        </h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                            Chúng tôi cam kết mang đến trải nghiệm khám chữa bệnh tốt nhất với đội ngũ chuyên nghiệp và công nghệ hiện đại
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <Card
                                key={idx}
                                className="text-center border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl hover:-translate-y-2"
                            >
                                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-3xl`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#003553] mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600">
                                    {feature.desc}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== SPECIALTIES SECTION ===================== */}
            <section id="services" className="py-24 lg:py-32 bg-gradient-to-b from-white to-slate-50">
                <div className="landing-container">
                    {/* Section Header */}
                    <div className="flex flex-col items-center text-center mb-16">
                        <Tag color="cyan" className="mb-4 px-4 py-1 text-base font-semibold">
                            Chuyên Khoa
                        </Tag>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                            Đa Dạng Chuyên Khoa Khám Chữa Bệnh
                        </h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                            Phòng khám cung cấp đầy đủ các chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm,
                            trang thiết bị hiện đại đáp ứng mọi nhu cầu khám chữa bệnh
                        </p>
                    </div>

                    {/* Specialties Grid */}
                    {loadingSpecialties ? (
                        <div className="text-center py-16"><Spin size="large" /></div>
                    ) : specialties.length === 0 ? (
                        <div className="py-12"><Empty description="Chưa có chuyên khoa" /></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                            {specialties.slice(0, 8).map((item: any) => (
                                <Card
                                    key={item.id}
                                    className="group cursor-pointer border border-slate-200 hover:border-cyan-300 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden h-full"
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
                                            <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110 bg-cyan-50 text-cyan-600">
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
                        <div className="text-center mt-12">
                            <Button
                                size="large"
                                type="primary"
                                className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 px-8 font-bold rounded-full"
                                onClick={() => navigate('/doctors')}
                            >
                                Xem tất cả chuyên khoa <ArrowRightOutlined className="ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* ===================== EXAMINATION PACKAGES SECTION ===================== */}
            {featuredPackages.length > 0 && (
                <section className="py-24 bg-white">
                    <div className="landing-container">
                        <div className="text-center mb-16">
                            <Tag color="gold" className="mb-4 px-4 py-1 text-base font-semibold">
                                Gói Khám Nổi Bật
                            </Tag>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                                Các Gói Khám Sức Khỏe Phù Hợp
                            </h2>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6"></div>
                            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                                Chọn gói khám phù hợp với nhu cầu của bạn, tiết kiệm thời gian và chi phí
                            </p>
                        </div>

                        {loadingPackages ? (
                            <div className="text-center py-16"><Spin size="large" /></div>
                        ) : (
                            <Row gutter={[24, 24]}>
                                {featuredPackages.map((pkg: any) => (
                                    <Col xs={24} sm={12} lg={8} key={pkg.id}>
                                        <Card
                                            hoverable
                                            className="h-full rounded-2xl overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300"
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
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </div>
                </section>
            )}

            {/* ===================== PROCESS SECTION ===================== */}
            <section className="py-24 bg-gradient-to-br from-slate-50 to-cyan-50">
                <div className="landing-container">
                    <div className="text-center mb-16">
                        <Tag color="cyan" className="mb-4 px-4 py-1 text-base font-semibold">
                            Quy Trình Khám
                        </Tag>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                            Quy Trình Khám Chữa Bệnh Đơn Giản
                        </h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                            Chỉ với 4 bước đơn giản, bạn đã có thể đặt lịch và khám bệnh tại phòng khám của chúng tôi
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-center h-full">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#009CAA] to-[#006680] rounded-2xl flex items-center justify-center text-white text-3xl">
                                        {step.icon}
                                    </div>
                                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                                        <span className="text-cyan-600 font-bold">{step.step}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#003553] mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-600">
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
            </section>

            {/* ===================== WHY CHOOSE US SECTION ===================== */}
            <section className="py-24 lg:py-32 bg-white">
                <div className="landing-container">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
                        {/* Left - Image */}
                        <div className="lg:w-1/2">
                            <div className="rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80"
                                    alt="Modern Medical Equipment"
                                    className="w-full h-[500px] object-cover"
                                />
                            </div>
                        </div>

                        {/* Right - Content */}
                        <div className="lg:w-1/2 space-y-6">
                            <div>
                                <Tag color="cyan" className="mb-4 px-4 py-1 text-base font-semibold">
                                    Tại Sao Chọn Chúng Tôi
                                </Tag>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                                    Dịch Vụ Y Tế Chất Lượng Cao
                                </h2>
                                <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"></div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: 'Đội ngũ bác sĩ giàu kinh nghiệm', desc: 'Các bác sĩ được đào tạo bài bản tại Nhật Bản và các nước tiên tiến' },
                                    { title: 'Trang thiết bị hiện đại', desc: 'Máy móc, thiết bị y tế được nhập khẩu từ Nhật Bản và châu Âu' },
                                    { title: 'Quy trình khám linh hoạt', desc: 'Đặt lịch online, khám nhanh chóng, không phải chờ đợi lâu' },
                                    { title: 'Chăm sóc tận tâm', desc: 'Đội ngũ nhân viên thân thiện, chu đáo trong từng dịch vụ' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-cyan-50 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <CheckCircleFilled className="text-2xl text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-[#003553] text-lg mb-1">{item.title}</h4>
                                            <p className="text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== CTA SECTION ===================== */}
            <section className="py-24 lg:py-32 bg-gradient-to-r from-[#003553] to-[#004d73] relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[150px]"></div>
                </div>

                <div className="landing-container relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8">
                            Sẵn Sàng Chăm Sóc Sức Khỏe Của Bạn?
                        </h2>
                        <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                            Đặt lịch hẹn ngay hôm nay để được thăm khám và tư vấn bởi đội ngũ bác sĩ chuyên nghiệp của chúng tôi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button
                                size="large"
                                onClick={handleBookingClick}
                                className="h-16 px-12 rounded-full text-lg font-bold bg-cyan-500 text-white border-none hover:!bg-cyan-600 shadow-xl shadow-cyan-500/30"
                                icon={<CalendarOutlined />}
                            >
                                Đặt Lịch Khám Ngay
                            </Button>
                            <Button
                                size="large"
                                className="h-16 px-12 rounded-full text-lg font-semibold bg-transparent border-2 border-white/50 text-white hover:bg-white/10"
                                onClick={() => navigate('/contact')}
                            >
                                <PhoneOutlined className="mr-2" />
                                Liên Hệ Tư Vấn
                            </Button>
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
