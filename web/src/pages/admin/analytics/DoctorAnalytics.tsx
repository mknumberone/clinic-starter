import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, DatePicker, Select, Space, Spin, Table, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { analyticsService } from '@/services/analytics.service';
import { useBranchStore } from '@/stores/branchStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PRESETS: { label: string; getValue: () => [string, string] }[] = [
  { label: '7 ngày qua', getValue: () => [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] },
  { label: 'Tháng này', getValue: () => [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().endOf('month').format('YYYY-MM-DD')] },
  { label: 'Năm nay', getValue: () => [dayjs().startOf('year').format('YYYY-MM-DD'), dayjs().endOf('year').format('YYYY-MM-DD')] },
];

export default function DoctorAnalytics() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const { branches, selectedBranch, selectBranch, clearBranch } = useBranchStore();
  const branchId = selectedBranch?.id;

  const params = { startDate: dateRange[0], endDate: dateRange[1], branchId };

  const { data: byDoctor, isLoading } = useQuery({
    queryKey: ['analytics-appointments-by-doctor', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getAppointmentsByDoctor(params),
  });

  const columns = [
    { title: 'Bác sĩ', dataIndex: 'doctorName' },
    { title: 'Chuyên khoa', dataIndex: 'specializationName' },
    { title: 'Số lịch hẹn', dataIndex: 'count', align: 'right' as const },
  ];

  return (
    <DashboardLayout>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="flex flex-wrap items-center gap-4">
          <Text strong className="text-lg">
            Thống kê lịch hẹn theo bác sĩ
          </Text>
              <Select
                style={{ width: 160 }}
                placeholder="Chi nhánh"
                allowClear
                value={branchId}
                onChange={(v) => (v ? selectBranch(v) : clearBranch())}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
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
              <div className="flex items-center gap-2">
                <TeamOutlined className="text-2xl text-green-500" />
                <div>
                  <Text type="secondary">Tổng lịch hẹn trong kỳ</Text>
                  <div className="text-2xl font-semibold">
                    {(byDoctor || []).reduce((s, d) => s + d.count, 0)}
                  </div>
                </div>
              </div>
            </Card>
            <Card title={<span className="font-semibold">Biểu đồ lịch hẹn theo bác sĩ</span>}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={(byDoctor || []).slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="doctorName" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [value, 'Số lịch']} />
                  <Bar dataKey="count" fill="#52c41a" name="Lịch hẹn" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title={<span className="font-semibold">Bảng chi tiết</span>}>
              <Table
                rowKey="doctorId"
                dataSource={byDoctor || []}
                columns={columns}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </>
        )}
      </Space>
    </DashboardLayout>
  );
}
