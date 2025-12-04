import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  UserDeleteOutlined, // Icon cho Vắng mặt
  SyncOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { appointmentService, type Appointment } from '@/services/appointment.service';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function AppointmentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore(); // Lấy thông tin user để phân quyền

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // --- QUERIES ---
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
        status, // Backend mong đợi chữ HOA (SCHEDULED), Select ở dưới đã sửa value
        doctorId,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  });

  // --- MUTATION: Đổi trạng thái ---
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentService.changeStatus(id, status),
    onSuccess: () => {
      message.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => message.error('Không thể cập nhật trạng thái'),
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    changeStatusMutation.mutate({ id, status: newStatus });
  };

  useEffect(() => {
    if (error) {
      console.error('Appointment fetch error:', error);
      message.error('Không thể tải danh sách lịch hẹn.');
    }
  }, [error]);

  // --- CONFIG HIỂN THỊ TRẠNG THÁI (Key phải là CHỮ HOA để khớp DB) ---
  const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
    SCHEDULED: { color: 'blue', text: 'Đã đặt', icon: <CalendarOutlined /> },
    CONFIRMED: { color: 'cyan', text: 'Đã xác nhận', icon: <CheckCircleOutlined /> },
    IN_PROGRESS: { color: 'geekblue', text: 'Đang khám', icon: <SyncOutlined spin /> },
    COMPLETED: { color: 'green', text: 'Hoàn thành', icon: <CheckCircleOutlined /> },
    CANCELLED: { color: 'red', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
    NO_SHOW: { color: 'orange', text: 'Vắng mặt', icon: <UserDeleteOutlined /> },
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id: string) => (
        <Typography.Text code copyable>{id.slice(0, 8).toUpperCase()}</Typography.Text>
      ),
    },
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
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_: unknown, record: Appointment) => (
        <div>
          <Typography.Text strong>
            {record.doctor?.title} {record.doctor?.user.full_name || 'Chưa phân công'}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.doctor?.specialization?.name}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: unknown, record: Appointment) => (
        <div>
          <div className="font-medium text-indigo-700">{dayjs(record.start_time).format('DD/MM/YYYY')}</div>
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
        record.room ? (
          <Tag>{record.room.code} - {record.room.name}</Tag>
        ) : <span className="text-gray-400 italic">--</span>
      ),
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
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: Appointment) => {
        // --- LOGIC TRẠNG THÁI MỚI (LINH HOẠT HƠN) ---
        const s = record.status; // SCHEDULED, CONFIRMED...

        // Điều kiện để hiện các nút
        const canConfirm = s === 'SCHEDULED';
        const canComplete = s === 'CONFIRMED' || s === 'IN_PROGRESS';
        // Có thể hủy hoặc đánh vắng mặt nếu chưa hoàn thành/đã hủy
        const canCancelOrNoShow = !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(s);

        const items = [
          {
            key: 'view',
            label: 'Xem chi tiết',
            icon: <EyeOutlined />,
            onClick: () => {
              // Nếu là Admin -> xem trang admin
              // Nếu là Doctor -> xem trang patient detail (giao diện đẹp hơn)
              const path = user?.role === 'DOCTOR'
                ? `/patient/appointments/${record.id}`
                : `/admin/appointments/${record.id}`;
              navigate(path);
            },
          },
          { type: 'divider' },
          {
            key: 'confirm',
            label: 'Xác nhận',
            icon: <CheckCircleOutlined className="text-blue-500" />,
            disabled: !canConfirm,
            onClick: () => handleStatusChange(record.id, 'CONFIRMED'),
          },
          // Trong mảng items của Dropdown menu:
          {
            key: 'examine',
            label: 'Khám bệnh',
            icon: <MedicineBoxOutlined className="text-indigo-600" />,
            // Chỉ hiện khi trạng thái là CONFIRMED hoặc IN_PROGRESS
            disabled: !['CONFIRMED', 'IN_PROGRESS'].includes(record.status),
            onClick: () => navigate(`/doctor/examination/${record.id}`),
          },
          {
            key: 'complete',
            label: 'Hoàn thành',
            icon: <CheckCircleOutlined className="text-green-500" />,
            disabled: !canComplete,
            onClick: () => handleStatusChange(record.id, 'COMPLETED'),
          },
          {
            key: 'no_show',
            label: 'Vắng mặt',
            icon: <UserDeleteOutlined className="text-orange-500" />,
            disabled: !canCancelOrNoShow,
            onClick: () => handleStatusChange(record.id, 'NO_SHOW'),
          },
          {
            key: 'cancel',
            label: 'Hủy lịch',
            icon: <CloseCircleOutlined className="text-red-500" />,
            danger: true,
            disabled: !canCancelOrNoShow,
            onClick: () => handleStatusChange(record.id, 'CANCELLED'),
          },
        ];

        return (
          <Dropdown menu={{ items: items as any }} trigger={['click']} placement="bottomRight">
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2} style={{ margin: 0 }}>Quản lý Lịch hẹn</Title>
          <Space>
            {user?.role === 'ADMIN' && (
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/admin/appointments/new')}
              >
                Đặt lịch mới
              </Button>
            )}
          </Space>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                value={status}
                onChange={setStatus}
                allowClear
                style={{ width: '100%' }}
              >
                {/* SỬA VALUE THÀNH CHỮ HOA ĐỂ KHỚP BACKEND */}
                <Select.Option value="SCHEDULED">Đã đặt</Select.Option>
                <Select.Option value="CONFIRMED">Đã xác nhận</Select.Option>
                <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
                <Select.Option value="CANCELLED">Đã hủy</Select.Option>
                <Select.Option value="NO_SHOW">Vắng mặt</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Lọc theo bác sĩ"
                value={doctorId}
                onChange={setDoctorId}
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {doctors?.data.map((doctor) => (
                  <Select.Option key={doctor.id} value={doctor.id}>
                    {doctor.title} {doctor.user.full_name}
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
            description="Không thể tải dữ liệu. Vui lòng thử lại sau."
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.pagination?.total || 0,
              showTotal: (total) => `Tổng ${total} bản ghi`,
              showSizeChanger: true,
              onChange: (p, l) => {
                setPage(p);
                setLimit(l);
              },
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}