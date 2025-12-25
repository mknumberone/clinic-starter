import React from 'react';
import { Button, Card, Row, Col, Timeline } from 'antd';
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
            <section className="pt-36 pb-20 bg-gradient-to-r from-[#003553] to-[#001e2e] text-white relative overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-fade-in-up">
                        Về DYM Medical Center
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Hệ thống phòng khám đa khoa chuẩn Nhật Bản hàng đầu tại Việt Nam.
                        Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe toàn diện, tận tâm và chất lượng nhất.
                    </p>
                </div>
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#009CAA] rounded-full blur-[120px] opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
            </section>

            {/* 2. CÂU CHUYỆN & GIỚI THIỆU */}
            <section className="py-20 bg-white">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <img
                                src="https://img.freepik.com/free-photo/doctors-checking-reports_1098-132.jpg"
                                alt="Clinic Interior"
                                className="rounded-3xl shadow-2xl w-full object-cover h-[500px]"
                            />
                        </div>
                        <div className="lg:w-1/2 space-y-6">
                            <h2 className="text-[#009CAA] font-bold tracking-widest uppercase text-sm">CÂU CHUYỆN CỦA CHÚNG TÔI</h2>
                            <h3 className="text-4xl font-extrabold text-[#003553]">Hành trình chăm sóc sức khỏe Việt</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Được thành lập từ năm 2010, DYM Medical Center bắt đầu với sứ mệnh đơn giản:
                                Mang tiêu chuẩn y tế khắt khe của Nhật Bản đến gần hơn với người dân Việt Nam.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Trải qua hơn 1 thập kỷ phát triển, chúng tôi tự hào là địa chỉ tin cậy của hơn
                                <span className="font-bold text-[#009CAA]"> 150,000 khách hàng</span> mỗi năm,
                                với hệ thống trang thiết bị hiện đại và đội ngũ y bác sĩ đầu ngành.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div className="flex items-center gap-3">
                                    <SafetyCertificateFilled className="text-3xl text-[#009CAA]" />
                                    <div>
                                        <h4 className="font-bold text-lg">Chuẩn Nhật Bản</h4>
                                        <p className="text-sm text-gray-500">Quy trình khắt khe</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <TrophyFilled className="text-3xl text-[#009CAA]" />
                                    <div>
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
            <section className="py-20 bg-[#f0f8ff]">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20 text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553] mb-12">Tầm Nhìn & Sứ Mệnh</h2>
                    <Row gutter={[32, 32]}>
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <StarFilled className="text-3xl text-[#009CAA]" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Tầm Nhìn</h3>
                                <p className="text-gray-600">
                                    Trở thành hệ thống y tế tư nhân hàng đầu Việt Nam, là biểu tượng của niềm tin và chất lượng trong lĩnh vực chăm sóc sức khỏe.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <HeartFilled className="text-3xl text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Sứ Mệnh</h3>
                                <p className="text-gray-600">
                                    Chăm sóc sức khỏe toàn diện cho cộng đồng bằng y đức, trí tuệ và công nghệ hiện đại nhất.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card className="h-full border-none shadow-lg hover:-translate-y-2 transition-all duration-300">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircleFilled className="text-3xl text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#003553]">Giá Trị Cốt Lõi</h3>
                                <p className="text-gray-600">
                                    Tận tâm - Chuyên nghiệp - Hiệu quả - Đổi mới - Hợp tác. Khách hàng là trung tâm của mọi hoạt động.
                                </p>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* 4. LỊCH SỬ HÌNH THÀNH (TIMELINE) */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553] mb-12 text-center">Chặng Đường Phát Triển</h2>
                    <Timeline
                        mode="alternate"
                        items={[
                            {
                                children: (
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold text-[#009CAA]">2010</h4>
                                        <p>Thành lập phòng khám đầu tiên tại Hà Nội.</p>
                                    </div>
                                ),
                                color: '#009CAA',
                            },
                            {
                                children: (
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold text-[#009CAA]">2015</h4>
                                        <p>Mở rộng cơ sở 2 tại TP. Hồ Chí Minh, đạt chứng nhận ISO 9001.</p>
                                    </div>
                                ),
                                color: '#009CAA',
                            },
                            {
                                children: (
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold text-[#009CAA]">2018</h4>
                                        <p>Hợp tác chiến lược với Tập đoàn Y tế Nhật Bản.</p>
                                    </div>
                                ),
                                color: '#009CAA',
                            },
                            {
                                children: (
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold text-[#009CAA]">2023</h4>
                                        <p>Phục vụ khách hàng thứ 1 triệu, ra mắt ứng dụng đặt lịch thông minh.</p>
                                    </div>
                                ),
                                color: 'green',
                            },
                        ]}
                    />
                </div>
            </section>

            {/* 5. CTA BUTTON */}
            <section className="py-16 bg-[#003553] text-white text-center">
                <h2 className="text-3xl font-bold mb-6">Trải nghiệm dịch vụ y tế đẳng cấp ngay hôm nay</h2>
                <Button
                    size="large"
                    className="h-14 px-12 rounded-full bg-white text-[#003553] font-bold text-lg border-none hover:bg-gray-100 shadow-2xl hover:scale-105 transition-transform"
                    onClick={handleBookingClick}
                >
                    ĐẶT LỊCH KHÁM NGAY
                </Button>
            </section>

            <Footer />

            {/* MODALS */}
            <AuthModal />
            <BookingModal />
        </div>
    );
}