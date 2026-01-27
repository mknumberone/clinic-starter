import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, Card, Tag, Spin, Empty, Row, Col, Button } from 'antd';
import { HomeOutlined, GiftOutlined, ScheduleOutlined } from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import axiosInstance from '@/lib/axios';
import { useBookingModalStore } from '@/stores/bookingModalStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';

interface ExamPackage {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    content?: string; // HTML detail
    thumbnail?: string;
    category?: string;
    prices?: Array<{ name: string; amount: number; unit?: string }>; // optional
}

export default function PackageDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const { isAuthenticated } = useAuthStore();
    const { openBooking } = useBookingModalStore();
    const { openRegister } = useAuthModalStore();

    const { data: pkg, isFetching } = useQuery<ExamPackage | null>({
        queryKey: ['examination-package', id],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get(`/examination-packages/${id}`);
                const data = res.data?.data || res.data;
                return data || null;
            } catch (e) {
                return null;
            }
        },
        enabled: !!id,
    });

    const handleBooking = () => {
        if (isAuthenticated) openBooking();
        else openRegister();
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <section className="pt-32 pb-6 bg-[#003553] text-white">
                <div className="landing-container">
                    <Breadcrumb
                        items={[
                            { title: <a href="/"><HomeOutlined /> Trang chủ</a> },
                            { title: <a href="/packages"><GiftOutlined /> Gói khám</a> },
                            { title: pkg?.name || 'Chi tiết gói' },
                        ]}
                        className="mb-3 text-white/80"
                    />
                    <h1 className="text-3xl md:text-5xl font-extrabold">{pkg?.name || 'Gói khám'}</h1>
                    {pkg?.category && <Tag className="mt-3" color="#009CAA">{pkg.category}</Tag>}
                </div>
            </section>

            <section className="py-12 landing-container">
                {isFetching ? (
                    <div className="text-center py-24"><Spin size="large" /></div>
                ) : !pkg ? (
                    <Empty description="Không tìm thấy gói khám" />
                ) : (
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <Card className="mb-6">
                                {pkg.thumbnail && (
                                    <div className="mb-4 h-72 overflow-hidden rounded-lg bg-gray-100">
                                        <img src={pkg.thumbnail} alt={pkg.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="prose max-w-none">
                                    {pkg.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: pkg.content }} />
                                    ) : (
                                        <p className="text-gray-700 leading-relaxed">{pkg.description || 'Thông tin gói khám đang được cập nhật.'}</p>
                                    )}
                                </div>
                            </Card>

                            {Array.isArray(pkg.prices) && pkg.prices.length > 0 && (
                                <Card>
                                    <h3 className="text-xl font-bold text-[#003553] mb-4">Chi phí tham khảo</h3>
                                    <Row gutter={[16, 16]}>
                                        {pkg.prices.map((p, idx) => (
                                            <Col xs={24} sm={12} key={idx}>
                                                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100">
                                                    <div className="text-cyan-700 text-sm mb-1">{p.name}</div>
                                                    <div className="text-2xl font-extrabold text-[#003553]">
                                                        {p.amount.toLocaleString('vi-VN')} {p.unit || 'VNĐ'}
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card>
                            )}
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card>
                                <h3 className="text-lg font-bold text-[#003553] mb-3">Đặt lịch khám</h3>
                                <p className="text-gray-600 mb-4">Đặt lịch nhanh để được tư vấn chi tiết về gói khám phù hợp.</p>
                                <Button type="primary" icon={<ScheduleOutlined />} className="bg-[#009CAA] border-none" onClick={handleBooking}>
                                    ĐẶT LỊCH NGAY
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                )}
            </section>

            <Footer />
            <AuthModal />
            <BookingModal />
        </div>
    );
}
