import React from 'react';
import { Button, Card, Row, Col } from 'antd';
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    StarFilled,
    TrophyFilled,
    HeartFilled
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';

export default function AboutPage() {
    // Logic mở modal đặt lịch/đăng ký giống Landing Page
    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();
    const { isAuthenticated } = useAuthStore();

    const handleBookingClick = () => {
        if (isAuthenticated) openBooking();
        else openRegister();
    };

    return (
        <div className="min-h-screen font-sans text-[#003553] bg-white overflow-x-hidden w-full">
            <Navbar />

            {/* 1. HERO BANNER */}
            <section style={{ marginBottom: '20px' }} className="mt-[90px] pt-24 pb-20 bg-gradient-to-r from-[#003553] to-[#001e2e] text-white relative overflow-hidden">
                <div className="landing-container relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-fade-in-up">
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        CLINIC
                    </p>
                </div>
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#009CAA] rounded-full blur-[120px] opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
            </section>

            {/* 2. CÂU CHUYỆN & GIỚI THIỆU */}
            <section style={{ marginBottom: '20px' }} className="py-16 bg-white">
                <div className="landing-container">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-16 max-w-6xl mx-auto">
                        <div className="lg:w-1/2 w-full flex justify-center">
                            <img
                                src="https://img.freepik.com/free-photo/doctors-checking-reports_1098-132.jpg"
                                alt="Clinic Interior"
                                className="rounded-lg shadow-xl w-full max-w-lg object-cover h-[500px]"
                            />
                        </div>
                        <div className="lg:w-1/2 w-full space-y-6 text-center">
                            <h2 className="text-[#009CAA] font-bold tracking-widest uppercase text-sm">CÂU CHUYỆN CỦA CHÚNG TÔI</h2>
                            <h3 className="text-4xl font-extrabold text-[#003553]">Hành trình chăm sóc sức khỏe Việt</h3>
                            <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
                                Được thành lập từ năm 2010, DYM Medical Center bắt đầu với sứ mệnh đơn giản:
                                Mang tiêu chuẩn y tế khắt khe của Nhật Bản đến gần hơn với người dân Việt Nam.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
                                Trải qua hơn 1 thập kỷ phát triển, chúng tôi tự hào là địa chỉ tin cậy của hơn
                                <span className="font-bold text-[#009CAA]"> 150,000 khách hàng</span> mỗi năm,
                                với hệ thống trang thiết bị hiện đại và đội ngũ y bác sĩ đầu ngành.
                            </p>

                            <div className="flex flex-wrap justify-center gap-8 mt-8">
                                <div className="flex items-center gap-3">
                                    <SafetyCertificateFilled className="text-3xl text-[#009CAA]" />
                                    <div className="text-left">
                                        <h4 className="font-bold text-lg">Chuẩn Nhật Bản</h4>
                                        <p className="text-sm text-gray-500">Quy trình khắt khe</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <TrophyFilled className="text-3xl text-[#009CAA]" />
                                    <div className="text-left">
                                        <h4 className="font-bold text-lg">Top 10 Uy Tín</h4>
                                        <p className="text-sm text-gray-500">Giải thưởng Y tế 2023</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. TẦM NHÌN & SỨ MỆNH */}
            <section style={{ marginBottom: '20px' }} className="py-16 bg-[#f0f8ff]">
                <div className="landing-container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553]">Tầm Nhìn & Sứ Mệnh</h2>
                    </div>
                    <Row gutter={[32, 32]} justify="center">
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300 text-center rounded-lg">
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                                    <StarFilled className="text-3xl text-[#009CAA]" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Tầm Nhìn</h3>
                                <p className="text-gray-600 text-center">
                                    Trở thành hệ thống y tế tư nhân hàng đầu Việt Nam, là biểu tượng của niềm tin và chất lượng trong lĩnh vực chăm sóc sức khỏe.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300 text-center rounded-lg">
                                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                                    <HeartFilled className="text-3xl text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Sứ Mệnh</h3>
                                <p className="text-gray-600 text-center">
                                    Chăm sóc sức khỏe toàn diện cho cộng đồng bằng y đức, trí tuệ và công nghệ hiện đại nhất.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300 text-center rounded-lg">
                                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                                    <CheckCircleFilled className="text-3xl text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Giá Trị Cốt Lõi</h3>
                                <p className="text-gray-600 text-center">
                                    Tận tâm - Chuyên nghiệp - Hiệu quả - Đổi mới - Hợp tác. Khách hàng là trung tâm của mọi hoạt động.
                                </p>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* 4. LỊCH SỬ HÌNH THÀNH (TIMELINE) */}
            <section style={{ marginBottom: '20px' }} className="py-16 bg-white">
                <div className="landing-container flex flex-col items-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553] mb-12 text-center w-full">Chặng Đường Phát Triển</h2>
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl">
                        {[
                            { year: '2010', text: 'Thành lập phòng khám đầu tiên tại Hà Nội.', color: '#009CAA' },
                            { year: '2015', text: 'Mở rộng cơ sở 2 tại TP. Hồ Chí Minh, đạt chứng nhận ISO 9001.', color: '#009CAA' },
                            { year: '2018', text: 'Hợp tác chiến lược với Tập đoàn Y tế Nhật Bản.', color: '#009CAA' },
                            { year: '2023', text: 'Phục vụ khách hàng thứ 1 triệu, ra mắt ứng dụng đặt lịch thông minh.', color: '#22c55e' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center text-center w-full pb-10 last:pb-0">
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0 mb-4"
                                    style={{ backgroundColor: item.color }}
                                />
                                <h4 className="text-xl font-bold text-[#009CAA] mb-2 w-full">{item.year}</h4>
                                <p className="text-gray-600 max-w-xl mx-auto w-full">{item.text}</p>
                                {idx < 3 && (
                                    <div className="w-0.5 h-8 bg-slate-200 my-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. CTA BUTTON - dính sát footer, padding 20px, chiều cao dài hơn */}
            <section style={{ marginBottom: 0, paddingTop: '20px', paddingBottom: '20px' }} className="bg-[#003553] text-white text-center min-h-[200px] flex flex-col items-center justify-center">
                <div className="landing-container">
                    <h2 className="text-3xl font-bold mb-6">Trải nghiệm dịch vụ y tế đẳng cấp ngay hôm nay</h2>
                    <Button
                        size="large"
                        className="h-14 px-12 rounded-lg bg-white text-[#003553] font-bold text-lg border-none hover:bg-gray-100 shadow-2xl hover:scale-105 transition-transform"
                        onClick={handleBookingClick}
                    >
                        ĐẶT LỊCH KHÁM NGAY
                    </Button>
                </div>
            </section>

            <Footer />

            {/* MODALS */}
            <AuthModal />
            <BookingModal />
        </div>
    );
}