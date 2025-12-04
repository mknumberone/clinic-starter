import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table, Button, Modal, Form, Input, InputNumber,
    message, Space, Card, Tag, Row, Col, Divider, Typography, Popconfirm, Select, DatePicker, Statistic, Radio, Tooltip
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    MedicineBoxOutlined, CalculatorOutlined, DollarOutlined, ImportOutlined, ShopOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

// ============================================================================
// 1. SMART IMPORT MODAL (GỘP LUỒNG: NHẬP KHO + TẠO THUỐC)
// ============================================================================
interface SmartImportModalProps {
    open: boolean;
    onCancel: () => void;
    medications: any[];
}

const SmartImportModal = ({ open, onCancel, medications }: SmartImportModalProps) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Mode: 'existing' (Nhập hàng cũ) | 'new' (Tạo thuốc mới & Nhập)
    const [mode, setMode] = useState<'existing' | 'new'>('existing');

    // State tính toán realtime
    const [totalPills, setTotalPills] = useState(0);
    const [costPerPill, setCostPerPill] = useState(0);

    // Lấy user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userBranchId = user.branch_id || null;

    // API lấy chi nhánh (cho Admin)
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => (await axiosInstance.get('/branches')).data,
        enabled: open && !userBranchId
    });

    const importMutation = useMutation({
        mutationFn: async (values: any) => {
            const finalBranchId = values.branch_id || userBranchId;
            if (!finalBranchId) throw new Error("Vui lòng chọn chi nhánh!");

            // Payload cho Item nhập kho
            const itemPayload: any = {
                batch_number: values.batch_number,
                mfg_date: values.mfg_date.toISOString(),
                expiry_date: values.expiry_date.toISOString(),
                quantity_cartons: values.quantity_cartons,
                boxes_per_carton: values.boxes_per_carton,
                blisters_per_box: values.blisters_per_box,
                pills_per_blister: values.pills_per_blister,
                total_import_cost: values.total_import_cost
            };

            // CASE 1: THUỐC CŨ -> Gửi ID
            if (mode === 'existing') {
                itemPayload.medication_id = values.medication_id;
            }
            // CASE 2: THUỐC MỚI -> Gửi object new_medication
            else {
                itemPayload.new_medication = {
                    name: values.new_med_name,
                    code: values.new_med_code,
                    base_unit: values.new_med_base_unit,
                    import_unit: values.new_med_import_unit,
                    conversion_factor: values.new_med_conversion_factor,
                    profit_margin: values.new_med_profit_margin,
                    sell_price: values.new_med_sell_price
                };
            }

            // Gọi API
            return axiosInstance.post('/inventory/import', {
                branch_id: finalBranchId,
                items: [itemPayload]
            });
        },
        onSuccess: () => {
            message.success(mode === 'new' ? 'Đã tạo thuốc và nhập kho thành công!' : 'Nhập kho thành công!');
            // Làm mới dữ liệu bảng
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['medications'] });

            // Reset form
            form.resetFields();
            setTotalPills(0);
            setCostPerPill(0);
            onCancel();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi nhập kho')
    });

    const handleValuesChange = (_: any, allValues: any) => {
        // 1. Tính tổng số lượng
        const cartons = allValues.quantity_cartons || 0;
        const boxes = allValues.boxes_per_carton || 0;
        const blisters = allValues.blisters_per_box || 1;
        const pills = allValues.pills_per_blister || 0;
        const total = cartons * boxes * blisters * pills;
        setTotalPills(total);

        // 2. Tính giá vốn
        if (total > 0 && allValues.total_import_cost) {
            setCostPerPill(allValues.total_import_cost / total);
        } else {
            setCostPerPill(0);
        }

        // 3. Tự động gợi ý giá bán (Chỉ khi tạo thuốc mới)
        if (mode === 'new' && total > 0 && allValues.new_med_profit_margin && allValues.total_import_cost) {
            const cost = allValues.total_import_cost / total;
            const sell = cost * (1 + allValues.new_med_profit_margin / 100);
            form.setFieldsValue({ new_med_sell_price: Math.ceil(sell) });
        }
    };

    return (
        <Modal
            title={<Title level={4} className="m-0"><ImportOutlined /> Nhập kho & Quản lý Thuốc</Title>}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={importMutation.isPending}
            width={950}
            okText="Xác nhận Nhập kho"
            cancelText="Hủy bỏ"
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                onFinish={(v) => importMutation.mutate(v)}
                initialValues={{
                    quantity_cartons: 1, boxes_per_carton: 1, blisters_per_box: 1, pills_per_blister: 1,
                    new_med_base_unit: 'Viên', new_med_import_unit: 'Hộp', new_med_conversion_factor: 10, new_med_profit_margin: 20
                }}
            >
                {/* 0. CHỌN CHI NHÁNH (CHỈ HIỆN VỚI ADMIN) */}
                {!userBranchId && (
                    <Card size="small" className="mb-4 bg-orange-50 border-orange-200">
                        <Form.Item name="branch_id" label={<span className="text-orange-700 font-bold"><ShopOutlined /> Chọn Chi nhánh nhập kho</span>} rules={[{ required: true }]}>
                            <Select placeholder="-- Chọn chi nhánh --" options={branches?.map((b: any) => ({ label: b.name, value: b.id }))} />
                        </Form.Item>
                    </Card>
                )}

                {/* 1. THANH CHUYỂN ĐỔI CHẾ ĐỘ */}
                <div className="mb-6 text-center">
                    <Radio.Group
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        buttonStyle="solid"
                        size="large"
                    >
                        <Radio.Button value="existing">📦 Nhập hàng cũ (Đã có mã)</Radio.Button>
                        <Radio.Button value="new">✨ Tạo thuốc MỚI & Nhập kho</Radio.Button>
                    </Radio.Group>
                </div>

                <Row gutter={24}>
                    {/* CỘT TRÁI: THÔNG TIN ĐỊNH DANH */}
                    <Col span={12}>
                        <Card title="1. Thông tin Thuốc & Lô hàng" size="small" className="h-full border-blue-100 shadow-sm">
                            {mode === 'existing' ? (
                                // --- MODE CŨ: CHỌN LIST ---
                                <Form.Item name="medication_id" label="Tìm kiếm thuốc trong danh mục" rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}>
                                    <Select
                                        showSearch
                                        placeholder="Gõ tên thuốc hoặc mã..."
                                        optionFilterProp="children"
                                        size="large"
                                        filterOption={(input, option: any) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                                    >
                                        {medications.map(med => (
                                            <Option key={med.id} value={med.id}>
                                                <span className="font-bold">{med.code}</span> - {med.name}
                                                {med.inventory_qty !== undefined && <Tag className="ml-2" color={med.inventory_qty > 0 ? 'green' : 'red'}>Tồn: {med.inventory_qty}</Tag>}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : (
                                // --- MODE MỚI: NHẬP TEXT ---
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                                    <Row gutter={8}>
                                        <Col span={16}>
                                            <Form.Item name="new_med_name" label="Tên thuốc mới" rules={[{ required: true }]}>
                                                <Input placeholder="VD: Panadol Extra" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="new_med_code" label="Mã (Tùy chọn)">
                                                <Input placeholder="Tự sinh" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Form.Item name="new_med_base_unit" label="Đơn vị tính">
                                                <Select><Option value="Viên">Viên</Option><Option value="Gói">Gói</Option><Option value="Ống">Ống</Option><Option value="Chai">Chai</Option></Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="new_med_import_unit" label="Đơn vị nhập">
                                                <Input placeholder="VD: Hộp" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {/* THÔNG TIN LÔ (CHUNG CHO CẢ 2 MODE) */}
                            <Divider orientation="left" plain style={{ margin: '12px 0' }}>Thông tin Lô (Batch)</Divider>
                            <Form.Item name="batch_number" label="Số lô sản xuất" rules={[{ required: true }]}>
                                <Input prefix={<MedicineBoxOutlined />} placeholder="VD: LOT-2024-001" />
                            </Form.Item>
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="mfg_date" label="Ngày SX" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="expiry_date" label="Hạn SD" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: SỐ LƯỢNG & GIÁ */}
                    <Col span={12}>
                        <Card title="2. Quy cách & Số lượng" size="small" className="bg-gray-50 border-gray-200 shadow-sm mb-4">
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="quantity_cartons" label="Số Thùng"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="boxes_per_carton" label="Hộp / Thùng"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="blisters_per_box" label="Vỉ / Hộp (hoặc 1)"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="pills_per_blister" label="Viên / Vỉ"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                            </Row>
                            <div className="text-right border-t pt-2">
                                <Statistic
                                    title="Tổng số lượng thực nhập (Viên)"
                                    value={totalPills}
                                    valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: '24px' }}
                                />
                            </div>
                        </Card>

                        <Card title="3. Tài chính" size="small" className="shadow-sm">
                            <Form.Item name="total_import_cost" label="Tổng tiền nhập hàng (VNĐ)" rules={[{ required: true }]}>
                                <InputNumber
                                    className="w-full" size="large"
                                    formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter="₫"
                                />
                            </Form.Item>

                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2">
                                <Text type="secondary">Giá vốn đơn vị:</Text>
                                <Text strong className="text-blue-600">{costPerPill.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫ / viên</Text>
                            </div>

                            {/* CHỈ HIỆN KHI TẠO THUỐC MỚI */}
                            {mode === 'new' && (
                                <div className="border-t pt-2 mt-2 border-dashed border-gray-300 bg-green-50 p-2 rounded">
                                    <Text type="success" strong><CalculatorOutlined /> Thiết lập giá bán</Text>
                                    <Row gutter={8} className="mt-2">
                                        <Col span={10}><Form.Item name="new_med_profit_margin" label="% Lãi"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                        <Col span={14}>
                                            <Form.Item name="new_med_sell_price" label="Giá bán niêm yết">
                                                <InputNumber className="w-full text-green-700 font-bold" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

// ============================================================================
// 2. EDIT MODAL (CHỈ DÙNG ĐỂ SỬA THÔNG TIN - KHÔNG NHẬP KHO)
// ============================================================================
const EditMedicationModal = ({ open, onCancel, record, onSuccess }: any) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Reset form khi mở modal
    if (open && record) {
        form.setFieldsValue(record);
    }

    const updateMutation = useMutation({
        mutationFn: (values: any) => axiosInstance.put(`/prescriptions/medications/${record.id}`, values),
        onSuccess: () => {
            message.success('Cập nhật thông tin thuốc thành công');
            queryClient.invalidateQueries({ queryKey: ['medications'] });
            onSuccess();
        },
        onError: () => message.error('Lỗi khi cập nhật')
    });

    const handleCalculatePrice = () => {
        const cost = form.getFieldValue('cost_price') || 0;
        const margin = form.getFieldValue('profit_margin') || 0;
        const sell = cost + (cost * margin / 100);
        form.setFieldsValue({ sell_price: Math.ceil(sell) });
    };

    return (
        <Modal
            title="Sửa thông tin thuốc"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={updateMutation.isPending}
        >
            <Form form={form} layout="vertical" onFinish={(v) => updateMutation.mutate(v)}>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="name" label="Tên thuốc" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="code" label="Mã thuốc"><Input disabled /></Form.Item></Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="base_unit" label="Đơn vị"><Input /></Form.Item></Col>
                    <Col span={8}>
                        <Form.Item name="cost_price" label="Giá vốn" rules={[{ required: true }]}>
                            <InputNumber className="w-full" onChange={handleCalculatePrice} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="profit_margin" label="% Lãi">
                            <InputNumber className="w-full" onChange={handleCalculatePrice} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="sell_price" label="Giá bán niêm yết">
                    <InputNumber className="w-full text-green-600 font-bold" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ============================================================================
// 3. MAIN COMPONENT (TRANG QUẢN LÝ)
// ============================================================================
export default function MedicationManagement() {
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const queryClient = useQueryClient();

    // 1. Lấy danh sách thuốc
    const { data: medications, isLoading } = useQuery({
        queryKey: ['medications'],
        queryFn: async () => {
            const res = await axiosInstance.get('/prescriptions/medications/list');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    // 2. Xóa thuốc
    const deleteMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(`/prescriptions/medications/${id}`),
        onSuccess: () => {
            message.success('Đã xóa thuốc');
            queryClient.invalidateQueries({ queryKey: ['medications'] });
        }
    });

    const columns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Tên thuốc',
            dataIndex: 'name',
            render: (text: string, record: any) => (
                <div>
                    <div className="font-medium text-base">{text}</div>
                    <div className="text-xs text-gray-500">Đơn vị: {record.base_unit}</div>
                </div>
            )
        },
        {
            title: 'Tồn kho',
            dataIndex: 'inventory_qty', // Cần Backend trả về trường này
            render: (val: number) => {
                // Nếu chưa có dữ liệu tồn kho thì giả định là 0
                const qty = val || 0;
                return <Tag color={qty > 50 ? 'green' : qty > 0 ? 'orange' : 'red'}>{qty.toLocaleString()}</Tag>
            }
        },
        // CỤM CỘT QUẢN LÝ KHO CHI TIẾT
        {
            title: 'Kho Tổng',
            dataIndex: 'inventory_qty',
            align: 'center' as const,
            width: 100,
            render: (val: number) => <span className="text-gray-500">{val?.toLocaleString()}</span>
        },
        {
            title: 'Đang kê đơn',
            dataIndex: 'pending_qty',
            align: 'center' as const,
            width: 110,
            render: (val: number) => (
                <Tooltip title="Số lượng thuốc nằm trong các đơn chưa thanh toán">
                    {val > 0 ? <Tag color="orange" className="font-bold">{val.toLocaleString()}</Tag> : '-'}
                </Tooltip>
            )
        },
        {
            title: 'Có thể bán',
            align: 'center' as const,
            width: 110,
            render: (_: any, record: any) => {
                // Công thức: Tồn thực tế - Đang giữ chỗ
                const available = (record.inventory_qty || 0) - (record.pending_qty || 0);

                let color = 'green';
                if (available <= 0) color = 'red';
                else if (available < 50) color = 'gold';

                return (
                    <Tag color={color} className="text-sm px-2 py-1 font-bold">
                        {available.toLocaleString()}
                    </Tag>
                );
            }
        },
        {
            title: 'Đã bán',
            dataIndex: 'sold_qty',
            align: 'center' as const, // Căn giữa cho đẹp
            render: (val: number) => (
                <span className="font-semibold text-blue-600">
                    {(val || 0).toLocaleString()}
                </span>
            )
        },

        // ---> CỘT MỚI 2: HẾT HẠN
        {
            title: 'Hết hạn',
            dataIndex: 'expired_qty',
            align: 'center' as const,
            render: (val: number) => {
                const qty = val || 0;
                // Nếu có thuốc hết hạn thì hiện cảnh báo đỏ, không thì hiện dấu gạch ngang
                return qty > 0 ? (
                    <Tooltip title="Cần tiêu hủy hoặc thanh lý">
                        <Tag color="error" icon={<DeleteOutlined />}>
                            {qty.toLocaleString()}
                        </Tag>
                    </Tooltip>
                ) : <span className="text-gray-400">-</span>;
            }
        },
        {
            title: 'Giá vốn',
            dataIndex: 'cost_price',
            render: (val: number) => <span className="text-gray-500">{Number(val).toLocaleString('vi-VN')}</span>
        },
        {
            title: 'Giá bán',
            dataIndex: 'sell_price',
            render: (val: number) => <span className="text-green-600 font-bold">{Number(val).toLocaleString('vi-VN')} ₫</span>
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => setEditingItem(record)}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa thuốc này?"
                        description="Hành động này sẽ xóa cả lịch sử tồn kho liên quan!"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Kho Dược & Danh mục</Title>
                        <Text type="secondary">Quản lý nhập xuất tồn và danh mục thuốc</Text>
                    </div>

                    {/* NÚT HÀNH ĐỘNG CHÍNH */}
                    <Button
                        type="primary"
                        size="large"
                        icon={<ImportOutlined />}
                        className="bg-blue-600 hover:bg-blue-500 shadow-md"
                        onClick={() => setIsSmartImportOpen(true)}
                    >
                        Nhập kho / Thêm thuốc
                    </Button>
                </div>

                {/* TABLE LIST */}
                <Card bordered={false} className="shadow-sm">
                    <Table
                        dataSource={medications}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>

                {/* MODAL 1: SMART IMPORT (GỘP) */}
                <SmartImportModal
                    open={isSmartImportOpen}
                    onCancel={() => setIsSmartImportOpen(false)}
                    medications={medications || []}
                />

                {/* MODAL 2: EDIT ONLY */}
                <EditMedicationModal
                    open={!!editingItem}
                    record={editingItem}
                    onCancel={() => setEditingItem(null)}
                    onSuccess={() => setEditingItem(null)}
                />
            </div>
        </DashboardLayout>
    );
}