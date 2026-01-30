import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Typography, Space } from 'antd';
import { EyeOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PatientPrescriptionList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Gọi API lấy danh sách đơn thuốc của bệnh nhân
    const { data: prescriptions, isLoading } = useQuery({
        queryKey: ['my-prescriptions', user.patient_id],
        queryFn: async () => {
            if (!user.patient_id) return [];
            // API này đã có sẵn trong PatientsController
            const res = await axiosInstance.get(`/patients/${user.patient_id}/prescriptions`);
            return res.data;
        },
        enabled: !!user.patient_id
    });

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            width: 100,
            render: (id: string) => <Tag>{id.slice(0, 8).toUpperCase()}</Tag>
        },
        {
            title: 'Ngày khám',
            dataIndex: 'created_at',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY')
        },
        {
            title: 'Bác sĩ',
            dataIndex: ['doctor', 'user', 'full_name'], // Truy cập nested object
            render: (name: string) => <span className="font-medium">{name}</span>
        },
        {
            title: 'Chẩn đoán / Ghi chú',
            dataIndex: 'notes',
            ellipsis: true
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/patient/prescriptions/${record.id}`)}
                >
                    Xem chi tiết
                </Button>
            )
        }
    ];

    return (
        <div>
                <div className="mb-6">
                    <Title level={3} className="text-blue-700 m-0">
                        <MedicineBoxOutlined /> Đơn Thuốc Của Tôi
                    </Title>
                </div>

                <Card className="shadow-sm">
                    <Table
                        dataSource={prescriptions}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: 'Bạn chưa có đơn thuốc nào' }}
                    />
                </Card>
        </div>
    );
}