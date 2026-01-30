// File: src/pages/admin/MedicationManagement.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table, Button, Modal, Form, Input, InputNumber,
    message, Space, Card, Tag, Row, Col, Typography, Popconfirm, Select,
    Switch, Tabs, Divider, DatePicker, Statistic, Radio, Tooltip, Alert
} from 'antd';
import {
    EditOutlined, DeleteOutlined, ImportOutlined,
    MedicineBoxOutlined, CalculatorOutlined, ShopOutlined,
    HistoryOutlined, InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import { useBranchStore } from '@/stores/branchStore';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

// ============================================================================
// 1. MODAL SỬA LÔ (BATCH EDIT) - [MỚI]
// ============================================================================
const EditBatchModal = ({ open, onCancel, batchRecord, onSuccess }: any) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    if (open && batchRecord) {
        form.setFieldsValue({
            batch_number: batchRecord.batch_number,
            expiry_date: dayjs(batchRecord.expiry_date),
            quantity: batchRecord.quantity
        });
    }

    const updateBatchMutation = useMutation({
        mutationFn: (values: any) => {
            return axiosInstance.patch(`/inventory/${batchRecord.id}`, {
                ...values,
                expiry_date: values.expiry_date.toISOString()
            });
        },
        onSuccess: () => {
            message.success('Cập nhật lô thành công');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onSuccess();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi cập nhật lô')
    });

    return (
        <Modal
            title="Chỉnh sửa thông tin Lô hàng"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={updateBatchMutation.isPending}
            width={500}
        >
            <Alert
                message="Lưu ý quan trọng"
                description="Việc sửa số lượng trực tiếp tại đây sẽ làm thay đổi tồn kho thực tế mà không tạo phiếu nhập/xuất."
                type="warning"
                showIcon
                className="mb-4"
            />
            <Form form={form} layout="vertical" onFinish={(v) => updateBatchMutation.mutate(v)}>
                <Form.Item name="batch_number" label="Số lô (Batch Number)" rules={[{ required: true }]}>
                    <Input prefix={<MedicineBoxOutlined />} />
                </Form.Item>
                <Form.Item name="expiry_date" label="Hạn sử dụng" rules={[{ required: true }]}>
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="quantity" label="Số lượng tồn thực tế" rules={[{ required: true }]}>
                    <InputNumber className="w-full" min={0} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ============================================================================
// 2. SMART IMPORT MODAL (NHẬP KHO & TẠO THUỐC)
// ============================================================================
interface SmartImportModalProps {
    open: boolean;
    onCancel: () => void;
    currentInventory: any[];
}

const SmartImportModal = ({ open, onCancel, currentInventory }: SmartImportModalProps) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [totalPills, setTotalPills] = useState(0);
    const [costPerPill, setCostPerPill] = useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { selectedBranch } = useBranchStore();
    const targetBranchId = selectedBranch?.id || user.branch_id;

    // Fetch toàn bộ danh mục thuốc (Master Data)
    const { data: allMedications } = useQuery({
        queryKey: ['master-medications'],
        queryFn: async () => (await axiosInstance.get('medications/list')).data,
        enabled: open && mode === 'existing'
    });

    const sourceList = allMedications || currentInventory;

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => (await axiosInstance.get('/branches')).data,
        enabled: open && !targetBranchId
    });

    const importMutation = useMutation({
        mutationFn: async (values: any) => {
            const finalBranchId = values.branch_id || targetBranchId;
            if (!finalBranchId) throw new Error("Vui lòng chọn chi nhánh!");

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

            if (mode === 'existing') {
                itemPayload.medication_id = values.medication_id;
            } else {
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

            return axiosInstance.post('/inventory/import', {
                branch_id: finalBranchId,
                items: [itemPayload]
            });
        },
        onSuccess: () => {
            message.success('Nhập kho thành công!');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['master-medications'] });
            form.resetFields();
            setTotalPills(0);
            setCostPerPill(0);
            onCancel();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi nhập kho')
    });

    const handleValuesChange = (_: any, allValues: any) => {
        const cartons = allValues.quantity_cartons || 0;
        const boxes = allValues.boxes_per_carton || 0;
        const blisters = allValues.blisters_per_box || 1;
        const pills = allValues.pills_per_blister || 0;
        const total = cartons * boxes * blisters * pills;
        setTotalPills(total);

        if (total > 0 && allValues.total_import_cost) {
            setCostPerPill(allValues.total_import_cost / total);
        } else {
            setCostPerPill(0);
        }

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
                {!targetBranchId && (
                    <Card size="small" className="mb-4 bg-orange-50 border-orange-200">
                        <Form.Item name="branch_id" label={<span className="text-orange-700 font-bold"><ShopOutlined /> Chọn Chi nhánh nhập kho</span>} rules={[{ required: true }]}>
                            <Select placeholder="-- Chọn chi nhánh --" options={branches?.map((b: any) => ({ label: b.name, value: b.id }))} />
                        </Form.Item>
                    </Card>
                )}

                <div className="mb-6 text-center">
                    <Radio.Group value={mode} onChange={e => setMode(e.target.value)} buttonStyle="solid" size="large">
                        <Radio.Button value="existing">📦 Nhập hàng cũ (Đã có mã)</Radio.Button>
                        <Radio.Button value="new">✨ Tạo thuốc MỚI & Nhập kho</Radio.Button>
                    </Radio.Group>
                </div>

                <Row gutter={24}>
                    <Col span={12}>
                        <Card title="1. Thông tin Thuốc & Lô hàng" size="small" className="h-full border-blue-100 shadow-sm">
                            {mode === 'existing' ? (
                                <Form.Item name="medication_id" label="Tìm kiếm thuốc" rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}>
                                    <Select showSearch placeholder="Gõ tên thuốc hoặc mã..." optionFilterProp="children" size="large">
                                        {sourceList?.map((med: any) => (
                                            <Option key={med.id} value={med.id}><span className="font-bold">{med.code}</span> - {med.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                                    <Row gutter={8}>
                                        <Col span={16}><Form.Item name="new_med_name" label="Tên thuốc mới" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col span={8}><Form.Item name="new_med_code" label="Mã"><Input placeholder="Tự sinh" /></Form.Item></Col>
                                    </Row>
                                    <Row gutter={8}>
                                        <Col span={12}><Form.Item name="new_med_base_unit" label="Đơn vị tính"><Select><Option value="Viên">Viên</Option><Option value="Gói">Gói</Option><Option value="Ống">Ống</Option><Option value="Chai">Chai</Option></Select></Form.Item></Col>
                                        <Col span={12}><Form.Item name="new_med_import_unit" label="Đơn vị nhập"><Input placeholder="VD: Hộp" /></Form.Item></Col>
                                    </Row>
                                </div>
                            )}
                            <Divider orientation="left" plain style={{ margin: '12px 0' }}>Thông tin Lô (Batch)</Divider>
                            <Form.Item name="batch_number" label="Số lô sản xuất" rules={[{ required: true }]}><Input prefix={<MedicineBoxOutlined />} /></Form.Item>
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="mfg_date" label="Ngày SX" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="expiry_date" label="Hạn SD" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="2. Quy cách & Số lượng" size="small" className="bg-gray-50 border-gray-200 shadow-sm mb-4">
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="quantity_cartons" label="Số Thùng"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="boxes_per_carton" label="Hộp / Thùng"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="blisters_per_box" label="Vỉ / Hộp"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="pills_per_blister" label="Viên / Vỉ"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                            </Row>
                            <div className="text-right border-t pt-2">
                                <Statistic title="Tổng số lượng thực nhập (Viên)" value={totalPills} valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: '24px' }} />
                            </div>
                        </Card>
                        <Card title="3. Tài chính" size="small" className="shadow-sm">
                            <Form.Item name="total_import_cost" label="Tổng tiền nhập (VNĐ)" rules={[{ required: true }]}>
                                <InputNumber className="w-full" size="large" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
                            </Form.Item>
                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded mb-2">
                                <Text type="secondary">Giá vốn đơn vị:</Text>
                                <Text strong className="text-blue-600">{costPerPill.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫ / viên</Text>
                            </div>
                            {mode === 'new' && (
                                <div className="border-t pt-2 mt-2 border-dashed border-gray-300 bg-green-50 p-2 rounded">
                                    <Text type="success" strong><CalculatorOutlined /> Thiết lập giá bán</Text>
                                    <Row gutter={8} className="mt-2">
                                        <Col span={10}><Form.Item name="new_med_profit_margin" label="% Lãi"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                        <Col span={14}><Form.Item name="new_med_sell_price" label="Giá bán"><InputNumber className="w-full text-green-700 font-bold" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
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
// 3. MODAL SỬA THÔNG TIN THUỐC (MASTER DATA)
// ============================================================================
const EditMedicationModal = ({ open, onCancel, record, onSuccess }: any) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    if (open && record) {
        form.setFieldsValue({
            ...record,
            manufacturer: record.base_info?.manufacturer,
            country: record.base_info?.country,
            active_ingredient: record.base_info?.active_ingredient,
            usage: record.base_info?.usage,
            description: record.base_info?.description,
            is_active: record.is_active !== undefined ? record.is_active : true
        });
    }

    const updateMutation = useMutation({
        mutationFn: (values: any) => {
            const payload = {
                ...values,
                base_info: {
                    manufacturer: values.manufacturer,
                    country: values.country,
                    active_ingredient: values.active_ingredient,
                    usage: values.usage,
                    description: values.description
                }
            };
            return axiosInstance.put(`/medications/${record.id}`, payload);
        },
        onSuccess: () => {
            message.success('Cập nhật thành công');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onSuccess();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi cập nhật')
    });

    const handleCalculatePrice = () => {
        const cost = form.getFieldValue('cost_price') || 0;
        const margin = form.getFieldValue('profit_margin') || 0;
        const sell = cost + (cost * margin / 100);
        form.setFieldsValue({ sell_price: Math.ceil(sell) });
    };

    return (
        <Modal
            title={<><EditOutlined /> Cập nhật thuốc: <span className="text-blue-600">{record?.name}</span></>}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={updateMutation.isPending}
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={(v) => updateMutation.mutate(v)}>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Thông tin chung & Giá',
                        children: (
                            <>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item name="name" label="Tên thuốc" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                    <Col span={6}><Form.Item name="code" label="Mã thuốc"><Input disabled /></Form.Item></Col>
                                    <Col span={6}><Form.Item name="is_active" label="Trạng thái" valuePropName="checked"><Switch checkedChildren="Đang bán" unCheckedChildren="Ngừng KD" /></Form.Item></Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={8}><Form.Item name="base_unit" label="Đơn vị tính"><Input /></Form.Item></Col>
                                    <Col span={8}><Form.Item name="import_unit" label="Đơn vị nhập"><Input /></Form.Item></Col>
                                    <Col span={8}><Form.Item name="conversion_factor" label="Quy đổi (Viên/Hộp)"><InputNumber className="w-full" /></Form.Item></Col>
                                </Row>
                                <Divider dashed />
                                <div className="bg-gray-50 p-4 rounded">
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item name="cost_price" label="Giá vốn (VNĐ)" rules={[{ required: true }]}>
                                                <InputNumber className="w-full" min={0} onChange={handleCalculatePrice} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="profit_margin" label="% Lợi nhuận">
                                                <InputNumber className="w-full" min={0} onChange={handleCalculatePrice} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="sell_price" label="Giá bán (VNĐ)">
                                                <InputNumber className="w-full text-green-600 font-bold" min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            </>
                        )
                    },
                    {
                        key: '2',
                        label: 'Chi tiết Y Dược',
                        children: (
                            <>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item name="active_ingredient" label="Hoạt chất chính"><Input placeholder="VD: Paracetamol" /></Form.Item></Col>
                                    <Col span={12}><Form.Item name="manufacturer" label="Nhà sản xuất"><Input /></Form.Item></Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}><Form.Item name="country" label="Nước sản xuất"><Input /></Form.Item></Col>
                                    <Col span={12}><Form.Item name="usage" label="Đường dùng"><Select><Option value="Uống">Uống</Option><Option value="Tiêm">Tiêm</Option><Option value="Bôi">Bôi</Option><Option value="Đặt">Đặt</Option></Select></Form.Item></Col>
                                </Row>
                                <Form.Item name="description" label="Mô tả / Chỉ định / Liều dùng"><Input.TextArea rows={4} /></Form.Item>
                            </>
                        )
                    }
                ]} />
            </Form>
        </Modal>
    );
};

// ============================================================================
// 4. TRANG QUẢN LÝ CHÍNH
// ============================================================================
export default function MedicationManagement() {
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editingBatch, setEditingBatch] = useState<any>(null); // [MỚI] State cho lô đang sửa
    const { selectedBranch } = useBranchStore();
    const queryClient = useQueryClient();

    // Lấy dữ liệu Inventory
    const { data: medications, isLoading } = useQuery({
        queryKey: ['inventory', selectedBranch?.id],
        queryFn: async () => {
            if (!selectedBranch?.id) return [];
            const res = await axiosInstance.get('/inventory', { params: { branchId: selectedBranch.id } });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!selectedBranch?.id
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(`/medications/${id}`),
        onSuccess: () => {
            message.success('Đã xóa thuốc');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }
    });

    const deleteBatchMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(`/inventory/${id}`),
        onSuccess: () => {
            message.success('Đã xóa lô hàng');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
        onError: (err: any) => message.error('Không thể xóa lô này (có thể đã bán)')
    });

    // --- BẢNG CON: HIỂN THỊ CHI TIẾT LÔ + THAO TÁC LÔ ---
    const expandedRowRender = (record: any) => {
        const batchColumns = [
            {
                title: 'Số Lô',
                dataIndex: 'batch_number',
                key: 'batch',
                render: (t: string) => <Tag color="geekblue">{t}</Tag>
            },
            {
                title: 'Hạn Sử Dụng',
                dataIndex: 'expiry_date',
                key: 'expiry',
                render: (date: string) => {
                    const d = dayjs(date);
                    const diff = d.diff(dayjs(), 'day');
                    let color = 'green';
                    if (diff < 0) color = 'red';
                    else if (diff < 90) color = 'orange';

                    return (
                        <Tooltip title={`Ngày hết hạn: ${d.format('DD/MM/YYYY')}`}>
                            <Tag color={color}>
                                {d.format('DD/MM/YYYY')} ({diff > 0 ? `Còn ${diff} ngày` : 'Đã hết hạn'})
                            </Tag>
                        </Tooltip>
                    );
                }
            },
            { title: 'Ngày nhập', dataIndex: 'created_at', key: 'created', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
            { title: 'Giá nhập', dataIndex: 'import_price', key: 'impPrice', render: (v: number) => `${Number(v).toLocaleString()} đ` },
            {
                title: 'Số lượng',
                key: 'qty',
                render: (_: any, r: any) => (
                    <Space>
                        <Text type="secondary">Nhập: {r.initial_quantity}</Text>
                        <Divider type="vertical" />
                        <Text strong className="text-blue-600">Hiện tại: {r.quantity}</Text>
                    </Space>
                )
            },
            // [MỚI] Cột Thao tác cho từng lô
            {
                title: 'Thao tác',
                key: 'action',
                render: (_: any, batch: any) => (
                    <Space>
                        <Tooltip title="Sửa thông tin lô">
                            <Button size="small" icon={<EditOutlined />} onClick={() => setEditingBatch(batch)} />
                        </Tooltip>
                        <Popconfirm
                            title="Xóa lô này?"
                            description="Hành động này không thể hoàn tác!"
                            onConfirm={() => deleteBatchMutation.mutate(batch.id)}
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                )
            }
        ];

        return (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 ml-8">
                <div className="flex justify-between items-center mb-2">
                    <Text strong className="text-blue-800"><HistoryOutlined /> Chi tiết các lô hàng nhập kho:</Text>
                    {/* Có thể thêm nút "Nhập thêm lô" nhanh ở đây nếu muốn */}
                </div>
                {(!record.inventories || record.inventories.length === 0) ? (
                    <Text type="secondary" italic>Chưa có lô hàng nào trong kho.</Text>
                ) : (
                    <Table
                        columns={batchColumns}
                        dataSource={record.inventories}
                        pagination={false}
                        size="small"
                        rowKey="id"
                        bordered
                    />
                )}
            </div>
        );
    };

    // --- BẢNG CHÍNH ---
    const columns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            width: 100,
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Tên thuốc & Hoạt chất',
            dataIndex: 'name',
            render: (text: string, record: any) => (
                <div>
                    <div className="font-medium text-base text-blue-900">{text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        <Tag>{record.base_unit}</Tag>
                        {record.base_info?.active_ingredient && <span className="mr-1">| {record.base_info?.active_ingredient}</span>}
                        {record.base_info?.manufacturer && <span>| {record.base_info?.manufacturer}</span>}
                    </div>
                </div>
            )
        },
        {
            title: 'Tổng Tồn',
            dataIndex: 'inventory_qty',
            align: 'center' as const,
            render: (val: number) => (
                <Tooltip title="Bấm dấu + đầu dòng để xem chi tiết lô">
                    <Tag color={val > 0 ? 'processing' : 'default'} className="text-sm font-bold px-3 py-1 cursor-pointer">
                        {val?.toLocaleString()}
                    </Tag>
                </Tooltip>
            )
        },
        {
            title: 'Khả dụng',
            dataIndex: 'available_qty',
            align: 'center' as const,
            render: (val: number) => (
                <Tooltip title="Đã trừ hàng hết hạn và hàng đang giữ chỗ">
                    <span className={`font-bold ${val > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {val?.toLocaleString()}
                    </span>
                </Tooltip>
            )
        },
        {
            title: 'Hết hạn',
            dataIndex: 'expired_qty',
            align: 'center' as const,
            width: 90,
            render: (val: number) => val > 0 ? <Tag color="error">{val}</Tag> : <span className="text-gray-300">-</span>
        },
        {
            title: 'Giá bán',
            dataIndex: 'sell_price',
            align: 'right' as const,
            render: (val: number) => <span className="text-green-600 font-bold">{Number(val).toLocaleString()} ₫</span>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 110,
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Sửa thông tin thuốc (Master Data)">
                        <Button icon={<EditOutlined />} size="small" onClick={() => setEditingItem(record)} />
                    </Tooltip>
                    <Popconfirm title="Xóa thuốc?" description="Hành động này sẽ xóa cả lịch sử kho!" onConfirm={() => deleteMutation.mutate(record.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Kho Dược & Danh mục</Title>
                        <Text type="secondary">
                            Chi nhánh đang chọn: <strong className="text-blue-600">{selectedBranch?.name || '...'}</strong>
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<ImportOutlined />}
                        onClick={() => setIsSmartImportOpen(true)}
                        disabled={!selectedBranch}
                    >
                        Nhập kho / Thêm thuốc
                    </Button>
                </div>

                <Card bordered={false} className="shadow-sm">
                    {!selectedBranch ? (
                        <div className="text-center py-12 text-gray-500">Vui lòng chọn chi nhánh để xem kho thuốc</div>
                    ) : (
                        <Table
                            dataSource={medications}
                            columns={columns}
                            rowKey="id"
                            loading={isLoading}
                            pagination={{ pageSize: 10 }}
                            expandable={{
                                expandedRowRender,
                                rowExpandable: (record) => record.inventories && record.inventories.length > 0,
                                expandRowByClick: true
                            }}
                        />
                    )}
                </Card>

                {/* MODAL SỬA THÔNG TIN THUỐC */}
                <EditMedicationModal
                    open={!!editingItem}
                    record={editingItem}
                    onCancel={() => setEditingItem(null)}
                    onSuccess={() => setEditingItem(null)}
                />

                {/* MODAL SỬA LÔ (MỚI) */}
                <EditBatchModal
                    open={!!editingBatch}
                    batchRecord={editingBatch}
                    onCancel={() => setEditingBatch(null)}
                    onSuccess={() => setEditingBatch(null)}
                />

                {/* MODAL NHẬP KHO */}
                <SmartImportModal
                    open={isSmartImportOpen}
                    onCancel={() => setIsSmartImportOpen(false)}
                    currentInventory={medications || []}
                />
            </div>
        </DashboardLayout>
    );
}