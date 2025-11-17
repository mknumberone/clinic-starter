import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Table,
  Tag,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  MedicineBoxOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { prescriptionService, type PrescriptionItem } from '@/services/prescription.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionService.getPrescriptionById(id!),
    enabled: !!id,
    onError: () => {
      message.error('Không thể tải thông tin đơn thuốc');
      navigate('/admin/prescriptions');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!prescription) {
    return null;
  }

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Tên thuốc',
      key: 'name',
      render: (_: unknown, record: PrescriptionItem) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.medication?.code} - {record.medication?.form}
          </Text>
        </div>
      ),
    },
    {
      title: 'Liều lượng',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: 'Tần suất',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Hướng dẫn',
      dataIndex: 'instructions',
      key: 'instructions',
      ellipsis: true,
      render: (instructions?: string) => instructions || '-',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Chi tiết Đơn thuốc
            </Title>
          </Space>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            In đơn thuốc
          </Button>
        </div>

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <Space>
              <MedicineBoxOutlined style={{ fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Đơn thuốc #{prescription.id.slice(0, 8)}
                </Text>
                <br />
                <Text type="secondary">
                  Ngày kê đơn: {dayjs(prescription.created_at).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined /> Bệnh nhân
                </Space>
              }
            >
              <div>
                <Text strong>{prescription.patient?.user.full_name}</Text>
                <br />
                <Text type="secondary">{prescription.patient?.user.phone}</Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ kê đơn">
              <Text strong>
                {prescription.doctor?.title} {prescription.doctor?.user.full_name}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán" span={2}>
              {prescription.diagnosis || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {prescription.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <MedicineBoxOutlined />
              Danh sách thuốc ({prescription.items?.length || 0} loại)
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={prescription.items || []}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
