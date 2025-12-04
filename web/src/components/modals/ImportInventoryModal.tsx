import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Row, Col, Typography, Divider, Card, Statistic, message } from 'antd';
import { CalculatorOutlined, DollarOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface ImportInventoryModalProps {
    open: boolean;
    onCancel: () => void;
    branchId: string; // ID chi nhánh hiện tại
    medications: any[]; // Danh sách thuốc để chọn
}

export default function ImportInventoryModal({ open, onCancel, branchId, medications }: ImportInventoryModalProps) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // State để hiển thị tính toán realtime
    const [totalPills, setTotalPills] = useState(0);
    const [costPerPill, setCostPerPill] = useState(0);

    // API nhập kho
    const importMutation = useMutation({
        mutationFn: async (values: any) => {
            // Format lại dữ liệu cho đúng DTO Backend
            const payload = {
                branch_id: branchId,
                items: [{
                    medication_id: values.medication_id,
                    batch_number: values.batch_number,
                    mfg_date: values.mfg_date.toISOString(),
                    expiry_date: values.expiry_date.toISOString(),

                    // Các thông số quy đổi
                    quantity_cartons: values.quantity_cartons,
                    boxes_per_carton: values.boxes_per_carton,
                    blisters_per_box: values.blisters_per_box || 1, // Mặc định 1 nếu là chai/lọ
                    pills_per_blister: values.pills_per_blister,

                    total_import_cost: values.total_import_cost
                }]
            };
            return axiosInstance.post('/inventory/import', payload);
        },
        onSuccess: () => {
            message.success('Nhập kho thành công!');
            queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Refresh lại bảng kho
            form.resetFields();
            setTotalPills(0);
            setCostPerPill(0);
            onCancel();
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    // Hàm tính toán tự động khi thay đổi bất kỳ ô nhập liệu nào
    const handleValuesChange = (_: any, allValues: any) => {
        const cartons = allValues.quantity_cartons || 0;
        const boxes = allValues.boxes_per_carton || 0;
        const blisters = allValues.blisters_per_box || 1;
        const pills = allValues.pills_per_blister || 0;
        const totalCost = allValues.total_import_cost || 0;

        // 1. Tính tổng số viên
        const total = cartons * boxes * blisters * pills;
        setTotalPills(total);

        // 2. Tính giá vốn mỗi viên (để user tham khảo)
        if (total > 0) {
            setCostPerPill(totalCost / total);
        } else {
            setCostPerPill(0);
        }
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            importMutation.mutate(values);
        });
    };

    return (
        <Modal
            title={<><MedicineBoxOutlined /> Nhập kho thuốc mới</>}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={importMutation.isPending}
            width={800}
            okText="Nhập kho"
            cancelText="Hủy"
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                initialValues={{
                    quantity_cartons: 1,
                    boxes_per_carton: 1,
                    blisters_per_box: 1,
                    pills_per_blister: 1
                }}
            >
                {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
                <Card size="small" className="mb-4 bg-gray-50">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="medication_id"
                                label="Chọn thuốc"
                                rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Tìm tên thuốc hoặc mã..."
                                    optionFilterProp="children"
                                >
                                    {medications.map(med => (
                                        <Option key={med.id} value={med.id}>
                                            {med.code} - {med.name} ({med.base_unit})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="batch_number"
                                label="Số lô sản xuất"
                                rules={[{ required: true, message: 'Nhập số lô' }]}
                            >
                                <Input placeholder="VD: LOT12345" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="mfg_date"
                                label="Ngày sản xuất"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="expiry_date"
                                label="Hạn sử dụng"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* PHẦN 2: TÍNH TOÁN SỐ LƯỢNG */}
                <Title level={5}><CalculatorOutlined /> Quy cách & Số lượng nhập</Title>
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                    <Row gutter={16} align="middle">
                        <Col span={6}>
                            <Form.Item
                                name="quantity_cartons"
                                label="Số Thùng nhập"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={1} className="text-center pt-2">×</Col>
                        <Col span={5}>
                            <Form.Item
                                name="boxes_per_carton"
                                label="Hộp / Thùng"
                                tooltip="1 Thùng có bao nhiêu Hộp?"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={1} className="text-center pt-2">×</Col>
                        <Col span={5}>
                            <Form.Item
                                name="blisters_per_box"
                                label="Vỉ / Hộp"
                                tooltip="1 Hộp có bao nhiêu Vỉ? (Nếu là chai lọ nhập 1)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={1} className="text-center pt-2">×</Col>
                        <Col span={5}>
                            <Form.Item
                                name="pills_per_blister"
                                label="Viên / Vỉ"
                                tooltip="1 Vỉ có bao nhiêu Viên?"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* HIỂN THỊ KẾT QUẢ TÍNH TOÁN */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Statistic
                                title="Tổng số viên nhập vào kho"
                                value={totalPills}
                                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                                suffix="viên"
                            />
                        </Col>
                        <Col span={12}>
                            <Text type="secondary" className="text-xs">
                                Hệ thống sẽ lưu trữ theo đơn vị nhỏ nhất (Viên) để phục vụ kê đơn lẻ.
                            </Text>
                        </Col>
                    </Row>
                </div>

                {/* PHẦN 3: GIÁ TRỊ */}
                <Title level={5}><DollarOutlined /> Giá trị lô hàng</Title>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="total_import_cost"
                            label="Tổng tiền nhập hàng (VNĐ)"
                            rules={[{ required: true, message: 'Vui lòng nhập tổng tiền' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                addonAfter="₫"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <div className="bg-gray-100 p-2 rounded h-[56px] flex flex-col justify-center">
                            <Text type="secondary" className="text-xs">Giá vốn ước tính mỗi viên:</Text>
                            <Text strong className="text-blue-600 text-lg">
                                {costPerPill.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ₫ / viên
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}