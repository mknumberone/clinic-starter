import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  message,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { doctorService, type Doctor } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const { Title } = Typography;

export default function DoctorList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: specializations } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorService.getSpecializations(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['doctors', page, limit, searchText, specializationFilter],
    queryFn: () =>
      doctorService.getDoctors({
        page,
        limit,
        search: searchText || undefined,
        specialization: specializationFilter,
      }),
  });

  if (error) {
    message.error('Không thể tải danh sách bác sĩ');
  }

  const columns = [
    {
      title: 'Mã BS',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => (
        <Typography.Text code strong>
          {code}
        </Typography.Text>
      ),
    },
    {
      title: 'Họ và tên',
      key: 'name',
      render: (_: unknown, record: Doctor) => (
        <Space>
          <UserOutlined />
          <div>
            <Typography.Text strong>
              {record.title} {record.user.full_name}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      render: (_: unknown, record: Doctor) => (
        <Space>
          <PhoneOutlined />
          {record.user.phone}
        </Space>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      dataIndex: ['user', 'email'],
      render: (email?: string) => email || '-',
    },
    {
      title: 'Chuyên khoa',
      key: 'specializations',
      render: () => (
        <Tag icon={<MedicineBoxOutlined />} color="blue">
          Nội tổng quát
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: () => (
        <Badge status="success" text="Đang hoạt động" />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: Doctor) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/doctors/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Title level={2}>Quản lý Bác sĩ</Title>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={10}>
              <Input
                placeholder="Tìm theo tên hoặc mã bác sĩ..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Chọn chuyên khoa"
                value={specializationFilter}
                onChange={setSpecializationFilter}
                allowClear
                style={{ width: '100%' }}
              >
                {specializations?.map((spec) => (
                  <Select.Option key={spec.id} value={spec.id}>
                    {spec.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Button
                type="default"
                onClick={() => {
                  setSearchText('');
                  setSpecializationFilter(undefined);
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
              total: data?.pagination.total || 0,
              showTotal: (total) => `Tổng ${total} bác sĩ`,
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
