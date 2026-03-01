import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Form, Input, Button, message, Row, Col, Card, Divider, Spin, Select } from 'antd';
import {
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    SendOutlined,
    MessageOutlined,
    UserOutlined,
} from '@ant-design/icons';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import BookingModal from '@/components/booking/BookingModal';
import { useAuthStore } from '@/stores/authStore';
import { branchesService } from '@/services/branches.service';
import { contactService } from '@/services/contact.service';

const { TextArea } = Input;

function getMapEmbedUrl(address: string): string {
    if (!address?.trim()) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

export default function ContactPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    const { user, isAuthenticated } = useAuthStore();
    const { data: branches = [], isLoading: loadingBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getBranches,
    });

    const activeBranches = branches.filter((b: any) => b.is_active !== false);
    const selectedBranch = activeBranches.find((b: any) => b.id === selectedBranchId) || activeBranches[0];

    useEffect(() => {
        if (activeBranches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(activeBranches[0].id);
        }
    }, [activeBranches, selectedBranchId]);

    useEffect(() => {
        if (isAuthenticated && user) {
            form.setFieldsValue({
                name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [isAuthenticated, user, form]);

    const handleSubmit = async (values: ContactFormData) => {
        setLoading(true);
        try {
            await contactService.create({
                name: values.name,
                email: values.email,
                phone: values.phone,
                subject: values.subject,
                message: values.message,
                branch_id: selectedBranchId || undefined,
                patient_id: user?.patient_id || undefined,
            });
            message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
            form.resetFields();
            if (isAuthenticated && user) {
                form.setFieldsValue({
                    name: user.full_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                });
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans bg-[#f8fbff] flex flex-col">
            <Navbar />

            {/* Hero - dính nav, padding 20px, chữ trắng */}
            <section
                style={{
                    marginBottom: '20px',
                    marginTop: '90px',
                    paddingTop: '20px',
                    paddingBottom: '20px',
                    minHeight: '260px'
                }}
                className="bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] flex flex-col items-center justify-center"
            >
                <div className="w-full flex flex-col items-center justify-center text-center px-6">
                    <MessageOutlined className="text-5xl mb-4" style={{ color: '#ffffff' }} />
                    <h1 className="font-extrabold mb-4 text-4xl md:text-5xl" style={{ color: '#ffffff' }}>
                        Liên hệ với chúng tôi
                    </h1>
                    <p className="text-xl max-w-2xl leading-relaxed" style={{ color: '#ffffff', fontSize: '1.25rem' }}>
                        Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                    </p>
                </div>
            </section>

            {/* Contact Content */}
            <section style={{ marginBottom: '20px' }} className="py-16 bg-[#f8fbff]">
                <div className="landing-container max-w-[1200px] mx-auto">
                    <Row gutter={[40, 40]} justify="center">
                        {/* Contact Form */}
                        <Col xs={24} lg={14}>
                            <Card
                                className="rounded-lg border border-slate-100 shadow-md bg-white"
                                bodyStyle={{ padding: 28 }}
                            >
                                <h2 className="text-xl font-bold text-[#003553] mb-8">
                                    Gửi tin nhắn cho chúng tôi
                                </h2>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                    size="large"
                                    className="contact-form"
                                >
                                    <Row gutter={20}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="name"
                                                label={<span className="font-medium text-slate-700">Họ và tên</span>}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên' },
                                                    { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' },
                                                ]}
                                            >
                                                <Input
                                                    prefix={<UserOutlined className="text-[#009CAA]" />}
                                                    placeholder="Nhập họ và tên của bạn"
                                                    className="rounded-lg h-11"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="phone"
                                                label={<span className="font-medium text-slate-700">Số điện thoại</span>}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                    {
                                                        pattern: /^[0-9]{10,11}$/,
                                                        message: 'Số điện thoại không hợp lệ',
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    prefix={<PhoneOutlined className="text-[#009CAA]" />}
                                                    placeholder="0912345678"
                                                    className="rounded-lg h-11"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="email"
                                        label={<span className="font-medium text-slate-700">Email</span>}
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email' },
                                            { type: 'email', message: 'Email không hợp lệ' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined className="text-[#009CAA]" />}
                                            placeholder="your.email@example.com"
                                            className="rounded-lg h-11"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="subject"
                                        label={<span className="font-medium text-slate-700">Chủ đề</span>}
                                        rules={[{ required: true, message: 'Vui lòng nhập chủ đề' }]}
                                    >
                                        <Input placeholder="VD: Đặt lịch khám, Tư vấn sức khỏe..." className="rounded-lg h-11" />
                                    </Form.Item>

                                    <Form.Item
                                        name="message"
                                        label={<span className="font-medium text-slate-700">Nội dung tin nhắn</span>}
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập nội dung' },
                                            { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' },
                                        ]}
                                    >
                                        <TextArea
                                            rows={5}
                                            placeholder="Nhập nội dung tin nhắn của bạn..."
                                            showCount
                                            maxLength={1000}
                                            className="rounded-lg"
                                        />
                                    </Form.Item>

                                    <Form.Item className="mb-0">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            icon={<SendOutlined />}
                                            className="w-full bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 font-bold rounded-lg"
                                        >
                                            Gửi tin nhắn
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>

                        {/* Contact Information + Map */}
                        <Col xs={24} lg={10}>
                            <div className="space-y-6">
                                {loadingBranches ? (
                                    <Card bodyStyle={{ padding: 40, textAlign: 'center' }}>
                                        <Spin tip="Đang tải thông tin..." />
                                    </Card>
                                ) : selectedBranch ? (
                                    <>
                                        {activeBranches.length > 1 && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn chi nhánh</label>
                                                <Select
                                                    value={selectedBranchId}
                                                    onChange={setSelectedBranchId}
                                                    options={activeBranches.map((b: any) => ({ label: b.name, value: b.id }))}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                        <Card
                                            className="contact-info-card rounded-lg border-none shadow-md"
                                            bodyStyle={{
                                                padding: 24,
                                                background: 'linear-gradient(135deg, #003553 0%, #006680 100%)',
                                                color: '#ffffff'
                                            }}
                                        >
                                            <h3 className="text-lg font-bold mb-6" style={{ color: '#ffffff' }}>
                                                Thông tin liên hệ - {selectedBranch.name}
                                            </h3>

                                            <div>
                                                {selectedBranch.phone && (
                                                    <>
                                                        <div className="flex gap-4 items-center py-4">
                                                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-lg" style={{ color: '#7dd3fc' }}>
                                                                <PhoneOutlined />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Hotline</div>
                                                                <a href={`tel:${selectedBranch.phone}`} className="block leading-6 font-medium hover:underline" style={{ color: '#ffffff' }}>{selectedBranch.phone}</a>
                                                            </div>
                                                        </div>
                                                        <Divider className="!border-white/20 !my-0" />
                                                    </>
                                                )}
                                                {selectedBranch.email && (
                                                    <>
                                                        <div className="flex gap-4 items-center py-4">
                                                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-lg" style={{ color: '#7dd3fc' }}>
                                                                <MailOutlined />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Email</div>
                                                                <a href={`mailto:${selectedBranch.email}`} className="block leading-6 font-medium hover:underline break-all" style={{ color: '#ffffff' }}>{selectedBranch.email}</a>
                                                            </div>
                                                        </div>
                                                        <Divider className="!border-white/20 !my-0" />
                                                    </>
                                                )}
                                                <div className="flex gap-4 items-center py-4">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-lg" style={{ color: '#7dd3fc' }}>
                                                        <EnvironmentOutlined />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Địa chỉ</div>
                                                        <div className="contact-info-text text-sm leading-6" style={{ color: '#ffffff', margin: 0 }}>
                                                            {selectedBranch.address}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Divider className="!border-white/20 !my-0" />
                                                <div className="flex gap-4 items-center py-4">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-lg" style={{ color: '#7dd3fc' }}>
                                                        <ClockCircleOutlined />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>Giờ làm việc</div>
                                                        <div className="contact-info-text text-sm leading-6" style={{ color: '#ffffff', margin: 0 }}>
                                                            Thứ 2 - Thứ 7: 08:00 - 17:00
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="rounded-lg border border-slate-100 shadow-sm bg-white" bodyStyle={{ padding: 20 }}>
                                            <h4 className="text-base font-bold text-[#003553] mb-4">Bản đồ</h4>
                                            {selectedBranch.address ? (
                                                <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-200">
                                                    <iframe
                                                        src={getMapEmbedUrl(selectedBranch.address)}
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        allowFullScreen
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        title="Bản đồ"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-64 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200">
                                                    <EnvironmentOutlined className="text-4xl text-slate-400 mb-2" />
                                                    <p className="text-slate-500 text-sm">Chưa có địa chỉ</p>
                                                </div>
                                            )}
                                        </Card>
                                    </>
                                ) : (
                                    <Card bodyStyle={{ padding: 24 }}>
                                        <p className="text-slate-500 text-center">Chưa có thông tin chi nhánh</p>
                                    </Card>
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            <AuthModal />
            <BookingModal />

            {/* FAQ Section */}
            <section style={{ marginBottom: '20px' }} className="py-16 bg-white">
                <div className="landing-container max-w-[1200px] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[#003553] mb-2">
                            Câu hỏi thường gặp
                        </h2>
                        <p className="text-slate-600">
                            Tìm câu trả lời cho những thắc mắc phổ biến
                        </p>
                    </div>

                    <Row gutter={[24, 24]} justify="center">
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-[#009CAA]/20 transition-all" bodyStyle={{ padding: 20 }}>
                                <h4 className="text-base font-bold text-[#003553] mb-2">
                                    Làm thế nào để đặt lịch khám?
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                                    Bạn có thể đặt lịch khám trực tuyến qua website, gọi hotline hoặc đến trực tiếp phòng khám. Chúng tôi hỗ trợ đặt lịch 24/7.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-[#009CAA]/20 transition-all" bodyStyle={{ padding: 20 }}>
                                <h4 className="text-base font-bold text-[#003553] mb-2">
                                    Phòng khám có chấp nhận bảo hiểm y tế không?
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                                    Có, chúng tôi chấp nhận thanh toán bằng bảo hiểm y tế và nhiều hình thức thanh toán khác như thẻ tín dụng, chuyển khoản.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-[#009CAA]/20 transition-all" bodyStyle={{ padding: 20 }}>
                                <h4 className="text-base font-bold text-[#003553] mb-2">
                                    Tôi có thể hủy hoặc đổi lịch hẹn không?
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                                    Có, bạn có thể hủy hoặc đổi lịch hẹn trước 24 giờ. Vui lòng liên hệ hotline hoặc sử dụng tính năng quản lý lịch hẹn trên website.
                                </p>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-[#009CAA]/20 transition-all" bodyStyle={{ padding: 20 }}>
                                <h4 className="text-base font-bold text-[#003553] mb-2">
                                    Phòng khám có dịch vụ khám ngoài giờ không?
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                                    Có, chúng tôi có dịch vụ khám ngoài giờ và khẩn cấp. Vui lòng gọi hotline để được tư vấn chi tiết.
                                </p>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

            <Footer />
        </div>
    );
}
