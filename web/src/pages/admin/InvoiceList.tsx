import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Space, Typography, Select, Input } from 'antd';
import { DollarOutlined, SearchOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { invoiceService, Invoice } from '@/services/invoice.service';
import PaymentModal from '@/components/modals/PaymentModal';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function InvoiceList() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>('UNPAID'); // Mặc định hiện đơn chưa trả
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lấy danh sách hóa đơn
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoiceService.getInvoices({ status: statusFilter }),
  });

  const columns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'id',
      width: 100,
      render: (id: string) => <Tag>{id.slice(0, 8).toUpperCase()}</Tag>,
    },
    {
      title: 'Bệnh nhân',
      render: (_: any, r: Invoice) => (
        <div>
          <div className="font-bold">{r.patient?.user?.full_name}</div>
          <div className="text-xs text-gray-500">{r.patient?.user?.phone}</div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      align: 'right' as const,
      render: (amount: number) => (
        <b className="text-red-600 text-base">
          {Number(amount).toLocaleString()} đ
        </b>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center' as const,
      render: (status: string) => {
        const color = status === 'PAID' ? 'green' : status === 'UNPAID' ? 'red' : 'orange';
        const label = status === 'PAID' ? 'Đã thanh toán' : status === 'UNPAID' ? 'Chưa thanh toán' : status;
        return <Tag color={color}>{label}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: Invoice) => (
        record.status === 'UNPAID' ? (
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedInvoice(record);
              setIsModalOpen(true);
            }}
          >
            Thu tiền
          </Button>
        ) : (
          <Button size="small" onClick={() => {
            setSelectedInvoice(record);
            setIsModalOpen(true);
          }}>
            Xem lại
          </Button>
        )
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <Title level={2} style={{ margin: 0 }}>Quản lý Thu ngân</Title>
        </div>

        <Card className="mb-4">
          <Space>
            <Select
              defaultValue="UNPAID"
              style={{ width: 200 }}
              onChange={setStatusFilter}
              options={[
                { label: 'Chưa thanh toán (Cần thu)', value: 'UNPAID' },
                { label: 'Đã thanh toán', value: 'PAID' },
                { label: 'Tất cả', value: undefined },
              ]}
            />
            <Input prefix={<SearchOutlined />} placeholder="Tìm tên bệnh nhân..." />
          </Space>
        </Card>

        <Card bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={invoices}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Modal Thanh Toán */}
        <PaymentModal
          invoice={selectedInvoice}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}