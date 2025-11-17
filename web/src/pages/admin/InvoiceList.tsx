import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Tag,
  message,
  Progress,
} from 'antd';
import {
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { invoiceService, type Invoice } from '@/services/invoice.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function InvoiceList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, limit, status, dateRange],
    queryFn: () =>
      invoiceService.getInvoices({
        page,
        limit,
        status,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  });

  if (error) {
    message.error('Không thể tải danh sách hóa đơn');
  }

  const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
    pending: { color: 'orange', text: 'Chưa thanh toán', icon: <ClockCircleOutlined /> },
    partially_paid: { color: 'blue', text: 'Thanh toán 1 phần', icon: <ClockCircleOutlined /> },
    paid: { color: 'green', text: 'Đã thanh toán', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'red', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
  };

  const columns = [
    {
      title: 'Mã hóa đơn',
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
      render: (_: unknown, record: Invoice) => (
        <div>
          <Text strong>{record.patient?.user.full_name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.patient?.user.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {amount.toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (amount: number) => (
        <Text style={{ color: '#52c41a' }}>
          {amount.toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 150,
      render: (_: unknown, record: Invoice) => {
        const percent = Math.round((record.paid_amount / record.total_amount) * 100);
        return <Progress percent={percent} size="small" />;
      },
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
      render: (_: unknown, record: Invoice) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/invoices/${record.id}`)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2}>Quản lý Hóa đơn</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/invoices/new')}
          >
            Tạo hóa đơn
          </Button>
        </div>

        <Card className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Select
                placeholder="Trạng thái"
                value={status}
                onChange={setStatus}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="pending">Chưa thanh toán</Select.Option>
                <Select.Option value="partially_paid">Thanh toán 1 phần</Select.Option>
                <Select.Option value="paid">Đã thanh toán</Select.Option>
                <Select.Option value="cancelled">Đã hủy</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={12}>
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={4}>
              <Button
                onClick={() => {
                  setStatus(undefined);
                  setDateRange(null);
                }}
                block
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

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
              showTotal: (total) => `Tổng ${total} hóa đơn`,
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
