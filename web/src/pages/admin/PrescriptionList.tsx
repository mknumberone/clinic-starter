import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Tag,
  message,
} from 'antd';
import {
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { prescriptionService, type Prescription } from '@/services/prescription.service';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function PrescriptionList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data: doctors } = useQuery({
    queryKey: ['doctors-simple'],
    queryFn: () => doctorService.getDoctors({ limit: 100 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['prescriptions', page, limit, doctorId, dateRange],
    queryFn: () =>
      prescriptionService.getPrescriptions({
        page,
        limit,
        doctorId,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  });

  if (error) {
    message.error('Không thể tải danh sách đơn thuốc');
  }

  const columns = [
    {
      title: 'Mã đơn thuốc',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Typography.Text code>{id.slice(0, 8)}</Typography.Text>
      ),
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_: unknown, record: Prescription) => (
        <div>
          <Text strong>{record.patient?.user.full_name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.patient?.user.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Bác sĩ kê đơn',
      key: 'doctor',
      render: (_: unknown, record: Prescription) => (
        <div>
          <Text strong>
            {record.doctor?.title} {record.doctor?.user.full_name || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày kê đơn',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
      render: (diagnosis?: string) => diagnosis || '-',
    },
    {
      title: 'Số loại thuốc',
      key: 'itemsCount',
      width: 120,
      render: (_: unknown, record: Prescription) => (
        <Tag icon={<MedicineBoxOutlined />} color="blue">
          {record.items?.length || 0} loại
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: Prescription) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/prescriptions/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2}>Quản lý Đơn thuốc</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/prescriptions/new')}
          >
            Tạo đơn thuốc
          </Button>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <Select
                placeholder="Chọn bác sĩ"
                value={doctorId}
                onChange={setDoctorId}
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {doctors?.data.map((doctor) => (
                  <Select.Option key={doctor.id} value={doctor.id}>
                    {doctor.title} {doctor.user.full_name} ({doctor.code})
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={10}>
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Button
                onClick={() => {
                  setDoctorId(undefined);
                  setDateRange(null);
                }}
                block
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.pagination?.total || 0,
              showTotal: (total) => `Tổng ${total} đơn thuốc`,
              showSizeChanger: true,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setLimit(newPageSize);
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
