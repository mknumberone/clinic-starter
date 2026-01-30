import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, DatePicker, Space, Avatar, Spin } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  DollarOutlined,
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../services/dashboard.service';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: stats } = useQuery({
    queryKey: ['adminStats', dateRange],
    queryFn: () => dashboardService.getAdminStats({
      startDate: dateRange[0],
      endDate: dateRange[1],
    }),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['adminAppointments', dateRange],
    queryFn: () => dashboardService.getAdminAppointments({
      startDate: dateRange[0],
      endDate: dateRange[1],
    }),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['adminRevenue', dateRange],
    queryFn: () => dashboardService.getAdminRevenue({
      startDate: dateRange[0],
      endDate: dateRange[1],
    }),
  });

  const { data: upcomingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: () => dashboardService.getAdminUpcomingAppointments(10),
  });

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Date Range Filter */}
        <Card>
          <Space>
            <span>Khoảng thời gian:</span>
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
              />
            </Space>
          </Card>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng bệnh nhân"
                  value={stats?.totalPatients || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng bác sĩ"
                  value={stats?.totalDoctors || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Lịch hẹn"
                  value={stats?.totalAppointments || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Doanh thu"
                  value={stats?.totalRevenue || 0}
                  prefix={<DollarOutlined />}
                  precision={0}
                  suffix="₫"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Lịch hẹn theo ngày">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={appointmentsData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Số lịch hẹn" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Doanh thu theo ngày">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#82ca9d" name="Doanh thu (₫)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Appointments Table */}
          <Card title="Lịch hẹn sắp tới">
            <Table
              dataSource={upcomingAppointments || []}
              rowKey="id"
              columns={[
                {
                  title: 'Bệnh nhân',
                  dataIndex: ['patient', 'user', 'name'],
                  key: 'patientName',
                },
                {
                  title: 'Bác sĩ',
                  dataIndex: ['doctor', 'user', 'name'],
                  key: 'doctorName',
                },
                {
                  title: 'Ngày',
                  dataIndex: 'appointmentDate',
                  key: 'date',
                  render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
                },
                {
                  title: 'Giờ',
                  key: 'time',
                  render: (record: any) => `${record.startTime} - ${record.endTime}`,
                },
                {
                  title: 'Phòng',
                  dataIndex: ['room', 'roomNumber'],
                  key: 'room',
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      SCHEDULED: 'blue',
                      CONFIRMED: 'green',
                      IN_PROGRESS: 'orange',
                      COMPLETED: 'gray',
                      CANCELLED: 'red',
                    };
                    return <span style={{ color: colors[status] }}>{status}</span>;
                  },
                },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Space>
    </DashboardLayout>
  );
}
