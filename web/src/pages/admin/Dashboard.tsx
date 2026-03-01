import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, DatePicker, Space, Spin, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  BankOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  BellOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../../services/dashboard.service';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Đã đặt',
  CONFIRMED: 'Xác nhận',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

const CHART_COLORS = ['#009CAA', '#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value) + ' ₫';
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats', dateRange],
    queryFn: () =>
      dashboardService.getAdminStats({
        startDate: dateRange[0],
        endDate: dateRange[1],
      }),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['adminAppointments', dateRange],
    queryFn: () =>
      dashboardService.getAdminAppointments({
        startDate: dateRange[0],
        endDate: dateRange[1],
      }),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['adminRevenue', dateRange],
    queryFn: () =>
      dashboardService.getAdminRevenue({
        startDate: dateRange[0],
        endDate: dateRange[1],
      }),
  });

  const { data: upcomingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: () => dashboardService.getAdminUpcomingAppointments(10),
  });

  const pieData =
    stats?.appointmentByStatus &&
    Object.entries(stats.appointmentByStatus).map(([status, count], idx) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));

  const statCards = [
    {
      title: 'Bệnh nhân',
      value: stats?.totalPatients ?? 0,
      icon: <UserOutlined />,
      color: '#10b981',
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      borderColor: '#10b981',
    },
    {
      title: 'Bác sĩ',
      value: stats?.totalDoctors ?? 0,
      icon: <TeamOutlined />,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      borderColor: '#3b82f6',
    },
    {
      title: 'Lịch hẹn hôm nay',
      value: stats?.todayAppointments ?? 0,
      icon: <CalendarOutlined />,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#f59e0b',
    },
    {
      title: 'Tổng lịch hẹn',
      value: stats?.totalAppointments ?? 0,
      icon: <RiseOutlined />,
      color: '#8b5cf6',
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderColor: '#8b5cf6',
    },
    {
      title: 'Doanh thu',
      value: stats?.totalRevenue ?? 0,
      icon: <DollarOutlined />,
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      borderColor: '#ef4444',
      formatter: (v: number) => formatVND(v),
    },
    {
      title: 'Hóa đơn chưa thanh toán',
      value: stats?.pendingInvoices ?? 0,
      icon: <FallOutlined />,
      color: '#f97316',
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      borderColor: '#f97316',
    },
    {
      title: 'Chi nhánh',
      value: stats?.totalBranches ?? 0,
      icon: <BankOutlined />,
      color: '#059669',
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
      borderColor: '#059669',
    },
    {
      title: 'Phòng khám',
      value: stats?.totalRooms ?? 0,
      icon: <HomeOutlined />,
      color: '#0ea5e9',
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
      borderColor: '#0ea5e9',
    },
    {
      title: 'Chuyên khoa',
      value: stats?.totalSpecializations ?? 0,
      icon: <MedicineBoxOutlined />,
      color: '#6366f1',
      bg: 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 100%)',
      borderColor: '#6366f1',
    },
    {
      title: 'Thuốc',
      value: stats?.totalMedications ?? 0,
      icon: <FileTextOutlined />,
      color: '#14b8a6',
      bg: 'linear-gradient(135deg, #f0fdfa 0%, #99f6e4 100%)',
      borderColor: '#14b8a6',
    },
    {
      title: 'Tin tức',
      value: stats?.totalNews ?? 0,
      icon: <BellOutlined />,
      color: '#ec4899',
      bg: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)',
      borderColor: '#ec4899',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header & Date Filter */}
        <Card className="rounded-lg shadow-sm border-slate-200" bodyStyle={{ padding: 20 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800 m-0">Tổng quan hệ thống</h1>
              <p className="text-slate-500 text-sm mt-1 m-0">Thống kê và theo dõi hoạt động phòng khám</p>
            </div>
            <Space>
              <span className="text-slate-600 font-medium">Khoảng thời gian:</span>
              <RangePicker
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([
                      dates[0]!.format('YYYY-MM-DD'),
                      dates[1]!.format('YYYY-MM-DD'),
                    ]);
                  }
                }}
                className="rounded-lg"
              />
            </Space>
          </div>
        </Card>

        {/* Statistics Cards */}
        {loadingStats ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {statCards.map((item, idx) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={idx}>
                  <Card
                    className="rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg"
                    style={{
                      borderColor: item.borderColor,
                      background: item.bg,
                    }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <Statistic
                      title={
                        <span className="font-medium text-slate-600">{item.title}</span>
                      }
                      value={item.formatter ? item.formatter(item.value) : item.value}
                      prefix={
                        <span style={{ color: item.color, fontSize: 20, marginRight: 8 }}>
                          {item.icon}
                        </span>
                      }
                      valueStyle={{
                        color: item.color,
                        fontWeight: 700,
                        fontSize: 22,
                      }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={<span className="font-semibold text-slate-800">Lịch hẹn theo ngày</span>}
                  className="rounded-lg shadow-sm border-slate-200"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={appointmentsData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [value + ' lịch hẹn', 'Số lịch hẹn']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#009CAA"
                        strokeWidth={2}
                        dot={{ fill: '#009CAA', r: 4 }}
                        name="Số lịch hẹn"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={<span className="font-semibold text-slate-800">Doanh thu theo ngày</span>}
                  className="rounded-lg shadow-sm border-slate-200"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [formatVND(value), 'Doanh thu']}
                      />
                      <Legend />
                      <Bar dataKey="amount" fill="#10b981" name="Doanh thu" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Pie Chart - Appointment by Status */}
            {pieData && pieData.length > 0 && (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card
                    title={<span className="font-semibold text-slate-800">Lịch hẹn theo trạng thái</span>}
                    className="rounded-lg shadow-sm border-slate-200"
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => [value + ' lịch hẹn', 'Số lượng']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card
                    title={<span className="font-semibold text-slate-800">Lịch hẹn sắp tới</span>}
                    className="rounded-lg shadow-sm border-slate-200"
                  >
                    <Table
                      dataSource={upcomingAppointments || []}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      scroll={{ x: 600 }}
                      columns={[
                        {
                          title: 'Bệnh nhân',
                          key: 'patientName',
                          render: (r: any) => r.patient?.user?.full_name || '-',
                        },
                        {
                          title: 'Bác sĩ',
                          key: 'doctorName',
                          render: (r: any) => r.doctor?.user?.full_name || '-',
                        },
                        {
                          title: 'Ngày',
                          key: 'date',
                          render: (r: any) =>
                            r.start_time
                              ? dayjs(r.start_time).format('DD/MM/YYYY')
                              : '-',
                        },
                        {
                          title: 'Giờ',
                          key: 'time',
                          render: (r: any) =>
                            r.start_time && r.end_time
                              ? `${dayjs(r.start_time).format('HH:mm')} - ${dayjs(r.end_time).format('HH:mm')}`
                              : '-',
                        },
                        {
                          title: 'Phòng',
                          key: 'room',
                          render: (r: any) => r.room?.name || r.room?.code || '-',
                        },
                        {
                          title: 'Trạng thái',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status: string) => {
                            const colorMap: Record<string, string> = {
                              SCHEDULED: 'blue',
                              CONFIRMED: 'green',
                              IN_PROGRESS: 'orange',
                              COMPLETED: 'default',
                              CANCELLED: 'red',
                              NO_SHOW: 'volcano',
                            };
                            return (
                              <Tag color={colorMap[status] || 'default'}>
                                {STATUS_LABELS[status] || status}
                              </Tag>
                            );
                          },
                        },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Full width upcoming table (fallback when no pie data) */}
            {(!pieData || pieData.length === 0) && (
              <Card
                title={<span className="font-semibold text-slate-800">Lịch hẹn sắp tới</span>}
                className="rounded-lg shadow-sm border-slate-200"
              >
                <Table
                  dataSource={upcomingAppointments || []}
                  rowKey="id"
                  columns={[
                    {
                      title: 'Bệnh nhân',
                      key: 'patientName',
                      render: (r: any) => r.patient?.user?.full_name || '-',
                    },
                    {
                      title: 'Bác sĩ',
                      key: 'doctorName',
                      render: (r: any) => r.doctor?.user?.full_name || '-',
                    },
                    {
                      title: 'Ngày',
                      key: 'date',
                      render: (r: any) =>
                        r.start_time ? dayjs(r.start_time).format('DD/MM/YYYY') : '-',
                    },
                    {
                      title: 'Giờ',
                      key: 'time',
                      render: (r: any) =>
                        r.start_time && r.end_time
                          ? `${dayjs(r.start_time).format('HH:mm')} - ${dayjs(r.end_time).format('HH:mm')}`
                          : '-',
                    },
                    {
                      title: 'Phòng',
                      key: 'room',
                      render: (r: any) => r.room?.name || r.room?.code || '-',
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => {
                        const colorMap: Record<string, string> = {
                          SCHEDULED: 'blue',
                          CONFIRMED: 'green',
                          IN_PROGRESS: 'orange',
                          COMPLETED: 'default',
                          CANCELLED: 'red',
                          NO_SHOW: 'volcano',
                        };
                        return (
                          <Tag color={colorMap[status] || 'default'}>
                            {STATUS_LABELS[status] || status}
                          </Tag>
                        );
                      },
                    },
                  ]}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
