import React, { useState } from 'react';
import { Button, Row, Col, Card } from 'antd';
import {
    EnvironmentOutlined,
    PhoneOutlined,
    ClockCircleOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';

// --- DỮ LIỆU CÁC CƠ SỞ ---
// Bạn có thể thay thế link src iframe bằng địa chỉ thực tế của bạn
const facilities = [
    {
        id: 'hanoi',
        name: 'DYM Medical Center Hà Nội',
        tabLabel: 'HÀ NỘI',
        address: 'Tầng B1, Tòa nhà Epic Tower, Ngõ 19 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
        hotline: '1900 29 29 29',
        workingHours: 'Thứ 2 - Thứ 7: 08:00 - 17:00',
        // Link Google Maps Embed (Lấy từ Google Maps -> Share -> Embed a map)
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.924078635678!2d105.78369631540243!3d21.035723985994517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4ca6427383%3A0x6335a4d040733560!2sEpic%20Tower!5e0!3m2!1sen!2s!4v1647852345678!5m2!1sen!2s",
        images: [
            "https://img.freepik.com/free-photo/luxury-hospital-reception-waiting-room-interior_105762-2195.jpg",
            "https://img.freepik.com/free-photo/corridor-hospital_1170-1772.jpg",
            "https://img.freepik.com/free-photo/empty-bed-hospital-ward_1170-1662.jpg"
        ]
    },
    {
        id: 'saigon',
        name: 'DYM Medical Center Sài Gòn',
        tabLabel: 'SÀI GÒN',
        address: 'Phòng B103, Tầng hầm 1, Tòa nhà mPlaza Saigon, 39 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
        hotline: '1900 29 29 37',
        workingHours: 'Thứ 2 - Chủ Nhật: 07:30 - 20:00',
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424623788737!2d106.69864231533414!3d10.778751262096338!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x1787491df0ed8d6a!2smPlaza%20Saigon!5e0!3m2!1sen!2s!4v1647852345679!5m2!1sen!2s",
        images: [
            "https://img.freepik.com/free-photo/waiting-room-modern-hospital_1170-1845.jpg",
            "https://img.freepik.com/free-photo/doctor-s-office-with-medical-equipment_1170-1798.jpg",
            "https://img.freepik.com/free-photo/modern-operating-room_1170-1866.jpg"
        ]
    },
    {
        id: 'phumyhung',
        name: 'DYM Medical Center Phú Mỹ Hưng',
        tabLabel: 'PHÚ MỸ HƯNG',
        address: 'Phòng 3A01, Tầng 3A, Tòa nhà The Grace, 71 Hoàng Văn Thái, Phường Tân Phú, Quận 7, TP.HCM',
        hotline: '1900 29 29 38',
        workingHours: 'Thứ 2 - Thứ 7: 08:00 - 17:00',
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.026639659367!2d106.7186233153336!3d10.732432262933333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f845a702931%3A0x7030677270e5362!2sThe%20Grace%20Tower!5e0!3m2!1sen!2s!4v1647852345680!5m2!1sen!2s",
        images: [
            "https://img.freepik.com/free-photo/dentist-office-with-modern-equipment_1170-1888.jpg",
            "https://img.freepik.com/free-photo/blur-hospital_1203-7957.jpg",
            "https://img.freepik.com/free-photo/equipment-supplies-inside-ambulance_1170-1922.jpg"
        ]
    }
];

export default function FacilitiesPage() {
    const [activeTab, setActiveTab] = useState(facilities[0].id);

    // Lấy thông tin cơ sở đang chọn
    const currentFacility = facilities.find(f => f.id === activeTab) || facilities[0];

    return (
        <div className="min-h-screen font-sans bg-white overflow-x-hidden w-full">
            <Navbar />

            {/* 1. HERO BANNER */}
            <section className="pt-36 pb-16 bg-[#003553] text-white text-center">
                <div className="max-w-[1440px] mx-auto px-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 animate-fade-in-up">
                        Hệ thống Cơ sở & Vật chất
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Thiết kế theo phong cách Nhật Bản hiện đại, mang lại không gian ấm cúng,
                        tiện nghi và trải nghiệm khám chữa bệnh tốt nhất.
                    </p>
                </div>
            </section>

            {/* 2. TAB MENU (CHUYỂN ĐỔI KHU VỰC) */}
            <section className="sticky top-[90px] z-40 bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                    <div className="flex justify-center gap-8 md:gap-16 py-4 overflow-x-auto">
                        {facilities.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`
                                    text-lg font-bold uppercase tracking-wider pb-2 border-b-4 transition-all whitespace-nowrap
                                    ${activeTab === item.id
                                        ? 'text-[#009CAA] border-[#009CAA]'
                                        : 'text-gray-400 border-transparent hover:text-[#003553]'}
                                `}
                            >
                                {item.tabLabel}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. NỘI DUNG CHI TIẾT + BẢN ĐỒ */}
            <section className="py-16 bg-[#f8fbff]">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20 animate-fade-in-up">
                    <Row gutter={[48, 32]}>
                        {/* CỘT TRÁI: THÔNG TIN */}
                        <Col xs={24} lg={10}>
                            <div className="space-y-6">
                                <div>
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">CƠ SỞ</span>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553] mt-2">
                                        {currentFacility.name.replace(currentFacility.tabLabel, '')}
                                        <span className="text-[#009CAA]">{currentFacility.tabLabel}</span>
                                    </h2>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009CAA]">
                                            <EnvironmentOutlined className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#003553]">Địa chỉ:</p>
                                            <p className="text-gray-600 leading-relaxed">{currentFacility.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009CAA]">
                                            <PhoneOutlined className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#003553]">Hotline:</p>
                                            <p className="text-gray-600 font-bold text-lg">{currentFacility.hotline}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#009CAA]">
                                            <ClockCircleOutlined className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#003553]">Giờ làm việc:</p>
                                            <p className="text-gray-600">{currentFacility.workingHours}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<GlobalOutlined />}
                                        className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 px-8 rounded-full font-bold shadow-lg"
                                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentFacility.address)}`, '_blank')}
                                    >
                                        Xem chỉ đường trên Google Maps
                                    </Button>
                                </div>
                            </div>
                        </Col>

                        {/* CỘT PHẢI: BẢN ĐỒ (IFRAME) */}
                        <Col xs={24} lg={14}>
                            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[400px] bg-gray-200">
                                <iframe
                                    src={currentFacility.mapSrc}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* 4. HÌNH ẢNH PHÒNG KHÁM */}
            <section className="py-16 bg-white">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                    <h3 className="text-2xl font-bold text-[#003553] mb-8 uppercase tracking-wide border-l-4 border-[#009CAA] pl-4">
                        Hình ảnh phòng khám
                    </h3>
                    <Row gutter={[24, 24]}>
                        {currentFacility.images.map((img, idx) => (
                            <Col xs={24} md={8} key={idx}>
                                <div className="group rounded-2xl overflow-hidden shadow-md h-64 cursor-pointer">
                                    <img
                                        src={img}
                                        alt={`Facility ${idx}`}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </section>

            <Footer />
            <AuthModal />
            <BookingModal />
        </div>
    );
}