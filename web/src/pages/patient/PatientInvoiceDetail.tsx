import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Tag, Divider, Spin, Row, Col, Alert, Image } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PatientInvoiceDetail() {
    const { id } = useParams(); // ID hóa đơn
    const navigate = useNavigate();

    // Lấy thông tin hóa đơn
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/prescriptions/invoices/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    // Tạo link QR VietQR (Dùng API public của VietQR để tạo mã nhanh)
    // Cấu trúc: https://img.vietqr.io/image/[BANK_ID]-[ACCOUNT_NO]-[TEMPLATE].png?amount=[AMOUNT]&addInfo=[CONTENT]
    // Ví dụ: Ngân hàng MB (970422), STK: 0988888888
    const bankId = 'MB';
    const accountNo = '0988888888'; // Thay bằng STK phòng khám của bạn
    const accountName = 'PHONG KHAM DA KHOA';

    // Nội dung chuyển khoản: "THANHTOAN [Mã HĐ]"
    const qrUrl = invoice ?
        `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${invoice.total_amount}&addInfo=TT ${invoice.id.slice(0, 8)}&accountName=${encodeURIComponent(accountName)}`
        : '';

    const columns = [
        {
            title: 'Dịch vụ / Thuốc',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            align: 'center' as const,
            width: 80,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'amount',
            align: 'right' as const,
            render: (val: number) => <b>{Number(val).toLocaleString()} ₫</b>
        }
    ];

    if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Spin /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-4 max-w-5xl mx-auto">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">Quay lại</Button>

                <Row gutter={24}>
                    {/* CỘT TRÁI: CHI TIẾT HÓA ĐƠN */}
                    <Col span={14} xs={24}>
                        <Card className="shadow-sm h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Title level={4} className="m-0">CHI TIẾT HÓA ĐƠN</Title>
                                    <Text type="secondary">Mã: #{invoice.id.slice(0, 8).toUpperCase()}</Text>
                                </div>
                                <Tag color={invoice.status === 'PAID' ? 'green' : 'red'} className="text-base px-3 py-1">
                                    {invoice.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                                </Tag>
                            </div>

                            <Table
                                dataSource={invoice.items}
                                columns={columns}
                                pagination={false}
                                rowKey="id"
                                size="small"
                                summary={(pageData) => {
                                    return (
                                        <Table.Summary fixed>
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={2} className="text-right font-bold text-lg">
                                                    TỔNG CỘNG:
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} className="text-right font-bold text-xl text-red-600">
                                                    {Number(invoice.total_amount).toLocaleString()} ₫
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        </Table.Summary>
                                    );
                                }}
                            />

                            <Divider />
                            <div className="text-gray-500 text-xs">
                                Ngày tạo: {dayjs(invoice.created_at).format('DD/MM/YYYY HH:mm')}
                            </div>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: KHUNG THANH TOÁN (QR CODE) */}
                    <Col span={10} xs={24}>
                        <Card className="shadow-md border-green-100 bg-green-50 text-center h-full">
                            {invoice.status === 'PAID' ? (
                                <div className="py-12">
                                    <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
                                    <Title level={3} type="success">Thanh toán thành công!</Title>
                                    <Text>Cảm ơn bạn đã sử dụng dịch vụ.</Text>
                                </div>
                            ) : (
                                <div>
                                    <Title level={4} className="text-green-700"><DollarOutlined /> QUÉT MÃ THANH TOÁN</Title>
                                    <Alert message="Vui lòng quét mã bên dưới để thanh toán nhanh" type="info" showIcon className="mb-4 text-left" />

                                    <div className="bg-white p-4 rounded-lg inline-block shadow-sm mb-4">
                                        <Image
                                            src={qrUrl}
                                            alt="QR Payment"
                                            width={200}
                                            preview={false}
                                        />
                                    </div>

                                    <div className="text-left bg-white p-3 rounded border border-gray-200">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-500">Ngân hàng:</span>
                                            <b>MB Bank</b>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-500">Số tài khoản:</span>
                                            <b>{accountNo}</b>
                                        </div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-500">Chủ tài khoản:</span>
                                            <b>{accountName}</b>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Số tiền:</span>
                                            <b className="text-red-600 text-lg">{Number(invoice.total_amount).toLocaleString()} ₫</b>
                                        </div>
                                    </div>

                                    <Button type="primary" className="mt-4 w-full bg-green-600 hover:bg-green-500">
                                        <SyncOutlined /> Tôi đã chuyển khoản
                                    </Button>
                                    <Text type="secondary" className="block mt-2 text-xs">
                                        (Hệ thống sẽ tự động cập nhật sau ít phút hoặc vui lòng liên hệ quầy thu ngân)
                                    </Text>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </DashboardLayout>
    );
}