import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Input, Tabs, Row, Col, Empty, Spin, Button } from 'antd';
import { SearchOutlined, GiftOutlined } from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import axiosInstance from '@/lib/axios';

interface ExamPackage {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    thumbnail?: string;
    category?: string; // e.g., 'Sức khỏe', 'Theo yêu cầu', 'Chuyên khoa', etc.
    is_featured?: boolean;
}

export default function PackagesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<string>('all');

    const { data: allPackages = [], isFetching } = useQuery<ExamPackage[]>({
        queryKey: ['examination-packages-all'],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get('/examination-packages');
                // backend có thể trả về mảng trực tiếp hoặc {data: []}
                const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
                return data;
            } catch (e) {
                return [];
            }
        }
    });

    const categories: string[] = useMemo(() => {
        const set = new Set<string>();
        (allPackages || []).forEach((p) => p.category && set.add(p.category));
        return ['all', ...Array.from(set)];
    }, [allPackages]);

    const filtered = useMemo(() => {
        return (allPackages || []).filter((p) => {
            const matchesSearch = `${p.name} ${p.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'all' || (p.category || '') === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [allPackages, searchTerm, activeTab]);

    return (
        <div className="min-h-screen font-sans bg-white">
            <Navbar />

            {/* HERO */}
            <section className="mt-[90px] pt-24 pb-10 bg-gradient-to-br from-[#003553] via-[#004d73] to-[#006994] text-white">
                <div className="landing-container">
                    <div className="flex items-center gap-3 text-cyan-300 mb-3">
                        <GiftOutlined />
                        <span className="uppercase tracking-widest text-sm font-semibold">Gói khám</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold">Các gói khám theo nhu cầu</h1>
                    <p className="text-white/80 max-w-3xl mt-3">Danh mục gói khám đa dạng, phù hợp nhiều mục đích: tổng quát, theo yêu cầu, chuyên khoa...</p>

                    <div className="mt-6 max-w-xl">
                        <Input
                            size="large"
                            prefix={<SearchOutlined className="text-gray-300" />}
                            placeholder="Tìm gói khám theo tên, mô tả..."
                            className="rounded-full py-3 px-6 border-none shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-14 landing-container">
                <div className="mb-8">
                    <Tabs
                        items={categories.map((c) => ({ key: c, label: c === 'all' ? 'Tất cả' : c }))}
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key)}
                        size="large"
                        type="line"
                    />
                </div>

                {isFetching ? (
                    <div className="text-center py-16"><Spin size="large" /></div>
                ) : filtered.length === 0 ? (
                    <Empty description="Chưa có gói khám phù hợp" />
                ) : (
                    <Row gutter={[24, 24]}>
                        {filtered.map((pkg) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={pkg.id}>
                                <Card
                                    hoverable
                                    className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all"
                                    cover={
                                        <div className="h-48 bg-gray-100 overflow-hidden">
                                            <img
                                                src={pkg.thumbnail || 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1200&auto=format&fit=crop'}
                                                alt={pkg.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    }
                                >
                                    <div className="flex flex-col h-full">
                                        {pkg.category && <Tag color="#009CAA" className="self-start mb-3 border-none">{pkg.category}</Tag>}
                                        <h3 className="font-bold text-[#003553] text-lg mb-2 line-clamp-2">{pkg.name}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{pkg.description || 'Gói khám tổng quát, nội dung chi tiết xem trong trang gói.'}</p>
                                        <Button
                                            type="primary"
                                            className="mt-auto bg-[#009CAA] hover:!bg-[#0086b3] border-none font-bold"
                                            onClick={() => navigate(`/packages/${pkg.id}`)}
                                        >
                                            XEM CHI TIẾT
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </section>

            <Footer />
            <AuthModal />
            <BookingModal />
        </div>
    );
}
