import React, { useState } from 'react';
import { Button, Input, Tabs, Card, Row, Col, Tag, Badge } from 'antd';
import {
    SearchOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    ClockCircleOutlined,
    StarFilled
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';

// --- MOCK DATA: DANH SÁCH BÁC SĨ ---
const doctorsData = [
    {
        id: '1',
        name: 'PGS.TS.BS Nguyễn Văn A',
        specialty: 'Tim mạch',
        specialtyGroup: 'noi-khoa',
        experience: '25 năm',
        hospital: 'Nguyên Trưởng khoa Tim mạch BV Bạch Mai',
        image: 'https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg',
        tags: ['Tim mạch can thiệp', 'Huyết áp'],
        bookingCount: 1500
    },
    {
        id: '2',
        name: 'ThS.BS Trần Thị B',
        specialty: 'Nhi khoa',
        specialtyGroup: 'nhi-khoa',
        experience: '15 năm',
        hospital: 'Bác sĩ nội trú BV Nhi Trung Ương',
        image: 'https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg',
        tags: ['Nhi tổng quát', 'Dinh dưỡng'],
        bookingCount: 890
    },
    {
        id: '3',
        name: 'BS.CKII Lê Văn C',
        specialty: 'Tai Mũi Họng',
        specialtyGroup: 'tai-mui-hong',
        experience: '20 năm',
        hospital: 'Trưởng khoa TMH - BV Đại học Y',
        image: 'https://img.freepik.com/free-photo/smiling-doctor-with-strethoscope-isolated-grey_651396-974.jpg',
        tags: ['Nội soi', 'Phẫu thuật'],
        bookingCount: 2100
    },
    {
        id: '4',
        name: 'TS.BS Phạm Thị D',
        specialty: 'Sản Phụ Khoa',
        specialtyGroup: 'san-phu-khoa',
        experience: '18 năm',
        hospital: 'BV Phụ Sản Hà Nội',
        image: 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg',
        tags: ['Thai sản', 'Phụ khoa'],
        bookingCount: 1200
    },
    {
        id: '5',
        name: 'ThS.BS Hoàng Minh E',
        specialty: 'Da liễu',
        specialtyGroup: 'da-lieu',
        experience: '10 năm',
        hospital: 'BV Da liễu Trung Ương',
        image: 'https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg',
        tags: ['Thẩm mỹ da', 'Laser'],
        bookingCount: 950
    },
    {
        id: '6',
        name: 'BS.CKI Nguyễn Thu F',
        specialty: 'Nội tổng quát',
        specialtyGroup: 'noi-khoa',
        experience: '12 năm',
        hospital: 'DYM Medical Center',
        image: 'https://img.freepik.com/free-photo/nurse-portrait-isolated-smiling-at-camera_171337-6060.jpg',
        tags: ['Khám sức khỏe', 'Tầm soát'],
        bookingCount: 3000
    }
];

export default function DoctorsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();
    const { isAuthenticated } = useAuthStore();

    // Xử lý đặt lịch
    const handleBooking = () => {
        if (isAuthenticated) openBooking();
        else openRegister();
    };

    // Lọc danh sách bác sĩ
    const filteredDoctors = doctorsData.filter(doctor => {
        const matchSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTab = activeTab === 'all' || doctor.specialtyGroup === activeTab;
        return matchSearch && matchTab;
    });

    const items = [
        { key: 'all', label: 'Tất cả' },
        { key: 'noi-khoa', label: 'Nội khoa' },
        { key: 'nhi-khoa', label: 'Nhi khoa' },
        { key: 'san-phu-khoa', label: 'Sản phụ khoa' },
        { key: 'tai-mui-hong', label: 'Tai Mũi Họng' },
        { key: 'da-lieu', label: 'Da liễu' },
    ];

    return (
        <div className="min-h-screen font-sans bg-[#f8fbff] overflow-x-hidden w-full">
            <Navbar />

            {/* 1. HERO BANNER */}
            <section className="pt-36 pb-20 bg-[#003553] text-white text-center relative overflow-hidden">
                <div className="max-w-[1440px] mx-auto px-4 relative z-10">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 animate-fade-in-up">
                        Đội ngũ Chuyên gia & Bác sĩ
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                        Quy tụ đội ngũ y bác sĩ đầu ngành, giàu kinh nghiệm, tận tâm với nghề.
                        Chúng tôi cam kết mang lại chất lượng khám chữa bệnh tốt nhất.
                    </p>

                    {/* Search Box */}
                    <div className="max-w-xl mx-auto relative">
                        <Input
                            size="large"
                            placeholder="Tìm kiếm bác sĩ, chuyên khoa..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            className="rounded-full py-3 px-6 text-base shadow-lg border-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {/* Decor */}
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#009CAA] rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute top-20 -left-20 w-72 h-72 bg-[#009CAA] rounded-full blur-[80px] opacity-20"></div>
            </section>

            {/* 2. MAIN CONTENT */}
            <section className="py-12 max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">

                {/* Tabs Filter */}
                <div className="flex justify-center mb-12">
                    <Tabs
                        defaultActiveKey="all"
                        items={items}
                        onChange={setActiveTab}
                        size="large"
                        type="card"
                        className="custom-tabs"
                    />
                </div>

                {/* Doctor Grid */}
                {filteredDoctors.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {filteredDoctors.map((doc) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={doc.id}>
                                <Card
                                    hoverable
                                    className="h-full rounded-2xl overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300"
                                    bodyStyle={{ padding: 0 }}
                                    cover={
                                        <div className="relative h-64 overflow-hidden bg-gray-100 group">
                                            <img
                                                alt={doc.name}
                                                src={doc.image}
                                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#003553] to-transparent h-20 opacity-80"></div>
                                            <div className="absolute bottom-3 left-4">
                                                <Tag color="#009CAA" className="border-none font-bold shadow-sm">{doc.specialty}</Tag>
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className="p-5 flex flex-col h-full">
                                        <h3 className="text-lg font-bold text-[#003553] mb-1 line-clamp-1">{doc.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3 h-8 line-clamp-2">{doc.hospital}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-1">
                                                <ClockCircleOutlined className="text-[#009CAA]" />
                                                <span>{doc.experience} KN</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <StarFilled className="text-yellow-400" />
                                                <span>4.9 (50+)</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {doc.tags.map(tag => (
                                                    <span key={tag} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <Button
                                                type="primary"
                                                block
                                                className="bg-[#009CAA] hover:!bg-[#0086b3] font-bold h-10 rounded-lg shadow-md border-none"
                                                onClick={handleBooking}
                                            >
                                                ĐẶT LỊCH KHÁM
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-20">
                        <UserOutlined className="text-6xl text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">Không tìm thấy bác sĩ phù hợp.</p>
                    </div>
                )}
            </section>

            <Footer />
            <AuthModal />
            <BookingModal />
        </div>
    );
}