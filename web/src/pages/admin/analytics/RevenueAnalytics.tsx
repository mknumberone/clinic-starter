import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, DatePicker, Select, Space, Spin, Typography } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
  BankOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { analyticsService } from '@/services/analytics.service';
import { useBranchStore } from '@/stores/branchStore';
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

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' ₫';
}

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const { branches, selectedBranch, selectBranch, clearBranch } = useBranchStore();
  const branchId = selectedBranch?.id;

  const queryParams = { startDate: dateRange[0], endDate: dateRange[1], branchId };

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-revenue-summary', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getRevenueSummary(queryParams),
  });

  const { data: byDay, isLoading: loadingByDay } = useQuery({
    queryKey: ['analytics-revenue-by-day', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getRevenueByDay(queryParams),
  });

  const { data: byBranch } = useQuery({
    queryKey: ['analytics-revenue-by-branch', dateRange[0], dateRange[1]],
    queryFn: () => analyticsService.getRevenueByBranch({ startDate: dateRange[0], endDate: dateRange[1] }),
    enabled: !branchId,
  });

  const { data: byDoctor } = useQuery({
    queryKey: ['analytics-revenue-by-doctor', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getRevenueByDoctor(queryParams),
  });

  const { data: bySpec } = useQuery({
    queryKey: ['analytics-revenue-by-spec', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getRevenueBySpecialization(queryParams),
  });

  const loading = loadingSummary || loadingByDay;

  return (
    <DashboardLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="flex flex-wrap items-center gap-4">
          <Text strong className="text-lg">Thống kê doanh thu</Text>
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
          <Select
            style={{ minWidth: 180 }}
            placeholder="Tất cả chi nhánh"
            allowClear
            value={branchId || undefined}
            options={branches.map((b) => ({ label: b.name, value: b.id }))}
            onChange={(v) => (v ? selectBranch(v) : clearBranch())}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" tip="Đang tải..." />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng doanh thu"
                    value={summary?.totalRevenue ?? 0}
                    prefix={<DollarOutlined />}
                    formatter={(v) => formatVND(Number(v))}
                    valueStyle={{ color: '#009CAA' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Số giao dịch"
                    value={summary?.paymentCount ?? 0}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Trung bình / ngày"
                    value={summary?.avgPerDay ?? 0}
                    prefix={<DollarOutlined />}
                    formatter={(v) => formatVND(Number(v))}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="So với kỳ trước"
                    value={summary?.changePercent ?? 0}
                    prefix={
                      (summary?.changePercent ?? 0) >= 0 ? (
                        <RiseOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <FallOutlined style={{ color: '#ff4d4f' }} />
                      )
                    }
                    suffix="%"
                    valueStyle={{
                      color: (summary?.changePercent ?? 0) >= 0 ? '#52c41a' : '#ff4d4f',
                    }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span className="font-semibold flex items-center gap-2">
                      <DollarOutlined /> Doanh thu theo ngày
                    </span>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={byDay || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        formatter={(value: number) => [formatVND(value), 'Doanh thu']}
                        labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#009CAA"
                        strokeWidth={2}
                        dot={{ fill: '#009CAA', r: 3 }}
                        name="Doanh thu"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span className="font-semibold flex items-center gap-2">
                      <BankOutlined /> Doanh thu theo chi nhánh
                    </span>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(byBranch || []).map((b) => ({ name: b.branchName, amount: b.amount }))}
                      layout="vertical"
                      margin={{ left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number) => [formatVND(value), 'Doanh thu']} />
                      <Bar dataKey="amount" fill="#1890ff" name="Doanh thu" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span className="font-semibold flex items-center gap-2">
                      <TeamOutlined /> Doanh thu theo bác sĩ
                    </span>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(byDoctor || []).slice(0, 10).map((d) => ({
                        name: d.doctorName.length > 15 ? d.doctorName.slice(0, 15) + '…' : d.doctorName,
                        amount: d.amount,
                        fullName: d.doctorName,
                      }))}
                      margin={{ bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        formatter={(value: number) => [formatVND(value), 'Doanh thu']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                      />
                      <Bar dataKey="amount" fill="#52c41a" name="Doanh thu" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span className="font-semibold flex items-center gap-2">
                      <MedicineBoxOutlined /> Doanh thu theo chuyên khoa
                    </span>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(bySpec || []).map((s) => ({ name: s.specializationName, amount: s.amount }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip formatter={(value: number) => [formatVND(value), 'Doanh thu']} />
                      <Bar dataKey="amount" fill="#722ed1" name="Doanh thu" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </DashboardLayout>
  );
}
