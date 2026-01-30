import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    Row,
    Col,
    Tag,
    Spin,
    Empty,
    Input,
    Typography,
    Divider,
    Tabs,

} from 'antd';
import {
    SearchOutlined,
    ClockCircleOutlined,
    StarFilled,
    MedicineBoxOutlined,
    ArrowLeftOutlined,
    CalendarOutlined,
    UserOutlined,
    GiftOutlined,
    CheckCircleOutlined,

    DollarOutlined
} from '@ant-design/icons';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import { appointmentService, Doctor, Specialty } from '@/services/appointment.service';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';

const { Title, Paragraph, Text } = Typography;

export default function SpecialtyDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { openRegister } = useAuthModalStore();
    const { openBooking } = useBookingModalStore();

    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('doctors');

    // Lấy chi tiết chuyên khoa
    const { data: specialty, isLoading: loadingSpecialty } = useQuery<Specialty>({
        queryKey: ['specialty-detail', id],
        queryFn: () => appointmentService.getSpecialtyById(id),
        enabled: !!id,
    });

    // Lấy danh sách bác sĩ
    const { data: doctors = [], isFetching: loadingDoctors } = useQuery<Doctor[]>({
        queryKey: ['doctors-by-specialty', id],
        queryFn: () => appointmentService.getDoctors(undefined, id),
        enabled: !!id,
    });

    // Lấy danh sách gói khám
    const { data: packages = [], isFetching: loadingPackages } = useQuery<any[]>({
        queryKey: ['examination-packages', id],
        queryFn: async () => {
            const res = await axiosInstance.get('/examination-packages', {
                params: { specialization_id: id }
            });
            return res.data || [];
        },
        enabled: !!id,
    });

    const filteredDoctors = doctors.filter((d) => {
        const name = d.user?.full_name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleBooking = () => {
        if (isAuthenticated) openBooking();
        else openRegister();
    };

    if (loadingSpecialty) {
        return (
            <div className="min-h-screen font-sans bg-[#f8fbff]">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <Spin size="large" />
                </div>
                <Footer />
            </div>
        );
    }

    if (!specialty) {
        return (
            <div className="min-h-screen font-sans bg-[#f8fbff]">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-96">
                    <Empty description="Không tìm thấy chuyên khoa" />
                    <Button onClick={() => navigate(-1)} className="mt-4">Quay lại</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-[#f8fbff] overflow-x-hidden w-full">
            <Navbar />

            {/* Hero Section với ảnh bìa */}
            <section className="relative mt-[90px] pt-24 pb-20 text-white overflow-hidden">
                {/* Background Image hoặc Gradient */}
                {specialty.image ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${specialty.image})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#003553]/95 via-[#003553]/90 to-[#003553]/80"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680]"></div>
                )}

                <div className="landing-container relative z-10">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        className="mb-6 text-white border-white hover:bg-white/20"
                    >
                        Quay lại
                    </Button>

                    <div className="flex items-center gap-4 mb-4">
                        {specialty.icon ? (
                            <img src={specialty.icon} alt={specialty.name} className="w-12 h-12 object-contain" />
                        ) : (
                            <MedicineBoxOutlined className="text-4xl text-cyan-300" />
                        )}
                        <span className="uppercase tracking-widest text-sm font-semibold text-cyan-300">
                            Chuyên khoa
                        </span>
                    </div>

                    <Title level={1} className="!text-white !mb-4 !text-4xl md:!text-6xl font-extrabold">
                        {specialty.name}
                    </Title>

                    {specialty.description && (
                        <Paragraph className="text-gray-200 text-lg max-w-3xl mb-6">
                            {specialty.description}
                        </Paragraph>
                    )}

                    <div className="flex flex-wrap gap-4">
                        <Button
                            type="primary"
                            size="large"
                            className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 px-8 font-bold shadow-lg"
                            onClick={handleBooking}
                            icon={<CalendarOutlined />}
                        >
                            ĐẶT LỊCH KHÁM NGAY
                        </Button>
                        <Button
                            size="large"
                            className="h-12 px-8 bg-white/10 hover:bg-white/20 border-white text-white"
                            onClick={() => {
                                document.getElementById('doctors-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Xem danh sách bác sĩ
                        </Button>
                    </div>
                </div>
            </section>

            {/* Nội dung chi tiết */}
            {specialty.content && (
                <section className="py-16 bg-white">
                    <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0">
                        <div
                            className="specialty-content"
                            dangerouslySetInnerHTML={{ __html: specialty.content }}
                            style={{
                                color: '#333',
                                lineHeight: '1.8',
                                fontSize: '16px',
                            }}
                        />
                        <style>{`
                            .specialty-content h1, .specialty-content h2, .specialty-content h3 {
                                color: #003553;
                                font-weight: bold;
                                margin-top: 2rem;
                                margin-bottom: 1rem;
                            }
                            .specialty-content h1 { font-size: 2rem; }
                            .specialty-content h2 { font-size: 1.75rem; }
                            .specialty-content h3 { font-size: 1.5rem; }
                            .specialty-content p {
                                margin-bottom: 1.5rem;
                                color: #555;
                            }
                            .specialty-content ul, .specialty-content ol {
                                margin-bottom: 1.5rem;
                                padding-left: 2rem;
                            }
                            .specialty-content li {
                                margin-bottom: 0.5rem;
                                color: #555;
                            }
                            .specialty-content img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                margin: 1.5rem 0;
                            }
                            .specialty-content a {
                                color: #009CAA;
                                text-decoration: underline;
                            }
                            .specialty-content a:hover {
                                color: #0086b3;
                            }
                            .specialty-content blockquote {
                                border-left: 4px solid #009CAA;
                                padding-left: 1.5rem;
                                margin: 1.5rem 0;
                                font-style: italic;
                                color: #666;
                            }
                        `}</style>
                    </div>
                </section>
            )}

            {/* Tabs: Bác sĩ và Gói khám */}
            <section id="doctors-section" className="py-16 bg-gradient-to-b from-white to-[#f8fbff]">
                <div className="landing-container">
                    <div className="text-center mb-12">
                        <Title level={2} className="!text-[#003553] !mb-4">
                            Các chuyên khoa và gói khám
                        </Title>
                        <Text className="text-gray-600 text-lg">
                            DYM cung cấp các dịch vụ y tế chuyên sâu với đội ngũ bác sĩ giàu kinh nghiệm
                        </Text>
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'doctors',
                                label: (
                                    <span className="text-base font-semibold">
                                        <UserOutlined className="mr-2" />
                                        Bác sĩ ({doctors.length})
                                    </span>
                                ),
                                children: (
                                    <>
                                        {/* Search Bar */}
                                        <div className="mb-8 max-w-md mx-auto">
                                            <Input
                                                size="large"
                                                placeholder="Tìm kiếm bác sĩ theo tên..."
                                                prefix={<SearchOutlined className="text-gray-400" />}
                                                className="rounded-full py-3 px-6 text-base shadow-md border-gray-200"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        {loadingDoctors ? (
                                            <div className="text-center py-20">
                                                <Spin size="large" />
                                            </div>
                                        ) : filteredDoctors.length === 0 ? (
                                            <Empty
                                                description={
                                                    <span>
                                                        {searchTerm ? 'Không tìm thấy bác sĩ phù hợp' : 'Chưa có bác sĩ trong chuyên khoa này'}
                                                    </span>
                                                }
                                            />
                                        ) : (
                                            <Row gutter={[24, 24]}>
                                                {filteredDoctors.map((doc) => (
                                                    <Col xs={24} sm={12} lg={8} xl={6} key={doc.id}>
                                                        <Card
                                                            hoverable
                                                            className="h-full rounded-2xl overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
                                                            bodyStyle={{ padding: 0 }}
                                                            cover={
                                                                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#009CAA] to-[#006680]">
                                                                    <img
                                                                        alt={doc.user?.full_name}
                                                                        src={doc.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.user?.full_name || 'Bac Si')}`}
                                                                        className="w-full h-full object-cover object-center"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doc.user?.full_name || 'Bac Si')}`;
                                                                        }}
                                                                    />
                                                                    <div className="absolute top-4 right-4">
                                                                        <Tag color="#009CAA" className="border-none font-bold shadow-md px-3 py-1">
                                                                            {specialty.name}
                                                                        </Tag>
                                                                    </div>
                                                                </div>
                                                            }
                                                        >
                                                            <div className="p-6 flex flex-col h-full">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <UserOutlined className="text-[#009CAA] text-lg" />
                                                                    <Title level={4} className="!mb-0 !text-[#003553] line-clamp-1">
                                                                        {doc.user?.full_name || 'Bác sĩ'}
                                                                    </Title>
                                                                </div>

                                                                {doc.title && (
                                                                    <Text className="text-gray-600 mb-4 block">{doc.title}</Text>
                                                                )}

                                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                                                                    {doc.average_time && (
                                                                        <div className="flex items-center gap-1">
                                                                            <ClockCircleOutlined className="text-[#009CAA]" />
                                                                            <span>{doc.average_time} phút/ca</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1">
                                                                        <StarFilled className="text-yellow-400" />
                                                                        <span>4.9 (50+)</span>
                                                                    </div>
                                                                </div>

                                                                {doc.biography && (
                                                                    <Paragraph
                                                                        className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow"
                                                                        ellipsis={{ rows: 2 }}
                                                                    >
                                                                        {doc.biography}
                                                                    </Paragraph>
                                                                )}

                                                                <Button
                                                                    type="primary"
                                                                    block
                                                                    className="bg-[#009CAA] hover:!bg-[#0086b3] font-bold h-11 rounded-lg shadow-md border-none mt-auto"
                                                                    onClick={handleBooking}
                                                                    icon={<CalendarOutlined />}
                                                                >
                                                                    ĐẶT LỊCH KHÁM
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: 'packages',
                                label: (
                                    <span className="text-base font-semibold">
                                        <GiftOutlined className="mr-2" />
                                        Gói khám ({packages.length})
                                    </span>
                                ),
                                children: (
                                    <>
                                        {loadingPackages ? (
                                            <div className="text-center py-20">
                                                <Spin size="large" />
                                            </div>
                                        ) : packages.length === 0 ? (
                                            <Empty description="Chưa có gói khám nào cho chuyên khoa này" />
                                        ) : (
                                            <Row gutter={[24, 24]}>
                                                {packages.map((pkg: any) => (
                                                    <Col xs={24} sm={12} lg={8} key={pkg.id}>
                                                        <Card
                                                            hoverable
                                                            className="h-full rounded-2xl overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
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
                                                        >
                                                            <div className="p-6 flex flex-col h-full">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <Title level={4} className="!mb-0 !text-[#003553] line-clamp-2 flex-1">
                                                                        {pkg.name}
                                                                    </Title>
                                                                    {pkg.is_featured && (
                                                                        <Tag color="gold" className="ml-2">
                                                                            Nổi bật
                                                                        </Tag>
                                                                    )}
                                                                </div>

                                                                {pkg.description && (
                                                                    <Paragraph
                                                                        className="text-gray-600 mb-4 line-clamp-3 flex-grow"
                                                                        ellipsis={{ rows: 3 }}
                                                                    >
                                                                        {pkg.description}
                                                                    </Paragraph>
                                                                )}

                                                                {pkg.services && Array.isArray(pkg.services) && pkg.services.length > 0 && (
                                                                    <div className="mb-4">
                                                                        <Text strong className="text-[#003553] block mb-2">Dịch vụ bao gồm:</Text>
                                                                        <ul className="list-none p-0 m-0 space-y-1">
                                                                            {pkg.services.slice(0, 3).map((service: string, idx: number) => (
                                                                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                                                    <CheckCircleOutlined className="text-[#009CAA]" />
                                                                                    <span>{service}</span>
                                                                                </li>
                                                                            ))}
                                                                            {pkg.services.length > 3 && (
                                                                                <li className="text-sm text-[#009CAA] font-semibold">
                                                                                    +{pkg.services.length - 3} dịch vụ khác
                                                                                </li>
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                )}

                                                                <Divider className="my-4" />

                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div>
                                                                        <Text className="text-2xl font-bold text-[#009CAA]">
                                                                            {new Intl.NumberFormat('vi-VN').format(Number(pkg.price))} đ
                                                                        </Text>
                                                                        {pkg.original_price && Number(pkg.original_price) > Number(pkg.price) && (
                                                                            <div>
                                                                                <Text delete className="text-gray-400 text-sm">
                                                                                    {new Intl.NumberFormat('vi-VN').format(Number(pkg.original_price))} đ
                                                                                </Text>
                                                                                <Tag color="red" className="ml-2">
                                                                                    Giảm {Math.round((1 - Number(pkg.price) / Number(pkg.original_price)) * 100)}%
                                                                                </Tag>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {pkg.duration && (
                                                                        <div className="flex items-center gap-1 text-gray-600">
                                                                            <ClockCircleOutlined />
                                                                            <span>{pkg.duration} phút</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <Button
                                                                    type="primary"
                                                                    block
                                                                    className="bg-[#009CAA] hover:!bg-[#0086b3] font-bold h-11 rounded-lg shadow-md border-none"
                                                                    onClick={handleBooking}
                                                                    icon={<CalendarOutlined />}
                                                                >
                                                                    ĐẶT LỊCH KHÁM
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </>
                                ),
                            },
                        ]}
                        size="large"
                        className="custom-tabs"
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-[#003553] to-[#006680] text-white">
                <div className="max-w-[1200px] mx-auto px-4 md:px-12 lg:px-20 text-center">
                    <Title level={2} className="!text-white !mb-4">
                        Sẵn sàng đặt lịch khám?
                    </Title>
                    <Paragraph className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
                        Đặt lịch khám ngay hôm nay để được tư vấn và điều trị bởi đội ngũ bác sĩ chuyên nghiệp
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        className="bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 px-10 font-bold shadow-lg"
                        onClick={handleBooking}
                        icon={<CalendarOutlined />}
                    >
                        ĐẶT LỊCH KHÁM NGAY
                    </Button>
                </div>
            </section>

            <Footer />
            <AuthModal />
            <BookingModal />
        </div>
    );
}
