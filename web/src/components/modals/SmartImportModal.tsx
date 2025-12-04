import { useState, useMemo } from 'react';
import { Modal, Form, Select, Input, InputNumber, DatePicker, Row, Col, Divider, Radio, Card, Typography, Statistic, message } from 'antd';
import { MedicineBoxOutlined, PlusOutlined, CalculatorOutlined, DollarOutlined, ShopOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface SmartImportModalProps {
    open: boolean;
    onCancel: () => void;
    medications: any[]; // Danh sách thuốc có sẵn
}

export default function SmartImportModal({ open, onCancel, medications }: SmartImportModalProps) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Mode: 'existing' (chọn thuốc cũ) hoặc 'new' (tạo thuốc mới)
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

    // API Nhập kho (Gộp luồng)
    const importMutation = useMutation({
        mutationFn: async (values: any) => {
            const finalBranchId = values.branch_id || userBranchId;
            if (!finalBranchId) throw new Error("Vui lòng chọn chi nhánh!");

            // Payload cơ bản
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

            // Nếu là thuốc CŨ -> Gửi ID
            if (mode === 'existing') {
                itemPayload.medication_id = values.medication_id;
            }
            // Nếu là thuốc MỚI -> Gửi thông tin thuốc mới
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

            return axiosInstance.post('/inventory/import', {
                branch_id: finalBranchId,
                items: [itemPayload] // Hỗ trợ gửi mảng, ở đây gửi 1 item trước
            });
        },
        onSuccess: () => {
            message.success(mode === 'new' ? 'Đã tạo thuốc và nhập kho thành công!' : 'Nhập kho thành công!');
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['medications'] }); // Reload cả danh sách thuốc
            form.resetFields();
            setTotalPills(0);
            onCancel();
        },
        onError: (err: any) => message.error(err.response?.data?.message || 'Lỗi nhập kho')
    });

    const handleValuesChange = (_: any, allValues: any) => {
        // Tính toán số lượng
        const total = (allValues.quantity_cartons || 0) * (allValues.boxes_per_carton || 0) * (allValues.blisters_per_box || 1) * (allValues.pills_per_blister || 0);
        setTotalPills(total);

        // Tính giá vốn
        if (total > 0 && allValues.total_import_cost) {
            setCostPerPill(allValues.total_import_cost / total);
        } else {
            setCostPerPill(0);
        }

        // Tự động tính giá bán (nếu đang tạo thuốc mới)
        if (mode === 'new' && total > 0 && allValues.new_med_profit_margin) {
            const cost = allValues.total_import_cost / total;
            const sell = cost * (1 + allValues.new_med_profit_margin / 100);
            form.setFieldsValue({ new_med_sell_price: Math.ceil(sell) });
        }
    };

    return (
        <Modal
            title="Nhập kho & Quản lý Thuốc"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={importMutation.isPending}
            width={900}
            okText="Xác nhận Nhập kho"
        >
            <Form form={form} layout="vertical" onValuesChange={handleValuesChange} onFinish={(v) => importMutation.mutate(v)}
                initialValues={{
                    quantity_cartons: 1, boxes_per_carton: 1, blisters_per_box: 1, pills_per_blister: 1,
                    new_med_base_unit: 'Viên', new_med_import_unit: 'Hộp', new_med_conversion_factor: 10, new_med_profit_margin: 20
                }}
            >
                {/* 0. CHỌN CHI NHÁNH (ADMIN ONLY) */}
                {!userBranchId && (
                    <Form.Item name="branch_id" label={<span className="text-orange-600"><ShopOutlined /> Chi nhánh nhập</span>} rules={[{ required: true }]}>
                        <Select placeholder="Chọn chi nhánh..." options={branches?.map((b: any) => ({ label: b.name, value: b.id }))} />
                    </Form.Item>
                )}

                {/* 1. CHỌN CHẾ ĐỘ: THUỐC CŨ HAY MỚI */}
                <div className="mb-4 text-center">
                    <Radio.Group value={mode} onChange={e => setMode(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="existing">Thuốc đã có trong danh mục</Radio.Button>
                        <Radio.Button value="new"><PlusOutlined /> Tạo thuốc mới & Nhập kho</Radio.Button>
                    </Radio.Group>
                </div>

                <Row gutter={24}>
                    {/* CỘT TRÁI: THÔNG TIN THUỐC */}
                    <Col span={12}>
                        <Card title="Thông tin Thuốc" size="small" className={mode === 'new' ? 'border-blue-300 bg-blue-50' : ''}>
                            {mode === 'existing' ? (
                                <Form.Item name="medication_id" label="Tìm chọn thuốc" rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}>
                                    <Select
                                        showSearch placeholder="Gõ tên thuốc..." optionFilterProp="children"
                                        filterOption={(input, option: any) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                                    >
                                        {medications.map(med => (
                                            <Option key={med.id} value={med.id}>{med.code} - {med.name} (Tồn: {med.inventory_qty || 0})</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : (
                                <>
                                    <Row gutter={8}>
                                        <Col span={16}><Form.Item name="new_med_name" label="Tên thuốc mới" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col span={8}><Form.Item name="new_med_code" label="Mã thuốc"><Input placeholder="Tự sinh" /></Form.Item></Col>
                                    </Row>
                                    <Row gutter={8}>
                                        <Col span={12}><Form.Item name="new_med_base_unit" label="Đơn vị tính"><Select><Option value="Viên">Viên</Option><Option value="Gói">Gói</Option><Option value="Ống">Ống</Option></Select></Form.Item></Col>
                                        <Col span={12}><Form.Item name="new_med_import_unit" label="Đơn vị nhập"><Input /></Form.Item></Col>
                                    </Row>
                                </>
                            )}
                        </Card>

                        {/* THÔNG TIN LÔ HÀNG */}
                        <Card title="Lô sản xuất" size="small" className="mt-4">
                            <Form.Item name="batch_number" label="Số lô (Batch No.)" rules={[{ required: true }]}><Input /></Form.Item>
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="mfg_date" label="Ngày SX" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="expiry_date" label="Hạn SD" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: QUY CÁCH & GIÁ TRỊ */}
                    <Col span={12}>
                        <Card title={<><CalculatorOutlined /> Quy cách nhập</>} size="small" className="bg-gray-50">
                            <Row gutter={8}>
                                <Col span={12}><Form.Item name="quantity_cartons" label="Số Thùng"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="boxes_per_carton" label="Hộp/Thùng"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="blisters_per_box" label="Vỉ/Hộp (hoặc 1)"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="pills_per_blister" label="Viên/Vỉ"><InputNumber min={1} className="w-full" /></Form.Item></Col>
                            </Row>
                            <Divider style={{ margin: '8px 0' }} />
                            <Statistic title="Tổng số lượng nhập (Viên)" value={totalPills} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
                        </Card>

                        <Card title={<><DollarOutlined /> Tài chính</>} size="small" className="mt-4">
                            <Form.Item name="total_import_cost" label="Tổng tiền nhập hàng (VNĐ)" rules={[{ required: true }]}>
                                <InputNumber className="w-full" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                            </Form.Item>

                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded mb-4">
                                <Text type="secondary">Giá vốn/viên:</Text>
                                <Text strong>{costPerPill.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫</Text>
                            </div>

                            {/* CHỈ HIỆN KHI TẠO THUỐC MỚI */}
                            {mode === 'new' && (
                                <div className="border-t pt-2 border-dashed">
                                    <Row gutter={8}>
                                        <Col span={12}><Form.Item name="new_med_profit_margin" label="% Lãi"><InputNumber min={0} className="w-full" /></Form.Item></Col>
                                        <Col span={12}>
                                            <Form.Item name="new_med_sell_price" label="Giá bán (Gợi ý)">
                                                <InputNumber className="w-full text-green-600 font-bold" formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
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
}