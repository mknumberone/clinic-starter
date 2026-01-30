import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Card, Form, Input, Button, Table, Select, InputNumber,
    message, Row, Col, Typography, Divider, Popconfirm, Tag, Switch, Tooltip
} from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined, MedicineBoxOutlined, ShopOutlined, HomeOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { appointmentService } from '@/services/appointment.service';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CreatePrescription() {
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [mainForm] = Form.useForm();

    const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);

    // STATE MỚI: Quản lý chế độ kê thuốc (Trong kho / Ngoài)
    const [isExternal, setIsExternal] = useState(false);
    const [selectedMedInfo, setSelectedMedInfo] = useState<any>(null);

    // 1. Load data (Lịch hẹn & Danh mục thuốc)
    const { data: appointment } = useQuery({
        queryKey: ['appt-prescription', appointmentId],
        queryFn: () => appointmentService.getAppointmentById(appointmentId!),
        enabled: !!appointmentId,
    });

    const { data: medications } = useQuery({
        queryKey: ['medications-list'],
        queryFn: async () => {
            const res = await axiosInstance.get('/prescriptions/medications/list');
            return Array.isArray(res.data) ? res.data : [];
        }
    });

    // 2. Xử lý chọn thuốc kho
    const handleSelectMedication = (medId: string) => {
        const med = medications?.find((m: any) => m.id === medId);
        if (med) {
            setSelectedMedInfo(med);
            form.setFieldsValue({
                name: med.name, // Lưu tên thuốc để hiển thị
                unit: med.base_unit
            });
        }
    };

    // 3. Thêm thuốc vào danh sách
    const handleAddItem = () => {
        form.validateFields().then(values => {
            // Logic cho thuốc TRONG KHO
            if (!isExternal) {
                // Check trùng
                const exists = prescriptionItems.find(item => item.medication_id === values.medication_id);
                if (exists) {
                    message.warning('Thuốc này đã có trong đơn!');
                    return;
                }
                const med = medications?.find((m: any) => m.id === values.medication_id);

                setPrescriptionItems([...prescriptionItems, {
                    key: Date.now(),
                    is_external: false, // Flag quan trọng
                    medication_id: values.medication_id,
                    name: med ? med.name : 'Unknown',
                    dosage: values.dosage,
                    frequency: values.frequency,
                    quantity: values.quantity,
                    unit: med?.base_unit || 'Viên',
                    price: med?.sell_price || 0,
                    total: (med?.sell_price || 0) * values.quantity
                }]);
            }
            // Logic cho thuốc NGOÀI (TỰ MUA)
            else {
                setPrescriptionItems([...prescriptionItems, {
                    key: Date.now(),
                    is_external: true, // Flag quan trọng
                    medication_id: null, // Không có ID kho
                    name: values.external_name, // Tên nhập tay
                    dosage: values.dosage,
                    frequency: values.frequency,
                    quantity: values.quantity,
                    unit: values.unit || 'Viên',
                    price: 0, // Không tính tiền
                    total: 0
                }]);
            }

            form.resetFields();
            setSelectedMedInfo(null);
        });
    };

    const handleDeleteItem = (key: number) => {
        setPrescriptionItems(items => items.filter(item => item.key !== key));
    };

    const updateQuantity = (key: number, newQuantity: number) => {
        setPrescriptionItems(items => items.map(item => {
            if (item.key === key) {
                return {
                    ...item,
                    quantity: newQuantity,
                    total: item.price * newQuantity
                };
            }
            return item;
        }));
    };

    // 4. Chỉ tính tổng tiền cho thuốc TRONG KHO
    const totalPrescriptionAmount = useMemo(() => {
        return prescriptionItems.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [prescriptionItems]);

    const submitMutation = useMutation({
        mutationFn: async (values: any) => {
            if (prescriptionItems.length === 0) throw new Error("Đơn thuốc trống!");

            const payload = {
                appointment_id: appointmentId,
                medical_record_id: appointment?.medical_record?.id,
                notes: values.notes,

                items: prescriptionItems.map(item => ({
                    medication_id: item.medication_id, // Null nếu là thuốc ngoài
                    name: item.name, // Gửi tên thuốc (quan trọng cho thuốc ngoài)
                    quantity: item.quantity,
                    dosage: item.dosage,
                    frequency: item.frequency
                }))
            };
            return axiosInstance.post('/prescriptions', payload);
        },
        onSuccess: () => {
            message.success('Đã lưu đơn thuốc thành công!');
            navigate('/doctor/dashboard');
        }
    });

    const columns = [
        {
            title: 'Loại',
            dataIndex: 'is_external',
            width: 80,
            render: (ext: boolean) => ext ?
                <Tooltip title="Bệnh nhân tự mua"><Tag color="orange"><ShopOutlined /></Tag></Tooltip> :
                <Tooltip title="Thuốc tại phòng khám"><Tag color="blue"><HomeOutlined /></Tag></Tooltip>
        },
        {
            title: 'Tên thuốc',
            dataIndex: 'name',
            render: (text: string, record: any) => (
                <div>
                    <span className="font-bold">{text}</span>
                    <div className="text-xs text-gray-500">Đơn vị: {record.unit}</div>
                </div>
            )
        },
        { title: 'Liều lượng', dataIndex: 'dosage' },
        { title: 'Cách dùng', dataIndex: 'frequency' },
        {
            title: 'SL',
            dataIndex: 'quantity',
            width: 80,
            render: (qty: number, record: any) => (
                <InputNumber min={1} size="small" value={qty} onChange={(val) => updateQuantity(record.key, Number(val))} />
            )
        },
        {
            title: 'Thành tiền',
            dataIndex: 'total',
            align: 'right' as const,
            width: 120,
            render: (val: number, record: any) =>
                record.is_external ?
                    <span className="text-gray-400 italic">Tự mua</span> :
                    <span className="font-bold text-green-700">{val?.toLocaleString()} ₫</span>
        },
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_: any, record: any) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.key)} />
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-4 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <Title level={3} className="m-0 text-blue-600"><MedicineBoxOutlined /> Kê Đơn Thuốc</Title>
                        <Text type="secondary">Bệnh nhân: <b>{appointment?.patient?.user?.full_name}</b></Text>
                    </div>
                    <div className="text-right">
                        <Tag color="green" className="text-lg px-3 py-1">
                            Tổng thanh toán: {totalPrescriptionAmount.toLocaleString('vi-VN')} ₫
                        </Tag>
                    </div>
                </div>

                <Row gutter={24}>
                    {/* FORM NHẬP */}
                    <Col span={9}>
                        <Card size="small" className="shadow-sm border-blue-100 h-full">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold">Chế độ kê đơn:</span>
                                <Switch
                                    checkedChildren="Thuốc ngoài"
                                    unCheckedChildren="Thuốc kho"
                                    checked={isExternal}
                                    onChange={setIsExternal}
                                    className={isExternal ? "bg-orange-500" : "bg-blue-500"}
                                />
                            </div>

                            <Form form={form} layout="vertical" onFinish={handleAddItem} initialValues={{ unit: 'Viên', quantity: 1 }}>
                                {!isExternal ? (
                                    // MODE: THUỐC TRONG KHO
                                    <>
                                        <Form.Item name="medication_id" label="Chọn thuốc từ kho" rules={[{ required: true }]}>
                                            <Select
                                                showSearch placeholder="Tìm thuốc..."
                                                optionFilterProp="children" onChange={handleSelectMedication}
                                                filterOption={(input, option: any) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                                            >
                                                {medications?.map((m: any) => (
                                                    <Option key={m.id} value={m.id}>
                                                        {m.name} - {Number(m.sell_price).toLocaleString()}đ (Tồn: {m.inventory_qty})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        {selectedMedInfo && (
                                            <div className="bg-blue-50 p-2 mb-4 rounded text-xs flex justify-between text-blue-800">
                                                <span>Kho còn: <b>{selectedMedInfo.inventory_qty}</b></span>
                                                <span>Giá: <b>{Number(selectedMedInfo.sell_price).toLocaleString()} ₫</b></span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // MODE: THUỐC NGOÀI
                                    <>
                                        <Form.Item name="external_name" label="Tên thuốc (Nhập tay)" rules={[{ required: true }]}>
                                            <Input placeholder="VD: Thuốc X (Mua ngoài)..." prefix={<ShopOutlined />} />
                                        </Form.Item>
                                        <Form.Item name="unit" label="Đơn vị">
                                            <Select><Option value="Viên">Viên</Option><Option value="Gói">Gói</Option><Option value="Chai">Chai</Option></Select>
                                        </Form.Item>
                                    </>
                                )}

                                <Row gutter={12}>
                                    <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item></Col>
                                    <Col span={12}><Form.Item name="dosage" label="Liều lượng" rules={[{ required: true }]}><Input placeholder="Sáng 1..." /></Form.Item></Col>
                                </Row>
                                <Form.Item name="frequency" label="Cách dùng"><Input placeholder="Sau ăn..." /></Form.Item>

                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block className={isExternal ? "bg-orange-500" : ""}>
                                    {isExternal ? "Thêm thuốc ngoài" : "Thêm thuốc kho"}
                                </Button>
                            </Form>
                        </Card>
                    </Col>

                    {/* DANH SÁCH */}
                    <Col span={15}>
                        <Card className="shadow-sm border-gray-200 h-full flex flex-col">
                            <Table
                                dataSource={prescriptionItems}
                                columns={columns}
                                pagination={false} size="small" scroll={{ y: 300 }}
                                summary={() => (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row className="bg-gray-50">
                                            <Table.Summary.Cell index={0} colSpan={5} className="text-right font-bold">TỔNG TIỀN (Chỉ thuốc kho):</Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} className="text-right font-bold text-lg text-green-700">
                                                {totalPrescriptionAmount.toLocaleString()} ₫
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                )}
                            />
                            <Divider />
                            <Form
                                form={mainForm}
                                layout="vertical"
                                onFinish={(values) => submitMutation.mutate(values)}
                            >
                                <Form.Item name="notes" label="Lời dặn bác sĩ">
                                    <Input.TextArea rows={2} placeholder="Nghỉ ngơi, kiêng rượu bia..." />
                                </Form.Item>

                                <div className="flex justify-end gap-3 mt-4">
                                    <Button onClick={() => navigate(-1)}>Hủy</Button>

                                    <Popconfirm
                                        title="Lưu đơn thuốc?"
                                        description={`Tổng tiền dự kiến: ${totalPrescriptionAmount.toLocaleString()}đ. Bạn chắc chắn muốn hoàn tất?`}
                                        onConfirm={() => mainForm.submit()} // Hàm này sẽ kích hoạt onFinish ở trên
                                        okText="Lưu & Kết thúc"
                                        cancelText="Hủy"
                                    >
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<SaveOutlined />}
                                            loading={submitMutation.isPending}
                                        // Nếu muốn bắt buộc phải có thuốc mới cho lưu thì để dòng này, không thì bỏ đi
                                        // disabled={prescriptionItems.length === 0} 
                                        >
                                            Hoàn tất Kê đơn
                                        </Button>
                                    </Popconfirm>
                                </div>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </div>
        </DashboardLayout>
    );
}