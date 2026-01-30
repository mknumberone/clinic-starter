import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col, Card, Typography, Divider } from 'antd';
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
import axiosInstance from '@/lib/axios';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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

    const handleSubmit = async (values: ContactFormData) => {
        setLoading(true);
        try {
            // TODO: Thay thế bằng API endpoint thực tế khi có
            // await axiosInstance.post('/contact', values);

            // Mock success - có thể xóa khi có API thực tế
            await new Promise((resolve) => setTimeout(resolve, 1000));

            message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
            form.resetFields();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans bg-[#f8fbff]">
            <Navbar />
            {/* Spacer bù chiều cao navbar */}
            <div className="h-[90px]" />
            {/* Hero Section */}
            <section className="mt-[90px] pt-32 pb-16 bg-gradient-to-br from-[#003553] via-[#004d6b] to-[#006680] text-white">
                <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0 text-center">
                    <MessageOutlined className="text-6xl mb-6 text-cyan-300" />
                    <Title level={1} className="!text-white !mb-4 !text-4xl md:!text-6xl">
                        Liên hệ với chúng tôi
                    </Title>
                    <Paragraph className="text-gray-200 text-lg max-w-2xl mx-auto">
                        Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                    </Paragraph>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-20 bg-[#f8fbff]">
                <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0">
                    <Row gutter={[32, 32]}>
                        {/* Contact Form */}
                        <Col xs={24} lg={14}>
                            <Card className="rounded-2xl shadow-lg border-none">
                                <Title level={2} className="!text-[#003553] !mb-6">
                                    Gửi tin nhắn cho chúng tôi
                                </Title>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                    size="large"
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="name"
                                                label="Họ và tên"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên' },
                                                    { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' },
                                                ]}
                                            >
                                                <Input
                                                    prefix={<UserOutlined className="text-gray-400" />}
                                                    placeholder="Nhập họ và tên của bạn"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="phone"
                                                label="Số điện thoại"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                    {
                                                        pattern: /^[0-9]{10,11}$/,
                                                        message: 'Số điện thoại không hợp lệ',
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    prefix={<PhoneOutlined className="text-gray-400" />}
                                                    placeholder="0912345678"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email' },
                                            { type: 'email', message: 'Email không hợp lệ' },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined className="text-gray-400" />}
                                            placeholder="your.email@example.com"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="subject"
                                        label="Chủ đề"
                                        rules={[{ required: true, message: 'Vui lòng nhập chủ đề' }]}
                                    >
                                        <Input placeholder="VD: Đặt lịch khám, Tư vấn sức khỏe..." />
                                    </Form.Item>

                                    <Form.Item
                                        name="message"
                                        label="Nội dung tin nhắn"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập nội dung' },
                                            { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' },
                                        ]}
                                    >
                                        <TextArea
                                            rows={6}
                                            placeholder="Nhập nội dung tin nhắn của bạn..."
                                            showCount
                                            maxLength={1000}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            icon={<SendOutlined />}
                                            className="w-full bg-[#009CAA] hover:!bg-[#0086b3] border-none h-12 font-bold text-base"
                                        >
                                            Gửi tin nhắn
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>

                        {/* Contact Information */}
                        <Col xs={24} lg={10}>
                            <div className="space-y-6">
                                <Card className="rounded-2xl shadow-lg border-none bg-gradient-to-br from-[#003553] to-[#006680] text-white">
                                    <Title level={3} className="!text-white !mb-6">
                                        Thông tin liên hệ
                                    </Title>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/10 rounded-lg">
                                                <PhoneOutlined className="text-2xl text-cyan-300" />
                                            </div>
                                            <div>
                                                <Text className="text-gray-300 block mb-1">Hotline</Text>
                                                <a
                                                    href="tel:19001234"
                                                    className="text-white text-lg font-semibold hover:text-cyan-300 transition-colors"
                                                >
                                                    1900 1234
                                                </a>
                                                <br />
                                                <a
                                                    href="tel:0912345678"
                                                    className="text-white text-lg font-semibold hover:text-cyan-300 transition-colors"
                                                >
                                                    0912 345 678
                                                </a>
                                            </div>
                                        </div>

                                        <Divider className="!border-white/20" />

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/10 rounded-lg">
                                                <MailOutlined className="text-2xl text-cyan-300" />
                                            </div>
                                            <div>
                                                <Text className="text-gray-300 block mb-1">Email</Text>
                                                <a
                                                    href="mailto:contact@dymmedical.com"
                                                    className="text-white text-lg font-semibold hover:text-cyan-300 transition-colors break-all"
                                                >
                                                    contact@dymmedical.com
                                                </a>
                                                <br />
                                                <a
                                                    href="mailto:info@dymmedical.com"
                                                    className="text-white text-lg font-semibold hover:text-cyan-300 transition-colors break-all"
                                                >
                                                    info@dymmedical.com
                                                </a>
                                            </div>
                                        </div>

                                        <Divider className="!border-white/20" />

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/10 rounded-lg">
                                                <EnvironmentOutlined className="text-2xl text-cyan-300" />
                                            </div>
                                            <div>
                                                <Text className="text-gray-300 block mb-1">Địa chỉ</Text>
                                                <Paragraph className="!text-white !mb-0">
                                                    123 Đường ABC, Phường XYZ
                                                    <br />
                                                    Quận 1, TP. Hồ Chí Minh
                                                </Paragraph>
                                            </div>
                                        </div>

                                        <Divider className="!border-white/20" />

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white/10 rounded-lg">
                                                <ClockCircleOutlined className="text-2xl text-cyan-300" />
                                            </div>
                                            <div>
                                                <Text className="text-gray-300 block mb-1">Giờ làm việc</Text>
                                                <Paragraph className="!text-white !mb-0">
                                                    Thứ 2 - Thứ 6: 7:00 - 20:00
                                                    <br />
                                                    Thứ 7 - Chủ nhật: 8:00 - 17:00
                                                </Paragraph>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Map Placeholder */}
                                <Card className="rounded-2xl shadow-lg border-none">
                                    <Title level={4} className="!text-[#003553] !mb-4">
                                        Bản đồ
                                    </Title>
                                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <EnvironmentOutlined className="text-4xl mb-2" />
                                            <Text>Bản đồ sẽ được tích hợp tại đây</Text>
                                        </div>
                                        {/* Có thể thêm Google Maps hoặc Mapbox sau */}
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="landing-container max-w-[1200px] mx-auto px-0 md:px-0 lg:px-0">
                    <div className="text-center mb-12">
                        <Title level={2} className="!text-[#003553] !mb-4">
                            Câu hỏi thường gặp
                        </Title>
                        <Text className="text-gray-600 text-lg">
                            Tìm câu trả lời cho những thắc mắc phổ biến
                        </Text>
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <Title level={4} className="!text-[#003553] !mb-2">
                                    Làm thế nào để đặt lịch khám?
                                </Title>
                                <Paragraph className="text-gray-600">
                                    Bạn có thể đặt lịch khám trực tuyến qua website, gọi hotline hoặc đến trực tiếp phòng khám.
                                    Chúng tôi hỗ trợ đặt lịch 24/7.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <Title level={4} className="!text-[#003553] !mb-2">
                                    Phòng khám có chấp nhận bảo hiểm y tế không?
                                </Title>
                                <Paragraph className="text-gray-600">
                                    Có, chúng tôi chấp nhận thanh toán bằng bảo hiểm y tế và nhiều hình thức thanh toán khác như thẻ tín dụng, chuyển khoản.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <Title level={4} className="!text-[#003553] !mb-2">
                                    Tôi có thể hủy hoặc đổi lịch hẹn không?
                                </Title>
                                <Paragraph className="text-gray-600">
                                    Có, bạn có thể hủy hoặc đổi lịch hẹn trước 24 giờ. Vui lòng liên hệ hotline hoặc sử dụng tính năng quản lý lịch hẹn trên website.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="h-full rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <Title level={4} className="!text-[#003553] !mb-2">
                                    Phòng khám có dịch vụ khám ngoài giờ không?
                                </Title>
                                <Paragraph className="text-gray-600">
                                    Có, chúng tôi có dịch vụ khám ngoài giờ và khẩn cấp. Vui lòng gọi hotline để được tư vấn chi tiết.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </section>

            <Footer />
        </div>
    );
}
