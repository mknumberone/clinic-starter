import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Row, Col, Spin } from 'antd';
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
import { branchesService } from '@/services/branches.service';
import { uploadService } from '@/services/upload.service';

// Ảnh mặc định khi chi nhánh không có ảnh
const DEFAULT_IMAGES = [
    'https://img.freepik.com/free-photo/luxury-hospital-reception-waiting-room-interior_105762-2195.jpg',
    'https://img.freepik.com/free-photo/corridor-hospital_1170-1772.jpg',
    'https://img.freepik.com/free-photo/empty-bed-hospital-ward_1170-1662.jpg'
];

/** Tạo Google Maps embed URL từ địa chỉ */
function getMapEmbedUrl(address: string): string {
    if (!address?.trim()) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export default function FacilitiesPage() {
    const { data: branches = [], isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getBranches,
    });

    const facilities = useMemo(() => {
        return branches
            .filter((b: any) => b.is_active !== false)
            .map((b: any) => {
                const tabLabel = b.name.startsWith('Cơ sở ')
                    ? b.name.slice(6).toUpperCase()
                    : b.name.toUpperCase();
                return {
                    id: b.id,
                    name: b.name,
                    tabLabel,
                    address: b.address || '',
                    hotline: b.phone || 'Liên hệ',
                    workingHours: 'Thứ 2 - Thứ 7: 08:00 - 17:00',
                    mapSrc: getMapEmbedUrl(b.address || ''),
                    images: b.image
                        ? [uploadService.getFileUrl(b.image), ...DEFAULT_IMAGES.slice(1)]
                        : DEFAULT_IMAGES,
                };
            });
    }, [branches]);

    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        if (facilities.length > 0 && activeTab === null) {
            setActiveTab(facilities[0].id);
        }
    }, [facilities, activeTab]);

    const currentFacility = facilities.find(f => f.id === (activeTab ?? facilities[0]?.id)) ?? facilities[0];

    if (isLoading) {
        return (
            <div className="min-h-screen font-sans bg-white">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <Spin size="large" tip="Đang tải thông tin cơ sở..." />
                </div>
                <Footer />
            </div>
        );
    }

    if (facilities.length === 0) {
        return (
            <div className="min-h-screen font-sans bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <p>Chưa có thông tin cơ sở phòng khám.</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-white overflow-x-hidden w-full">
            <Navbar />

            {/* 1. HERO BANNER - dính nav (mt=90px), padding 20px, chiều cao dài hơn */}
            <section
                style={{
                    marginBottom: '20px',
                    marginTop: '90px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    minHeight: '220px'
                }}
                className="bg-[#003553] text-white text-center flex flex-col items-center justify-center"
            >
                <div className="w-full flex flex-col items-center justify-center text-center px-6">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 animate-fade-in-up">
                        Hệ thống Cơ sở & Vật chất
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl text-center">
                        Thiết kế theo phong cách Nhật Bản hiện đại, mang lại không gian ấm cúng,
                        tiện nghi và trải nghiệm khám chữa bệnh tốt nhất.
                    </p>
                </div>
            </section>

            {/* 2. TAB MENU (CHUYỂN ĐỔI KHU VỰC) */}
            <section style={{ marginBottom: '20px' }} className="sticky top-[90px] z-40 bg-white shadow-sm border-b border-gray-100">
                <div className="landing-container">
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

            {/* 3. NỘI DUNG CHI TIẾT + BẢN ĐỒ - scroll-margin để không bị tab che */}
            <section
                id="facility-detail"
                style={{ marginBottom: '20px', paddingTop: '100px', scrollMarginTop: '190px' }}
                className="py-16 bg-[#f8fbff]"
            >
                <div className="landing-container animate-fade-in-up">
                    <Row gutter={[48, 32]} justify="center">
                        {/* CỘT TRÁI: THÔNG TIN */}
                        <Col xs={24} lg={10}>
                            <div className="space-y-6 text-center lg:text-left">
                                <div>
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">CƠ SỞ</span>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#003553] mt-2">
                                        {currentFacility.name.startsWith('Cơ sở ')
                                            ? <>Cơ sở <span className="text-[#009CAA]">{currentFacility.tabLabel}</span></>
                                            : currentFacility.name}
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

                                <div className="pt-6 flex justify-center lg:justify-start">
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<GlobalOutlined />}
                                        className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 px-8 rounded-lg font-bold shadow-lg"
                                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentFacility.address)}`, '_blank')}
                                    >
                                        Xem chỉ đường trên Google Maps
                                    </Button>
                                </div>
                            </div>
                        </Col>

                        {/* CỘT PHẢI: BẢN ĐỒ (IFRAME) */}
                        <Col xs={24} lg={14}>
                            <div className="rounded-lg overflow-hidden shadow-lg border border-slate-100 h-[400px] bg-gray-200">
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
            <section style={{ marginBottom: '20px' }} className="py-16 bg-white">
                <div className="landing-container">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-[#003553] uppercase tracking-wide inline-block border-b-2 border-[#009CAA] pb-2">
                            Hình ảnh phòng khám
                        </h3>
                    </div>
                    <Row gutter={[24, 24]} justify="center">
                        {currentFacility.images.map((img, idx) => (
                            <Col xs={24} md={8} key={idx}>
                                <div className="group rounded-lg overflow-hidden shadow-md h-64 cursor-pointer">
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