import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/news.service';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Tag,
    Empty,
    Input,
    Pagination,
    Divider,
    Spin,
} from 'antd';
import {
    SearchOutlined,
    CalendarOutlined,
    UserOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Paragraph } = Typography;

export default function NewsPage() {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Fetch chi tiết bài viết theo slug
    const { data: selectedArticle, isLoading: loadingDetail } = useQuery({
        queryKey: ['news', 'slug', slug],
        queryFn: () => newsService.getNewsBySlug(slug!),
        enabled: !!slug,
    });

    // Fetch danh sách bài viết (chỉ lấy bài đã xuất bản)
    const { data: newsData, isLoading: loadingList } = useQuery({
        queryKey: ['news', 'list', currentPage, searchTerm],
        queryFn: () =>
            newsService.getAllNews({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
                is_published: true, // Chỉ lấy bài đã xuất bản
            }),
    });

    // Nếu có slug, hiển thị chi tiết bài viết
    if (slug) {
        if (loadingDetail) {
            return (
                <div className="min-h-screen font-sans bg-[#f8fbff] flex items-center justify-center">
                    <Spin size="large" />
                </div>
            );
        }

        if (!selectedArticle) {
            return (
                <div className="min-h-screen font-sans bg-[#f8fbff]">
                    <Navbar />
                    <div className="h-[90px]" />
                    <div className="landing-container py-20">
                        <Empty description="Không tìm thấy bài viết" />
                    </div>
                </div>
            );
        }
        return (
            <div className="min-h-screen font-sans bg-[#f8fbff] flex flex-col">
                <Navbar />

                {/* Hero Section - dính nav */}
                <section
                    style={{
                        marginBottom: '20px',
                        marginTop: '90px',
                        paddingTop: '20px',
                        paddingBottom: '20px',
                        minHeight: '240px'
                    }}
                    className="bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] text-white flex flex-col items-center justify-center"
                >
                    <div className="w-full max-w-[1200px] px-6">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/news')}
                            className="mb-6 text-white border-white hover:bg-white/20 rounded-lg"
                        >
                            Quay lại danh sách
                        </Button>

                        <Tag color="#009CAA" className="mb-4 text-sm px-3 py-1 rounded">
                            {selectedArticle.category}
                        </Tag>

                        <Title level={1} className="!text-white !mb-4 !text-3xl md:!text-5xl text-center">
                            {selectedArticle.title}
                        </Title>

                        <div className="flex flex-wrap items-center justify-center gap-6 text-gray-200">
                            {selectedArticle.author && (
                                <div className="flex items-center gap-2">
                                    <UserOutlined />
                                    <span>{selectedArticle.author}</span>
                                </div>
                            )}
                            {selectedArticle.published_at && (
                                <div className="flex items-center gap-2">
                                    <CalendarOutlined />
                                    <span>{dayjs(selectedArticle.published_at).format('DD/MM/YYYY')}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <EyeOutlined />
                                <span>{selectedArticle.views} lượt xem</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section style={{ marginBottom: '0' }} className="py-20 bg-white flex-grow">
                    <div className="landing-container max-w-[900px] mx-auto">
                        {selectedArticle.image && (
                            <img
                                src={selectedArticle.image}
                                alt={selectedArticle.title}
                                className="w-full h-auto rounded-lg mb-8 shadow-lg"
                            />
                        )}
                        <div
                            className="news-content"
                            dangerouslySetInnerHTML={{ __html: selectedArticle.content ?? '' }}
                        />
                        <style>{`
                            .news-content {
                                color: #333;
                                line-height: 1.8;
                                font-size: 16px;
                            }
                            .news-content h2 {
                                color: #003553;
                                font-size: 1.75rem;
                                font-weight: bold;
                                margin-top: 2rem;
                                margin-bottom: 1rem;
                            }
                            .news-content h3 {
                                color: #004d6b;
                                font-size: 1.5rem;
                                font-weight: bold;
                                margin-top: 1.5rem;
                                margin-bottom: 0.75rem;
                            }
                            .news-content p {
                                margin-bottom: 1.5rem;
                                color: #555;
                            }
                            .news-content ul, .news-content ol {
                                margin-bottom: 1.5rem;
                                padding-left: 2rem;
                            }
                            .news-content li {
                                margin-bottom: 0.5rem;
                                color: #555;
                            }
                            .news-content img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                margin: 1.5rem 0;
                            }
                            .news-content a {
                                color: #009CAA;
                                text-decoration: underline;
                            }
                            .news-content blockquote {
                                border-left: 4px solid #009CAA;
                                padding-left: 1.5rem;
                                margin: 1.5rem 0;
                                font-style: italic;
                                color: #666;
                            }
                        `}</style>
                    </div>
                </section>

                <Footer />
            </div>
        );
    }

    // Hiển thị danh sách bài viết
    return (
        <div className="min-h-screen font-sans bg-[#f8fbff] flex flex-col">
            <Navbar />

            {/* Hero Section - dính nav, padding 20px */}
            <section
                style={{
                    marginBottom: '20px',
                    marginTop: '90px',
                    paddingTop: '20px',
                    paddingBottom: '20px',
                    minHeight: '260px'
                }}
                className="bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] text-white flex flex-col items-center justify-center"
            >
                <div className="w-full flex flex-col items-center justify-center text-center px-6">
                    <FileTextOutlined className="text-5xl mb-4" style={{ color: '#ffffff' }} />
                    <h1 className="text-white font-extrabold mb-4 text-4xl md:text-5xl" style={{ color: '#ffffff', margin: '0 0 1rem 0' }}>
                        Tin tức & Sức khỏe
                    </h1>
                    <p className="text-white text-xl max-w-2xl text-center leading-relaxed font-normal tracking-wide" style={{ color: '#ffffff', fontSize: '1.25rem' }}>
                        Cập nhật thông tin mới nhất về sức khỏe, dinh dưỡng và phòng bệnh
                    </p>
                </div>
            </section>

            {/* News List - cách bottom 20px, search cách cards rộng ra, padding 10px */}
            <section style={{ marginBottom: '20px' }} className="py-20 flex-grow">
                <div className="landing-container max-w-[1200px] mx-auto">
                    {/* Ô tìm kiếm - padding trên dưới 10px, cách ô tin tức ra */}
                    <div
                        className="max-w-lg mx-auto mb-8"
                        style={{ paddingTop: '10px', paddingBottom: '10px' }}
                    >
                        <Input
                            size="large"
                            placeholder="Tìm kiếm bài viết..."
                            prefix={<SearchOutlined className="text-[#009CAA]" />}
                            className="news-search-input rounded-lg py-3 px-5 text-base bg-white border border-slate-200 shadow-md hover:border-[#009CAA]/50 hover:shadow-lg focus:border-[#009CAA] transition-all duration-200 placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {loadingList ? (
                        <div className="text-center py-16">
                            <Spin size="large" />
                        </div>
                    ) : !newsData?.data || newsData.data.length === 0 ? (
                        <Empty description="Không tìm thấy bài viết nào" />
                    ) : (
                        <>
                            <Row gutter={[32, 40]} justify="center">
                                {newsData.data.map((article) => (
                                    <Col xs={24} sm={12} lg={8} key={article.id}>
                                        <Card
                                            hoverable
                                            className="h-full rounded-lg overflow-hidden border border-slate-100 bg-white shadow-sm news-card hover:border-[#009CAA]/30 hover:shadow-lg transition-all duration-200"
                                            bodyStyle={{ padding: 0 }}
                                            cover={
                                                article.image ? (
                                                    <img
                                                        alt={article.title}
                                                        src={article.image}
                                                        className="h-48 w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-48 bg-gradient-to-br from-[#009CAA] to-[#006680] flex items-center justify-center">
                                                        <FileTextOutlined className="text-5xl text-white/60" />
                                                    </div>
                                                )
                                            }
                                            onClick={() => navigate(`/news/${article.slug}`)}
                                        >
                                            <div style={{ padding: '10px' }}>
                                                {article.category && (
                                                    <Tag color="#009CAA" className="mb-2 rounded font-medium text-xs border-0">
                                                        {article.category}
                                                    </Tag>
                                                )}
                                                <h3 className="text-[#003553] font-semibold text-base leading-snug line-clamp-2 min-h-[2.75rem] mb-2 tracking-tight">
                                                    {article.title}
                                                </h3>
                                                {article.excerpt && (
                                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-3 font-normal">
                                                        {article.excerpt}
                                                    </p>
                                                )}
                                                <Divider className="my-2 !border-slate-100" />
                                                <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
                                                    {article.author && (
                                                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                                                            <UserOutlined className="text-slate-400 flex-shrink-0" />
                                                            <span className="truncate">{article.author}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        {article.published_at && (
                                                            <div className="flex items-center gap-1">
                                                                <CalendarOutlined />
                                                                <span>{dayjs(article.published_at).format('DD/MM/YYYY')}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <EyeOutlined />
                                                            <span>{article.views} lượt xem</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination */}
                            {newsData.totalPages > 1 && (
                                <div className="mt-12 text-center">
                                    <Pagination
                                        current={currentPage}
                                        total={newsData.total}
                                        pageSize={pageSize}
                                        onChange={setCurrentPage}
                                        showSizeChanger={false}
                                        className="justify-center"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
