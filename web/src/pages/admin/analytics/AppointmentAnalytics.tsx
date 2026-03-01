import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, DatePicker, Select, Space, Spin, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { dashboardService } from '@/services/dashboard.service';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PRESETS: { label: string; getValue: () => [string, string] }[] = [
  { label: 'Hôm nay', getValue: () => [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  {
    label: '7 ngày qua',
    getValue: () => [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  },
  {
    label: 'Tháng này',
    getValue: () => [
      dayjs().startOf('month').format('YYYY-MM-DD'),
      dayjs().endOf('month').format('YYYY-MM-DD'),
    ],
  },
  {
    label: 'Năm nay',
    getValue: () => [
      dayjs().startOf('year').format('YYYY-MM-DD'),
      dayjs().endOf('year').format('YYYY-MM-DD'),
    ],
  },
];

export default function AppointmentAnalytics() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: appointmentsByDay, isLoading } = useQuery({
    queryKey: ['analytics-appointments-by-day', dateRange[0], dateRange[1]],
    queryFn: () =>
      dashboardService.getAdminAppointments({
        startDate: dateRange[0],
        endDate: dateRange[1],
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => dashboardService.getAdminStats(),
  });

  const totalInRange = (appointmentsByDay || []).reduce((sum, d) => sum + (d.count || 0), 0);

  return (
    <DashboardLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="flex flex-wrap items-center gap-4">
          <Text strong className="text-lg">
            Thống kê lịch hẹn
          </Text>
          <Select
            style={{ width: 140 }}
            placeholder="Khoảng thời gian"
            options={PRESETS.map((p) => ({ label: p.label, value: p.label }))}
            onChange={(label) => {
              const preset = PRESETS.find((p) => p.label === label);
              if (preset) setDateRange(preset.getValue());
            }}
          />
          <RangePicker
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(_, formatStrings) => {
              if (formatStrings?.[0] && formatStrings?.[1])
                setDateRange([formatStrings[0], formatStrings[1]]);
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" tip="Đang tải..." />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng lịch trong kỳ"
                    value={totalInRange}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Lịch hẹn hôm nay"
                    value={stats?.todayAppointments ?? 0}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Hoàn thành (tổng)"
                    value={stats?.appointmentByStatus?.COMPLETED ?? 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Đã hủy (tổng)"
                    value={stats?.appointmentByStatus?.CANCELLED ?? 0}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title={
                <span className="font-semibold flex items-center gap-2">
                  <CalendarOutlined /> Lịch hẹn theo ngày
                </span>
              }
            >
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={appointmentsByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value: number) => [value, 'Số lịch']}
                    labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#009CAA"
                    strokeWidth={2}
                    dot={{ fill: '#009CAA', r: 3 }}
                    name="Số lịch hẹn"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </Space>
    </DashboardLayout>
  );
}
