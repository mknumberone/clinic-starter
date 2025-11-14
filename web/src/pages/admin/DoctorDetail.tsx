import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Tabs,
  Table,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id!),
    enabled: !!id,
    onError: () => {
      message.error('Không thể tải thông tin bác sĩ');
      navigate('/admin/doctors');
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ['doctor-shifts', id],
    queryFn: () => doctorService.getDoctorShifts(id!),
    enabled: !!id,
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

  if (!doctor) {
    return null;
  }

  const dayOfWeekMap: Record<number, string> = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
  };

  const shiftColumns = [
    {
      title: 'Thứ',
      dataIndex: 'day_of_week',
      key: 'day_of_week',
      render: (day: number) => <Tag color="blue">{dayOfWeekMap[day]}</Tag>,
    },
    {
      title: 'Giờ bắt đầu',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Giờ kết thúc',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Phòng khám',
      key: 'room',
      render: (_: unknown, record: any) => (
        <Space>
          <Tag>{record.room?.code}</Tag>
          {record.room?.name}
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Hồ sơ Bác sĩ
            </Title>
          </Space>
          <Button type="primary" icon={<EditOutlined />}>
            Chỉnh sửa
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Tổng lượt khám"
                value={doctor.appointmentStats?.total || 0}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={doctor.appointmentStats?.completed || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Sắp tới"
                value={doctor.appointmentStats?.upcoming || 0}
                prefix={<SyncOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card className="mb-4">
          <Descriptions
            title="Thông tin cá nhân"
            bordered
            column={{ xs: 1, sm: 2, md: 2 }}
          >
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined /> Họ và tên
                </Space>
              }
            >
              <Typography.Text strong>
                {doctor.title} {doctor.user.full_name}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã bác sĩ">
              <Typography.Text code strong>
                {doctor.code}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <PhoneOutlined /> Số điện thoại
                </Space>
              }
            >
              {doctor.user.phone}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <MailOutlined /> Email
                </Space>
              }
            >
              {doctor.user.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <MedicineBoxOutlined /> Chuyên khoa
                </Space>
              }
              span={2}
            >
              {doctor.specializations && doctor.specializations.length > 0 ? (
                <Space wrap>
                  {doctor.specializations.map((spec) => (
                    <Tag key={spec.id} color="blue" icon={<MedicineBoxOutlined />}>
                      {spec.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Tag>Chưa có chuyên khoa</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tiểu sử" span={2}>
              {doctor.biography || 'Chưa có thông tin'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(doctor.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {dayjs(doctor.updated_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card>
          <Tabs
            defaultActiveKey="shifts"
            items={[
              {
                key: 'shifts',
                label: (
                  <span>
                    <ClockCircleOutlined /> Lịch trực
                  </span>
                ),
                children: (
                  <Table
                    columns={shiftColumns}
                    dataSource={shifts || []}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: 'Chưa có lịch trực' }}
                  />
                ),
              },
              {
                key: 'appointments',
                label: (
                  <span>
                    <CalendarOutlined /> Lịch hẹn
                  </span>
                ),
                children: <div>Danh sách lịch hẹn sẽ hiển thị ở đây</div>,
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
