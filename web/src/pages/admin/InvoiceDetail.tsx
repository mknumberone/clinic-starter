import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Table,
  Tag,
  Divider,
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  invoiceService,
  type InvoiceItem,
  type CreatePaymentDto,
} from '@/services/invoice.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceById(id!),
    enabled: !!id,
    onError: () => {
      message.error('Không thể tải thông tin hóa đơn');
      navigate('/admin/invoices');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: CreatePaymentDto) => invoiceService.createPayment(id!, data),
    onSuccess: () => {
      message.success('Thanh toán thành công');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPaymentModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi thanh toán');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return null;
  }

  const remainingAmount = invoice.total_amount - invoice.paid_amount;
  const paymentPercent = Math.round((invoice.paid_amount / invoice.total_amount) * 100);

  const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
    pending: { color: 'orange', text: 'Chưa thanh toán', icon: <ClockCircleOutlined /> },
    partially_paid: { color: 'blue', text: 'Thanh toán 1 phần', icon: <ClockCircleOutlined /> },
    paid: { color: 'green', text: 'Đã thanh toán', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'red', text: 'Đã hủy', icon: <CloseCircleOutlined /> },
  };

  const config = statusConfig[invoice.status] || { color: 'default', text: invoice.status, icon: null };

  const itemColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`,
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 150,
      render: (_: unknown, record: InvoiceItem) => (
        <Text strong>{(record.quantity * record.amount).toLocaleString('vi-VN')} ₫</Text>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {amount.toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      title: 'Mã giao dịch',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: (id?: string) => id || '-',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes?: string) => notes || '-',
    },
  ];

  const handlePayment = (values: CreatePaymentDto) => {
    paymentMutation.mutate(values);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Chi tiết Hóa đơn
            </Title>
          </Space>
          <Space>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setPaymentModalOpen(true)}
              >
                Thanh toán
              </Button>
            )}
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              In hóa đơn
            </Button>
          </Space>
        </div>

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <Space>
              <DollarOutlined style={{ fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Hóa đơn #{invoice.id.slice(0, 8)}
                </Text>
                <br />
                <Text type="secondary">
                  Ngày tạo: {dayjs(invoice.created_at).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
            </Space>
            <Tag color={config.color} icon={config.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
              {config.text}
            </Tag>
          </div>

          <Divider />

          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined /> Bệnh nhân
                </Space>
              }
            >
              <div>
                <Text strong>{invoice.patient?.user.full_name}</Text>
                <br />
                <Text type="secondary">{invoice.patient?.user.phone}</Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Lịch hẹn">
              {invoice.appointment
                ? `${dayjs(invoice.appointment.start_time).format('DD/MM/YYYY')} - ${invoice.appointment.appointment_type}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                {invoice.total_amount.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                {invoice.paid_amount.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <Text strong style={{ fontSize: 16, color: remainingAmount > 0 ? '#ff4d4f' : '#52c41a' }}>
                {remainingAmount.toLocaleString('vi-VN')} ₫
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tiến độ thanh toán">
              <Progress percent={paymentPercent} />
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={2}>
              {invoice.notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Chi tiết hóa đơn" className="mb-4">
          <Table
            columns={itemColumns}
            dataSource={invoice.items || []}
            rowKey="id"
            pagination={false}
          />
        </Card>

        <Card title={`Lịch sử thanh toán (${invoice.payments?.length || 0})`}>
          {invoice.payments && invoice.payments.length > 0 ? (
            <Table
              columns={paymentColumns}
              dataSource={invoice.payments}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Alert message="Chưa có thanh toán nào" type="info" showIcon />
          )}
        </Card>

        {/* Payment Modal */}
        <Modal
          title="Thanh toán hóa đơn"
          open={paymentModalOpen}
          onCancel={() => {
            setPaymentModalOpen(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          confirmLoading={paymentMutation.isPending}
        >
          <Alert
            message={`Số tiền còn lại: ${remainingAmount.toLocaleString('vi-VN')} ₫`}
            type="warning"
            showIcon
            className="mb-4"
          />
          <Form form={form} layout="vertical" onFinish={handlePayment}>
            <Form.Item
              name="amount"
              label="Số tiền thanh toán"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền' },
                {
                  validator: (_, value) => {
                    if (value && value > remainingAmount) {
                      return Promise.reject('Số tiền không được vượt quá số tiền còn lại');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                addonAfter="₫"
                placeholder="Nhập số tiền"
              />
            </Form.Item>
            <Form.Item
              name="method"
              label="Phương thức thanh toán"
              rules={[{ required: true, message: 'Vui lòng chọn phương thức' }]}
            >
              <Select placeholder="Chọn phương thức">
                <Select.Option value="cash">Tiền mặt</Select.Option>
                <Select.Option value="bank_transfer">Chuyển khoản</Select.Option>
                <Select.Option value="credit_card">Thẻ tín dụng</Select.Option>
                <Select.Option value="momo">MoMo</Select.Option>
                <Select.Option value="zalopay">ZaloPay</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="transaction_id" label="Mã giao dịch">
              <Input placeholder="VD: TXN123456" />
            </Form.Item>
            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={3} placeholder="Ghi chú về thanh toán" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
