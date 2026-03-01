import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, DatePicker, Select, Space, Spin, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { analyticsService } from '@/services/analytics.service';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PRESETS: { label: string; getValue: () => [string, string] }[] = [
  { label: '6 tháng qua', getValue: () => [dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { label: 'Năm nay', getValue: () => [dayjs().startOf('year').format('YYYY-MM-DD'), dayjs().endOf('year').format('YYYY-MM-DD')] },
];

export default function PatientAnalytics() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: byMonth, isLoading } = useQuery({
    queryKey: ['analytics-patients-by-month', dateRange[0], dateRange[1]],
    queryFn: () => analyticsService.getPatientsByMonth({ startDate: dateRange[0], endDate: dateRange[1] }),
  });

  const total = (byMonth || []).reduce((sum, d) => sum + d.count, 0);

  return (
    <DashboardLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="flex flex-wrap items-center gap-4">
          <Text strong className="text-lg">
            Thống kê bệnh nhân
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
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <UserOutlined className="text-2xl text-blue-500" />
                <div>
                  <Text type="secondary">Bệnh nhân mới trong kỳ</Text>
                  <div className="text-2xl font-semibold">{total}</div>
                </div>
              </div>
            </Card>
            <Card title={<span className="font-semibold">Bệnh nhân mới theo tháng</span>}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Số bệnh nhân']}
                    labelFormatter={(label) => dayjs(label + '-01').format('MM/YYYY')}
                  />
                  <Bar dataKey="count" fill="#1890ff" name="Bệnh nhân mới" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </Space>
    </DashboardLayout>
  );
}
