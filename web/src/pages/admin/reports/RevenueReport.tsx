import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, DatePicker, Button, Space, Table, Typography, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, DollarOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { analyticsService } from '@/services/analytics.service';
import { useBranchStore } from '@/stores/branchStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' ₫';
}

export default function RevenueReport() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const { selectedBranch } = useBranchStore();
  const branchId = selectedBranch?.id;

  const params = { startDate: dateRange[0], endDate: dateRange[1], branchId };

  const { data: byDay, isLoading } = useQuery({
    queryKey: ['report-revenue-by-day', dateRange[0], dateRange[1], branchId],
    queryFn: () => analyticsService.getRevenueByDay(params),
  });

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Doanh thu',
      dataIndex: 'amount',
      align: 'right' as const,
      render: (v: number) => formatVND(v),
    },
  ];

  const handleExportExcel = () => {
    if (!byDay || byDay.length === 0) {
      message.info('Không có dữ liệu để xuất.');
      return;
    }
    const header = 'Ngay,Doanh thu\n';
    const rows = byDay
      .map((r) => `${dayjs(r.date).format('YYYY-MM-DD')},${r.amount}`)
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-doanh-thu-${dateRange[0]}-den-${dateRange[1]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!byDay || byDay.length === 0) {
      message.info('Không có dữ liệu để xuất.');
      return;
    }
    const rows = byDay
      .map(
        (r) =>
          `<tr><td>${dayjs(r.date).format('DD/MM/YYYY')}</td><td style="text-align:right">${formatVND(r.amount)}</td></tr>`,
      )
      .join('');
    const totalRow = `<tr style="font-weight:bold"><td>Tổng cộng</td><td style="text-align:right">${formatVND(total)}</td></tr>`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Báo cáo doanh thu ${dateRange[0]} - ${dateRange[1]}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 18px; margin-bottom: 8px; }
    .meta { color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Báo cáo doanh thu</h1>
  <p class="meta">Từ ${dayjs(dateRange[0]).format('DD/MM/YYYY')} đến ${dayjs(dateRange[1]).format('DD/MM/YYYY')}</p>
  <table>
    <thead><tr><th>Ngày</th><th style="text-align:right">Doanh thu</th></tr></thead>
    <tbody>${rows}${totalRow}</tbody>
  </table>
</body>
</html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        w.print();
        w.onafterprint = () => w.close();
      }, 250);
    } else {
      message.warning('Vui lòng cho phép popup để xuất PDF.');
    }
  };

  const total = (byDay || []).reduce((sum, r) => sum + r.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6">
        <Row justify="space-between" align="middle" className="mb-4">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Báo cáo doanh thu
            </Title>
            <Text type="secondary">
              Khoảng thời gian: {dayjs(dateRange[0]).format('DD/MM/YYYY')} –{' '}
              {dayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Text>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={(_, formatStrings) => {
                  if (formatStrings?.[0] && formatStrings?.[1]) {
                    setDateRange([formatStrings[0], formatStrings[1]]);
                  }
                }}
              />
              <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                Xuất Excel (CSV)
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
                Xuất PDF
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Text type="secondary">Tổng doanh thu</Text>
              <div className="text-xl font-semibold mt-1">
                <DollarOutlined className="mr-2" />
                {formatVND(total)}
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            rowKey="date"
            loading={isLoading}
            dataSource={byDay || []}
            columns={columns}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

