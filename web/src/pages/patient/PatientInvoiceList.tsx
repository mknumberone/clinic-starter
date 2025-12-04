import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Typography, Space } from 'antd';
import { DollarOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PatientInvoiceList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Gọi API lấy danh sách hóa đơn
    const { data: invoices, isLoading } = useQuery({
        queryKey: ['my-invoices', user.patient_id],
        queryFn: async () => {
            if (!user.patient_id) return [];
            // Cần đảm bảo Backend có API này (Thường là trong PatientsController)
            const res = await axiosInstance.get(`/patients/${user.patient_id}/invoices`);
            return res.data;
        },
        enabled: !!user.patient_id
    });

    const columns = [
        {
            title: 'Mã HĐ',
            dataIndex: 'id',
            width: 100,
            render: (id: string) => <Tag>{id.slice(0, 8).toUpperCase()}</Tag>
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Số tiền',
            dataIndex: 'total_amount',
            align: 'right' as const,
            render: (val: number) => <b className="text-red-600">{Number(val).toLocaleString()} ₫</b>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            align: 'center' as const,
            render: (status: string) => {
                let color = 'default';
                let text = 'Không rõ';
                if (status === 'PAID') { color = 'green'; text = 'Đã thanh toán'; }
                else if (status === 'UNPAID') { color = 'red'; text = 'Chưa thanh toán'; }
                else if (status === 'PARTIALLY_PAID') { color = 'orange'; text = 'Thanh toán 1 phần'; }

                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Button
                    type={record.status === 'UNPAID' ? 'primary' : 'default'}
                    size="small"
                    icon={record.status === 'UNPAID' ? <DollarOutlined /> : <EyeOutlined />}
                    onClick={() => navigate(`/patient/invoices/${record.id}`)}
                >
                    {record.status === 'UNPAID' ? 'Thanh toán ngay' : 'Xem chi tiết'}
                </Button>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6">
                    <Title level={3} className="text-blue-700 m-0">
                        <DollarOutlined /> Hóa Đơn & Thanh Toán
                    </Title>
                </div>

                <Card className="shadow-sm">
                    <Table
                        dataSource={invoices}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: 'Bạn chưa có hóa đơn nào' }}
                    />
                </Card>
            </div>
        </DashboardLayout>
    );
}