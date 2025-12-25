import { useNavigate } from 'react-router-dom';
import { Button, Card } from 'antd';
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    HeartFilled,
    MedicineBoxFilled,
    SmileFilled,
    ExperimentFilled,
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

// --- IMPORTS CÁC TIỆN ÍCH TOÀN CỤC ---
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal'; // Component Modal đặt lịch
import ChatWidget from '@/components/chat/ChatWidget';       // <--- QUAN TRỌNG: Component Chat
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
    const navigate = useNavigate();

    // Lấy các state và hàm mở modal
    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();
    const { isAuthenticated } = useAuthStore();

    // --- LOGIC XỬ LÝ KHI BẤM NÚT ĐẶT LỊCH ---
    const handleBookingClick = () => {
        if (isAuthenticated) {
            // Nếu đã đăng nhập -> Mở form đặt lịch ngay
            openBooking();
        } else {
            // Nếu chưa đăng nhập -> Mở form đăng ký/đăng nhập
            openRegister();
        }
    };

    return (
        <div className="min-h-screen font-sans text-[#003553] bg-white overflow-x-hidden w-full">
            <Navbar />

            {/* ================= 1. HERO SECTION ================= */}
            <section id="home" className="pt-36 pb-20 lg:pt-48 lg:pb-32 bg-gradient-to-r from-[#003553] to-[#001e2e] relative overflow-hidden text-white">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#009CAA] rounded-full blur-[150px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>

                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">

                        {/* TEXT CONTENT */}
                        <div className="lg:w-1/2 space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#009CAA]/20 border border-[#009CAA] text-[#009CAA] font-bold text-sm uppercase tracking-wider">
                                <SafetyCertificateFilled /> Hệ thống y tế chuẩn Nhật Bản
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.15]">
                                Chăm Sóc Sức Khỏe <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009CAA] to-cyan-300">
                                    TOÀN DIỆN & TẬN TÂM
                                </span>
                            </h1>

                            <p className="text-lg text-gray-300 max-w-xl leading-relaxed">
                                Tự hào thương hiệu đến từ Nhật Bản. DYM mong muốn mang đến sự trải nghiệm tốt nhất cho quý khách hàng với quy trình khám linh hoạt và đội ngũ bác sĩ giàu kinh nghiệm.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <Button
                                    size="large"
                                    className="h-14 px-10 rounded-full text-base font-bold bg-[#009CAA] border-none text-white hover:!bg-white hover:!text-[#003553] shadow-lg shadow-cyan-900/50 transition-all transform hover:-translate-y-1"
                                    onClick={handleBookingClick} // Dùng hàm xử lý thông minh
                                >
                                    ĐẶT LỊCH KHÁM NGAY
                                </Button>
                                <Button
                                    size="large"
                                    className="h-14 px-10 rounded-full text-base font-bold bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#003553] transition-all"
                                >
                                    TÌM HIỂU THÊM
                                </Button>
                            </div>
                        </div>

                        {/* IMAGE CONTENT */}
                        <div className="lg:w-1/2 w-full relative">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[8px] border-white/10">
                                <img
                                    src="https://img.freepik.com/free-photo/group-doctors-looking-camera_23-2148142718.jpg?w=1060&t=st=1703000000~exp=1703000600~hmac=abcdef"
                                    alt="Medical Team"
                                    className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#003553]/80 to-transparent"></div>

                                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#009CAA] rounded-full flex items-center justify-center text-2xl">
                                            <CheckCircleFilled />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Được tin dùng bởi 15,000+</p>
                                            <p className="text-sm text-gray-300">Khách hàng mỗi năm</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= 2. STATS BAR ================= */}
            <section className="bg-[#009CAA] py-16 text-white relative z-20 -mt-10 mx-4 md:mx-12 lg:mx-20 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-x divide-white/30">
                    {[
                        { num: '30+', label: 'BÁC SĨ CHUYÊN KHOA' },
                        { num: '160,000', label: 'LƯỢT KHÁM MỖI NĂM' },
                        { num: '99%', label: 'KHÁCH HÀNG HÀI LÒNG' },
                        { num: '15+', label: 'NĂM KINH NGHIỆM' },
                    ].map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center px-4">
                            <h3 className="text-4xl lg:text-5xl font-extrabold mb-2 font-sans">{stat.num}</h3>
                            <p className="text-xs lg:text-sm font-bold opacity-90 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= 3. SERVICES ================= */}
            <section id="services" className="py-24 bg-gray-50">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                    <div className="text-center mb-16">
                        <h2 className="text-[#009CAA] font-extrabold tracking-widest uppercase text-sm mb-3">CHUYÊN KHOA</h2>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-[#003553] mb-6">
                            Danh sách chuyên khoa <br /> thuộc phòng khám Clinic
                        </h3>
                        <div className="h-1.5 w-24 bg-[#009CAA] mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'NỘI KHOA', icon: <MedicineBoxFilled />, desc: 'Chăm sóc sức khỏe tổng quát và phòng ngừa bệnh lý nội khoa.' },
                            { title: 'NHA KHOA', icon: <span className="text-3xl">🦷</span>, desc: 'Cung cấp các dịch vụ nha khoa toàn diện, thẩm mỹ.' },
                            { title: 'NGOẠI KHOA', icon: <span className="text-3xl">⚕️</span>, desc: 'Điều trị các bệnh lý từ đơn giản đến phức tạp của ngoại khoa.' },
                            { title: 'XÉT NGHIỆM', icon: <ExperimentFilled />, desc: 'Áp dụng công nghệ xét nghiệm hiện đại, đảm bảo chính xác.' },
                            { title: 'TAI MŨI HỌNG', icon: <span className="text-3xl">👂</span>, desc: 'Khám và điều trị các bệnh về Tai - Mũi - Họng.' },
                            { title: 'NHI KHOA', icon: <SmileFilled />, desc: 'Điều trị và tầm soát bệnh lý nhi khoa, giúp trẻ phát triển toàn diện.' },
                            { title: 'SẢN PHỤ KHOA', icon: <span className="text-3xl">🤰</span>, desc: 'Theo dõi thai kỳ, chăm sóc sức khỏe sinh sản phụ nữ.' },
                            { title: 'TIM MẠCH', icon: <HeartFilled />, desc: 'Tầm soát và điều trị các bệnh lý tim mạch chuyên sâu.' },
                        ].map((item, idx) => (
                            <Card
                                key={idx}
                                className="h-full border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer"
                                bodyStyle={{ padding: '2rem' }}
                            >
                                <div className="flex flex-col items-start h-full">
                                    <div className="w-14 h-14 bg-blue-50 text-[#003553] rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-[#009CAA] group-hover:text-white transition-colors duration-300">
                                        {item.icon}
                                    </div>
                                    <h4 className="text-xl font-extrabold text-[#003553] mb-3 group-hover:text-[#009CAA] transition-colors uppercase">{item.title}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow">{item.desc}</p>
                                    <div className="w-full h-1 bg-gray-100 group-hover:bg-[#009CAA] transition-all duration-500 rounded-full"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= 4. CTA SECTION ================= */}
            <section className="py-20 bg-[#003553] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                        Bạn cần tư vấn sức khỏe?
                    </h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                        Đừng ngần ngại liên hệ với chúng tôi hoặc đặt lịch hẹn trực tuyến để được thăm khám nhanh chóng nhất.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Button
                            size="large"
                            className="h-14 px-12 rounded-full bg-white text-[#003553] font-bold text-lg border-none hover:bg-gray-100 shadow-2xl hover:scale-105 transition-transform"
                            onClick={handleBookingClick}
                        >
                            Đăng ký khám ngay
                        </Button>
                        <Button
                            size="large"
                            className="h-14 px-12 rounded-full bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white/10"
                        >
                            Liên hệ: 1900 1234
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />

            {/* --- CÁC COMPONENT TOÀN CỤC --- */}
            <AuthModal />    {/* Modal Đăng nhập/Đăng ký */}
            <BookingModal /> {/* Modal Đặt lịch */}
            <ChatWidget />   {/* <--- ĐÃ THÊM LẠI LIVE CHAT */}
        </div>
    );
}