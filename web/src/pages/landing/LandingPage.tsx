import { useNavigate } from 'react-router-dom';
import { Button, Card } from 'antd';
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
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
    const navigate = useNavigate();
    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();
    const { isAuthenticated } = useAuthStore();

    const handleBookingClick = () => {
        if (isAuthenticated) {
            openBooking();
        } else {
            openRegister();
        }
    };

    const specialties = [
        { title: 'Nội Khoa', icon: <MedicineBoxFilled />, desc: 'Chăm sóc sức khỏe tổng quát và phòng ngừa bệnh lý.', color: '#0891B2' },
        { title: 'Nha Khoa', icon: <SmileFilled />, desc: 'Dịch vụ nha khoa toàn diện và thẩm mỹ.', color: '#0891B2' },
        { title: 'Ngoại Khoa', icon: <MedicineBoxOutlined />, desc: 'Điều trị bệnh lý ngoại khoa chuyên sâu.', color: '#0891B2' },
        { title: 'Xét Nghiệm', icon: <ExperimentFilled />, desc: 'Công nghệ xét nghiệm hiện đại, chính xác.', color: '#0891B2' },
        { title: 'Tai Mũi Họng', icon: <AudioOutlined />, desc: 'Khám và điều trị Tai - Mũi - Họng.', color: '#0891B2' },
        { title: 'Nhi Khoa', icon: <TeamOutlined />, desc: 'Chăm sóc sức khỏe trẻ em toàn diện.', color: '#0891B2' },
        { title: 'Sản Phụ Khoa', icon: <WomanOutlined />, desc: 'Theo dõi thai kỳ và sức khỏe sinh sản.', color: '#0891B2' },
        { title: 'Tim Mạch', icon: <HeartFilled />, desc: 'Tầm soát và điều trị tim mạch.', color: '#0891B2' },
    ];

    const stats = [
        { num: '30+', label: 'Bác sĩ chuyên khoa' },
        { num: '160,000+', label: 'Lượt khám mỗi năm' },
        { num: '99%', label: 'Khách hàng hài lòng' },
        { num: '15+', label: 'Năm kinh nghiệm' },
    ];

    return (
        <div className="min-h-screen font-sans text-slate-800 bg-white">
            <Navbar />

            {/* ===================== HERO SECTION ===================== */}
            <div className="flex flex-col gap-4 justify-center">
                <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[#003553] via-[#004d73] to-[#006994] overflow-hidden">
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
                                    >
                                        Đặt Lịch Khám Ngay
                                    </Button>
                                    <Button
                                        size="large"
                                        className="h-16 px-10 rounded-full text-lg font-semibold bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20"
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
                <section className="my-4 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-2xl" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
                    <div className="landing-container">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="text-center">
                                    <h3 className="text-4xl lg:text-6xl font-bold text-[#003553] mb-3">
                                        {stat.num}
                                    </h3>
                                    <p className="text-slate-600 font-medium text-lg">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===================== SPECIALTIES SECTION ===================== */}
                <section className="py-24 lg:py-40 bg-white">
                    <div className="landing-container">
                        {/* Section Header */}
                        <div className="flex flex-col items-center text-center mt-">
                            <span className="inline-block text-cyan-600 font-bold text-lguppercase tracking-widest mb-4 ">
                                Chuyên Khoa
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#003553] mb-6">
                                Đa Dạng Chuyên Khoa Khám Chữa Bệnh
                            </h2>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 mx-auto rounded-full mb-6"></div>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                Phòng khám cung cấp đầy đủ các chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm,
                                trang thiết bị hiện đại đáp ứng mọi nhu cầu khám chữa bệnh
                            </p>
                        </div>

                        {/* Specialties Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                            {specialties.map((item, idx) => (
                                <Card
                                    key={idx}
                                    className="group cursor-pointer border border-slate-200 hover:border-cyan-300 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
                                    styles={{ body: { padding: '2rem' } }}
                                >
                                    <div className="text-center flex flex-col items-center">
                                        <div
                                            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform group-hover:scale-110 bg-cyan-50 text-cyan-600"
                                        >
                                            {item.icon}
                                        </div>
                                        <h4 className="font-bold text-[#003553] text-lg mb-3 group-hover:text-cyan-600 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                            {item.desc}
                                        </p>
                                        <div className="flex items-center justify-center text-cyan-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Xem chi tiết <RightOutlined className="ml-1 text-xs" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===================== WHY CHOOSE US SECTION ===================== */}
                <section className=" lg:py-20 bg-gradient-to-br from-slate-50 to-cyan-50" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
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
                                    <span className="inline-block text-cyan-600 font-bold text-sm uppercase tracking-widest mb-4">
                                        Tại Sao Chọn Chúng Tôi
                                    </span>
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
                                        <div key={idx} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow items-center">
                                            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <CheckCircleFilled className="text-2xl text-cyan-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-bold text-[#003553] text-lg mb-1">{item.title}</h4>
                                                <p className="text-slate-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===================== CTA SECTION ===================== */}
                <section className="py-24 lg:py-32 bg-gradient-to-r from-[#003553] to-[#004d73] relative overflow-hidden" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
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
                                >
                                    Đặt Lịch Khám Ngay
                                </Button>
                                <Button
                                    size="large"
                                    className="h-16 px-12 rounded-full text-lg font-semibold bg-transparent border-2 border-white/50 text-white hover:bg-white/10"
                                >
                                    <PhoneOutlined className="mr-2" />
                                    Liên Hệ Tư Vấn
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
            <Footer />
            {/* Global Components */}
            <AuthModal />
            <BookingModal />
            <ChatWidget />
        </div>
    );
}