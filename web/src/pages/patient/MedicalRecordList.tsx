import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Space, Typography, Tooltip } from 'antd';
import { EyeOutlined, FileTextOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { medicalRecordService } from '@/services/medical-record.service';

const { Title } = Typography;

export default function MedicalRecordList() {
    const navigate = useNavigate();

    const { data: records, isLoading } = useQuery({
        queryKey: ['my-medical-records'],
        queryFn: medicalRecordService.getMyRecords,
    });

    const columns = [
        {
            title: 'Ngày khám',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => (
                <div className="font-semibold text-blue-700">
                    {dayjs(date).format('DD/MM/YYYY')}
                    <div className="text-xs text-gray-400 font-normal">{dayjs(date).format('HH:mm')}</div>
                </div>
            ),
        },
        {
            title: 'Bác sĩ khám',
            key: 'doctor',
            render: (_: any, record: any) => (
                <div>
                    <div className="font-medium">{record.doctor?.user?.full_name}</div>
                    <Tag color="cyan" className="mt-1">{record.doctor?.specialization?.name}</Tag>
                </div>
            ),
        },
        {
            title: 'Chẩn đoán',
            dataIndex: 'diagnosis',
            key: 'diagnosis',
            render: (text: string) => (
                <div className="line-clamp-2" title={text}>{text}</div>
            )
        },
        {
            title: 'Đơn thuốc',
            key: 'prescription',
            align: 'center' as const,
            render: (_: any, record: any) => (
                record.prescriptions?.length > 0
                    ? <Tag color="green"><MedicineBoxOutlined /> Có thuốc</Tag>
                    : <Tag color="default">Không</Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Tooltip title="Xem chi tiết phiếu khám & đơn thuốc">
                    <Button
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/medical-records/${record.appointment_id}`)}
                    // Lưu ý: Route chi tiết chúng ta làm ở bài trước nhận vào appointment_id
                    >
                        Xem
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
                <div className="mb-6 flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <FileTextOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Hồ sơ bệnh án</Title>
                        <span className="text-gray-500">Lịch sử khám bệnh và đơn thuốc của bạn</span>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <Table
                        dataSource={records || []}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
        </div>
    );
}