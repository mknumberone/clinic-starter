import { useQuery } from '@tanstack/react-query';
import { Card, Select, Space, Spin, Table, Typography, Button, message } from 'antd';
import { FileExcelOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { dashboardService } from '@/services/dashboard.service';
import { useBranchStore } from '@/stores/branchStore';

export default function InventoryReport() {
  const { branches, selectedBranch, selectBranch, clearBranch } = useBranchStore();
  const branchId = selectedBranch?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-report', branchId],
    queryFn: () => dashboardService.getInventoryReport(branchId),
  });

  const expiring = data?.expiring || [];
  const lowStock = data?.lowStock || [];

  const handleExportExcel = () => {
    const rows: string[] = [];
    rows.push('Báo cáo kho thuốc');
    rows.push('');
    rows.push('Thuốc sắp hết hạn (30 ngày)');
    rows.push('Chi nhánh,Thuốc,Ngày hết hạn,Số lượng');
    expiring.forEach((r) => rows.push(`${r.branchName},${r.medicationName},${r.expiry_date},${r.available_qty}`));
    rows.push('');
    rows.push('Thuốc tồn thấp (<10)');
    rows.push('Chi nhánh,Thuốc,Số lượng');
    lowStock.forEach((r) => rows.push(`${r.branchName},${r.medicationName},${r.available_qty}`));
    const csv = rows.join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-kho-thuoc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Đã xuất file.');
  };

  const expiringColumns = [
    { title: 'Chi nhánh', dataIndex: 'branchName' },
    { title: 'Thuốc', dataIndex: 'medicationName' },
    { title: 'Ngày hết hạn', dataIndex: 'expiry_date', render: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
    { title: 'Số lượng', dataIndex: 'available_qty', align: 'right' as const },
  ];

  const lowStockColumns = [
    { title: 'Chi nhánh', dataIndex: 'branchName' },
    { title: 'Thuốc', dataIndex: 'medicationName' },
    { title: 'Số lượng', dataIndex: 'available_qty', align: 'right' as const },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Typography.Title level={3} style={{ margin: 0 }}>
              Báo cáo kho thuốc
            </Typography.Title>
            <Space>
              <Select
                style={{ width: 200 }}
                placeholder="Tất cả chi nhánh"
                allowClear
                value={branchId}
                onChange={(v) => (v ? selectBranch(v) : clearBranch())}
                options={branches.map((b) => ({ label: b.name, value: b.id }))}
              />
              <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                Xuất Excel (CSV)
              </Button>
            </Space>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" tip="Đang tải..." />
            </div>
          ) : (
            <>
              <Card
                title={
                  <span className="font-semibold flex items-center gap-2">
                    <WarningOutlined className="text-amber-500" /> Thuốc sắp hết hạn (trong 30 ngày)
                  </span>
                }
              >
                <Table
                  rowKey={(r) => `${r.branchName}-${r.medicationName}-${r.expiry_date}`}
                  dataSource={expiring}
                  columns={expiringColumns}
                  pagination={{ pageSize: 15 }}
                  locale={{ emptyText: 'Không có thuốc sắp hết hạn' }}
                />
              </Card>
              <Card
                title={
                  <span className="font-semibold flex items-center gap-2">
                    <ExclamationCircleOutlined className="text-red-500" /> Thuốc tồn thấp (&lt;10)
                  </span>
                }
              >
                <Table
                  rowKey={(r) => `${r.branchName}-${r.medicationName}`}
                  dataSource={lowStock}
                  columns={lowStockColumns}
                  pagination={{ pageSize: 15 }}
                  locale={{ emptyText: 'Không có thuốc tồn thấp' }}
                />
              </Card>
            </>
          )}
        </Space>
      </div>
    </DashboardLayout>
  );
}
