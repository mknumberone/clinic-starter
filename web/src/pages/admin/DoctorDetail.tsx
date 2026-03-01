// File: src/pages/admin/DoctorDetail.tsx

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
import { appointmentService, type Appointment } from '@/services/appointment.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import EditDoctorModal from './components/EditDoctorModal';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id!),
    enabled: !!id,
    onError: () => {
      message.error('Không thể tải thông tin bác sĩ');
      navigate('/admin/doctors');
    },
  });

  const shifts = doctor?.shifts || [];

  const appointmentStatusConfig: Record<string, { color: string; text: string }> = {
    SCHEDULED: { color: 'blue', text: 'Đã đặt' },
    CONFIRMED: { color: 'cyan', text: 'Đã xác nhận' },
    IN_PROGRESS: { color: 'geekblue', text: 'Đang khám' },
    COMPLETED: { color: 'green', text: 'Hoàn thành' },
    CANCELLED: { color: 'red', text: 'Đã hủy' },
    NO_SHOW: { color: 'orange', text: 'Vắng mặt' },
  };

  const {
    data: doctorAppointments,
    isLoading: isAppointmentsLoading,
  } = useQuery({
    queryKey: ['doctor-appointments', id],
    enabled: !!id,
    queryFn: () =>
      appointmentService.getAppointments({
        doctorId: id!,
        page: 1,
        limit: 20,
      }),
  });

  const appointments: Appointment[] = doctorAppointments?.data || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) return null;

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
      dataIndex: 'start_time',
      key: 'day_of_week',
      render: (time: string) => <Tag color="blue">{dayOfWeekMap[dayjs(time).day()]}</Tag>,
    },
    {
      title: 'Ngày',
      dataIndex: 'start_time',
      key: 'date',
      render: (time: string) => dayjs(time).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ trực',
      key: 'time',
      render: (_: any, record: any) => (
        <span>{dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}</span>
      ),
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

  const appointmentColumns = [
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_: unknown, record: Appointment) => (
        <div>
          <Typography.Text strong>
            {record.patient?.user.full_name || 'Khách vãng lai'}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.patient?.user.phone}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: unknown, record: Appointment) => (
        <div>
          <div className="font-medium text-indigo-700">
            {dayjs(record.start_time).format('DD/MM/YYYY')}
          </div>
          <Typography.Text type="secondary">
            {dayjs(record.start_time).format('HH:mm')} -{' '}
            {dayjs(record.end_time).format('HH:mm')}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Phòng',
      key: 'room',
      render: (_: unknown, record: Appointment) =>
        record.room ? (
          <Tag>
            {record.room.code} - {record.room.name}
          </Tag>
        ) : (
          <span className="text-gray-400 italic">--</span>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = appointmentStatusConfig[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
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
          <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>
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
              label={<Space><UserOutlined /> Họ và tên</Space>}
            >
              <Typography.Text strong>
                {doctor.title} {doctor.user?.full_name}
              </Typography.Text>
            </Descriptions.Item>

            <Descriptions.Item label="Mã bác sĩ">
              <Typography.Text code strong>{doctor.code}</Typography.Text>
            </Descriptions.Item>

            <Descriptions.Item label={<Space><PhoneOutlined /> Số điện thoại</Space>}>
              {doctor.user?.phone}
            </Descriptions.Item>

            <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
              {doctor.user?.email || '-'}
            </Descriptions.Item>

            {/* --- PHẦN SỬA: HIỂN THỊ 1 CHUYÊN KHOA --- */}
            <Descriptions.Item
              label={<Space><MedicineBoxOutlined /> Chuyên khoa</Space>}
              span={2}
            >
              {doctor.specialization ? (
                <Tag color="blue" icon={<MedicineBoxOutlined />}>
                  {doctor.specialization.name}
                </Tag>
              ) : (
                <Tag>Chưa phân khoa</Tag>
              )}
            </Descriptions.Item>
            {/* ---------------------------------------- */}

            <Descriptions.Item label="Tiểu sử" span={2}>
              {doctor.biography || 'Chưa có thông tin'}
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian khám TB">
              {doctor.average_time ? `${doctor.average_time} phút/ca` : '30 phút (Mặc định)'}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {dayjs(doctor.created_at).format('DD/MM/YYYY HH:mm')}
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
                  <span><ClockCircleOutlined /> Lịch trực</span>
                ),
                children: (
                  <Table
                    columns={shiftColumns}
                    dataSource={shifts}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: 'Chưa có lịch trực' }}
                  />
                ),
              },
              {
                key: 'appointments',
                label: (
                  <span><CalendarOutlined /> Lịch hẹn</span>
                ),
                children: (
                  <Table
                    columns={appointmentColumns}
                    dataSource={appointments}
                    rowKey="id"
                    loading={isAppointmentsLoading}
                    pagination={false}
                    locale={{ emptyText: 'Chưa có lịch hẹn' }}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>

      <EditDoctorModal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        doctorData={doctor}
      />
    </DashboardLayout>
  );
}