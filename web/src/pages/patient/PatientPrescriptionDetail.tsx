import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Button, Descriptions, Tag, Divider, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, MedicineBoxOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PatientPrescriptionDetail() {
    const { id } = useParams(); // ID của đơn thuốc
    const navigate = useNavigate();

    // Gọi API lấy chi tiết đơn thuốc
    // (Lưu ý: Bạn cần đảm bảo Backend có API GET /prescriptions/:id cho Patient)
    const { data: prescription, isLoading, isError } = useQuery({
        queryKey: ['prescription', id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/prescriptions/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    const columns = [
        {
            title: 'Tên thuốc',
            dataIndex: 'name', // Backend đã lưu tên thuốc (cả thuốc kho và thuốc ngoài)
            key: 'name',
            render: (text: string, record: any) => (
                <div>
                    <div className="font-bold text-base text-blue-700">{text}</div>
                    {/* Nếu là thuốc ngoài, hiện tag thông báo */}
                    {!record.medication_id && <Tag color="orange" className="mt-1">Tự mua ngoài</Tag>}
                </div>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
            render: (qty: number) => <b className="text-lg">{qty}</b>
        },
        {
            title: 'Liều dùng & Cách dùng',
            key: 'instruction',
            render: (_: any, record: any) => (
                <div>
                    <div><span className="text-gray-500">Liều:</span> <b>{record.dosage}</b></div>
                    <div><span className="text-gray-500">Cách dùng:</span> {record.frequency}</div>
                </div>
            )
        }
    ];

    if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Spin size="large" /></div></DashboardLayout>;
    if (isError || !prescription) return <DashboardLayout><Alert message="Không tìm thấy đơn thuốc" type="error" /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-4 max-w-4xl mx-auto">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">Quay lại</Button>

                <Card className="shadow-md border-t-4 border-t-blue-600">
                    <div className="text-center mb-6">
                        <Title level={3} className="text-blue-700 m-0"><MedicineBoxOutlined /> ĐƠN THUỐC ĐIỆN TỬ</Title>
                        <Text type="secondary">Mã đơn: {prescription.id.slice(0, 8).toUpperCase()}</Text>
                    </div>

                    <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                        <Descriptions.Item label={<><UserOutlined /> Bác sĩ kê đơn</>}>
                            <b className="text-lg">{prescription.doctor?.user?.full_name}</b>
                        </Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined /> Ngày kê</>}>
                            {dayjs(prescription.created_at).format('DD/MM/YYYY - HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chẩn đoán/Ghi chú" span={2}>
                            {prescription.notes || 'Không có ghi chú'}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left" className="text-blue-600 border-blue-600">Chi tiết thuốc</Divider>

                    <Table
                        dataSource={prescription.items}
                        columns={columns}
                        pagination={false}
                        rowKey="id"
                        bordered
                    />

                    <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100 italic text-gray-600">
                        * Lời dặn: Uống thuốc đúng giờ, tái khám theo lịch hẹn. Nếu có dấu hiệu bất thường vui lòng liên hệ ngay với phòng khám.
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}