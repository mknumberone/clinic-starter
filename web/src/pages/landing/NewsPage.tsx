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
            <div className="min-h-screen font-sans bg-[#f8fbff]">
                <Navbar />

                {/* Spacer bù chiều cao navbar */}
                <div className="h-[90px]" />

                {/* Hero Section */}
                <section className="pt-32 pb-16 bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] text-white">
                    <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/news')}
                            className="mb-6 text-white border-white hover:bg-white/20"
                        >
                            Quay lại danh sách
                        </Button>

                        <Tag color="#009CAA" className="mb-4 text-sm px-3 py-1">
                            {selectedArticle.category}
                        </Tag>

                        <Title level={1} className="!text-white !mb-4 !text-3xl md:!text-5xl">
                            {selectedArticle.title}
                        </Title>

                        <div className="flex flex-wrap items-center gap-6 text-gray-200">
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
                <section className="py-20 bg-white">
                    <div className="landing-container max-w-[900px] mx-auto px-0 md:px-0 lg:px-0">
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
        <div className="min-h-screen font-sans bg-[#f8fbff]">
            <Navbar />

            {/* Hero Section */}
            <section className="mt-[90px] pt-32 pb-16 bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] text-white">
                <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0 text-center">
                    <FileTextOutlined className="text-6xl mb-6 text-cyan-300" />
                    <Title level={1} className="!text-white !mb-4 !text-4xl md:!text-6xl">
                        Tin tức & Sức khỏe
                    </Title>
                    <Paragraph className="text-gray-200 text-lg max-w-2xl mx-auto">
                        Cập nhật những thông tin mới nhất về sức khỏe, dinh dưỡng và phòng bệnh
                    </Paragraph>
                </div>
            </section>

            {/* News List */}
            <section className="py-20">
                <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0">
                    {/* Search Bar */}
                    <div className="mb-8 max-w-md mx-auto">
                        <Input
                            size="large"
                            placeholder="Tìm kiếm bài viết..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            className="rounded-full py-3 px-6 text-base shadow-md border-gray-200"
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
                            <Row gutter={[24, 24]}>
                                {newsData.data.map((article) => (
                                    <Col xs={24} sm={12} lg={8} key={article.id}>
                                        <Card
                                            hoverable
                                            className="h-full rounded-2xl overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
                                            cover={
                                                article.image ? (
                                                    <img
                                                        alt={article.title}
                                                        src={article.image}
                                                        className="h-48 object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-48 bg-gradient-to-br from-[#009CAA] to-[#006680] flex items-center justify-center">
                                                        <FileTextOutlined className="text-6xl text-white/50" />
                                                    </div>
                                                )
                                            }
                                            onClick={() => navigate(`/news/${article.slug}`)}
                                        >
                                            <div className="p-4">
                                                {article.category && (
                                                    <Tag color="#009CAA" className="mb-3">
                                                        {article.category}
                                                    </Tag>
                                                )}
                                                <Title
                                                    level={4}
                                                    className="!mb-3 !text-[#003553] line-clamp-2 min-h-[3.5rem]"
                                                >
                                                    {article.title}
                                                </Title>
                                                {article.excerpt && (
                                                    <Paragraph
                                                        className="text-gray-600 mb-4 line-clamp-3"
                                                        ellipsis={{ rows: 3 }}
                                                    >
                                                        {article.excerpt}
                                                    </Paragraph>
                                                )}
                                                <Divider className="my-3" />
                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    {article.author && (
                                                        <div className="flex items-center gap-2">
                                                            <UserOutlined />
                                                            <span>{article.author}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        {article.published_at && (
                                                            <div className="flex items-center gap-1">
                                                                <CalendarOutlined />
                                                                <span>{dayjs(article.published_at).format('DD/MM/YYYY')}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <EyeOutlined />
                                                            <span>{article.views}</span>
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
