import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  message,
  Dropdown,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { appointmentService, type Appointment } from '@/services/appointment.service';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function AppointmentList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data: doctors } = useQuery({
    queryKey: ['doctors-simple'],
    queryFn: () => doctorService.getDoctors({ limit: 100 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', page, limit, status, doctorId, dateRange],
    queryFn: () =>
      appointmentService.getAppointments({
        page,
        limit,
        status,
        doctorId,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  });

  useEffect(() => {
    if (error) {
      console.error('Appointment fetch error:', error);
      message.error('Không thể tải danh sách lịch hẹn. Vui lòng kiểm tra kết nối backend.');
    }
  }, [error]);

  const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
    scheduled: { color: 'blue', text: 'Đã đặt', icon: <CalendarOutlined /> },
    confirmed: { color: 'cyan', text: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
    completed: { color: 'green', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'red', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
    no_show: { color: 'orange', text: 'Vắng mặt', icon: <CloseCircleOutlined /> },
  };

  const columns = [
    {
      title: 'Mã lịch hẹn',
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
      render: (_: unknown, record: Appointment) => (
        <div>
          <Typography.Text strong>
            {record.patient?.user.full_name || 'N/A'}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.patient?.user.phone}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_: unknown, record: Appointment) => (
        <div>
          <Typography.Text strong>
            {record.doctor?.title} {record.doctor?.user.full_name || 'Chưa phân công'}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.doctor?.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: unknown, record: Appointment) => (
        <div>
          <div>{dayjs(record.start_time).format('DD/MM/YYYY')}</div>
          <Typography.Text type="secondary">
            {dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Phòng',
      key: 'room',
      render: (_: unknown, record: Appointment) => (
        <Space>
          <Tag>{record.room?.code}</Tag>
          {record.room?.name}
        </Space>
      ),
    },
    {
      title: 'Loại khám',
      dataIndex: 'appointment_type',
      key: 'appointment_type',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status, icon: null };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: Appointment) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'Xem chi tiết',
                icon: <EyeOutlined />,
                onClick: () => navigate(`/admin/appointments/${record.id}`),
              },
              {
                key: 'confirm',
                label: 'Xác nhận',
                icon: <CheckCircleOutlined />,
                disabled: record.status !== 'scheduled',
              },
              {
                key: 'complete',
                label: 'Hoàn thành',
                icon: <CheckCircleOutlined />,
                disabled: record.status !== 'confirmed',
              },
              {
                key: 'cancel',
                label: 'Hủy lịch',
                icon: <CloseCircleOutlined />,
                danger: true,
                disabled: ['completed', 'cancelled'].includes(record.status),
              },
            ],
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2}>Quản lý Lịch hẹn</Title>
          <Space>
            <Button
              icon={<CalendarOutlined />}
              onClick={() => navigate('/admin/appointments/calendar')}
            >
              Xem lịch
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/admin/appointments/new')}
            >
              Đặt lịch mới
            </Button>
          </Space>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Select
                placeholder="Trạng thái"
                value={status}
                onChange={setStatus}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="scheduled">Đã đặt</Select.Option>
                <Select.Option value="confirmed">Đã xác nhận</Select.Option>
                <Select.Option value="completed">Hoàn thành</Select.Option>
                <Select.Option value="cancelled">Đã hủy</Select.Option>
                <Select.Option value="no_show">Vắng mặt</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
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
            <Col xs={24} md={8}>
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={2}>
              <Button
                onClick={() => {
                  setStatus(undefined);
                  setDoctorId(undefined);
                  setDateRange(null);
                }}
                block
              >
                Xóa
              </Button>
            </Col>
          </Row>
        </Card>

        {!!error && (
          <Alert
            message="Lỗi kết nối"
            description="Không thể tải dữ liệu từ server. Vui lòng đảm bảo backend đang chạy tại http://localhost:3000"
            type="error"
            showIcon
            className="mb-4"
          />
        )}

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
              showTotal: (total) => `Tổng ${total} lịch hẹn`,
              showSizeChanger: true,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setLimit(newPageSize);
              },
            }}
            scroll={{ x: 1400 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
