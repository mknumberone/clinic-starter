import { useEffect } from 'react';
import { Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

const { TextArea } = Input;
const { Option } = Select;

interface EditDoctorModalProps {
    open: boolean;
    onCancel: () => void;
    doctorData: any; // Dữ liệu bác sĩ hiện tại
}

export default function EditDoctorModal({ open, onCancel, doctorData }: EditDoctorModalProps) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Load danh sách Chuyên khoa để chọn
    const { data: specializations } = useQuery({
        queryKey: ['specializations'],
        queryFn: async () => (await axiosInstance.get('/specializations')).data,
        enabled: open, // Chỉ load khi mở modal
    });

    // Load danh sách Chi nhánh để chọn
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => (await axiosInstance.get('/branches')).data,
        enabled: open,
    });

    // Đổ dữ liệu vào form khi mở Modal
    useEffect(() => {
        if (open && doctorData) {
            form.setFieldsValue({
                // Map dữ liệu từ cấu trúc API vào Form
                full_name: doctorData.user?.full_name,
                phone: doctorData.user?.phone,
                email: doctorData.user?.email, // Email thường readonly
                branch_id: doctorData.user?.branch_id,

                code: doctorData.code,
                title: doctorData.title,
                specialization_id: doctorData.specialization_id, // Lấy ID chuyên khoa
                biography: doctorData.biography,
            });
        }
    }, [open, doctorData, form]);

    // Mutation cập nhật
    const updateMutation = useMutation({
        mutationFn: (values: any) => axiosInstance.put(`/doctors/${doctorData.id}`, values),
        onSuccess: () => {
            message.success('Cập nhật thông tin bác sĩ thành công');
            queryClient.invalidateQueries({ queryKey: ['doctor', doctorData.id] }); // Reload lại trang chi tiết
            onCancel();
        },
        onError: () => {
            message.error('Có lỗi xảy ra khi cập nhật');
        },
    });

    const handleFinish = (values: any) => {
        const { email, ...dataToSend } = values;
        updateMutation.mutate(dataToSend);
    };

    return (
        <Modal
            title="Chỉnh sửa thông tin Bác sĩ"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={updateMutation.isPending}
            width={700}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={16}>
                    {/* Cột 1: Thông tin cá nhân (User) */}
                    <Col span={12}>
                        <h4 className="text-gray-500 mb-4 border-b pb-2">Thông tin cá nhân</h4>
                        <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Email (Không thể sửa)" name="email">
                            <Input disabled className="bg-gray-100" />
                        </Form.Item>
                        <Form.Item label="Chi nhánh làm việc" name="branch_id" rules={[{ required: true }]}>
                            <Select placeholder="Chọn chi nhánh">
                                {branches?.map((b: any) => (
                                    <Option key={b.id} value={b.id}>{b.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {/* Cột 2: Thông tin chuyên môn (Doctor) */}
                    <Col span={12}>
                        <h4 className="text-gray-500 mb-4 border-b pb-2">Thông tin chuyên môn</h4>
                        <Form.Item label="Mã bác sĩ" name="code" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Chức danh" name="title">
                            <Select>
                                <Option value="Bác sĩ">Bác sĩ</Option>
                                <Option value="Thạc sĩ">Thạc sĩ</Option>
                                <Option value="Tiến sĩ">Tiến sĩ</Option>
                                <Option value="PGS.TS">PGS.TS</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Chuyên khoa" name="specialization_id" rules={[{ required: true, message: 'Vui lòng chọn khoa' }]}>
                            <Select placeholder="Chọn chuyên khoa">
                                {specializations?.map((s: any) => (
                                    <Option key={s.id} value={s.id}>{s.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Tiểu sử / Kinh nghiệm" name="biography">
                    <TextArea rows={4} placeholder="Mô tả kinh nghiệm làm việc..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}