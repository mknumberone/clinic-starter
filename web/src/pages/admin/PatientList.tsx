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
  InputNumber,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { patientService, type Patient } from '@/services/patient.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PatientList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [gender, setGender] = useState<string | undefined>();
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', page, limit, searchText, gender, minAge, maxAge],
    queryFn: () =>
      patientService.getPatients({
        page,
        limit,
        search: searchText || undefined,
        gender,
        minAge,
        maxAge,
      }),
  });

  if (error) {
    message.error('Không thể tải danh sách bệnh nhân');
  }

  const calculateAge = (dateOfBirth: string) => {
    return dayjs().diff(dayjs(dateOfBirth), 'year');
  };

  const columns = [
    {
      title: 'Mã BN',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Typography.Text code>{id.slice(0, 8)}</Typography.Text>
      ),
    },
    {
      title: 'Họ và tên',
      key: 'name',
      render: (_: unknown, record: Patient) => (
        <Space>
          <UserOutlined />
          <Typography.Text strong>{record.user.full_name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Số điện thoại',
      key: 'phone',
      render: (_: unknown, record: Patient) => (
        <Space>
          <PhoneOutlined />
          {record.user.phone}
        </Space>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      render: (gender: string) => (
        <Tag color={gender === 'male' ? 'blue' : 'pink'}>
          {gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác'}
        </Tag>
      ),
    },
    {
      title: 'Tuổi',
      dataIndex: 'date_of_birth',
      key: 'age',
      width: 80,
      render: (dob: string) => `${calculateAge(dob)} tuổi`,
    },
    {
      title: 'Nhóm máu',
      dataIndex: 'blood_group',
      key: 'blood_group',
      width: 100,
      render: (bloodGroup?: string) =>
        bloodGroup ? <Tag color="red">{bloodGroup}</Tag> : '-',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: Patient) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/patients/${record.id}`)}
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
          <Title level={2}>Quản lý Bệnh nhân</Title>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Tìm theo tên hoặc số điện thoại..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                placeholder="Giới tính"
                value={gender}
                onChange={setGender}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Col>
            <Col xs={12} md={4}>
              <InputNumber
                placeholder="Tuổi từ"
                value={minAge}
                onChange={(val) => setMinAge(val ?? undefined)}
                min={0}
                max={120}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} md={4}>
              <InputNumber
                placeholder="Tuổi đến"
                value={maxAge}
                onChange={(val) => setMaxAge(val ?? undefined)}
                min={0}
                max={120}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} md={4}>
              <Button
                type="default"
                onClick={() => {
                  setSearchText('');
                  setGender(undefined);
                  setMinAge(undefined);
                  setMaxAge(undefined);
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
              showTotal: (total) => `Tổng ${total} bệnh nhân`,
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
