import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Form, Input, Button, Row, Col, Typography, message, Spin, Divider } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { appointmentService } from '@/services/appointment.service';
import axiosInstance from '@/lib/axios';
import GeneralForm from '@/components/examination-forms/GeneralForm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MedicalExamination() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // 1. Lấy thông tin lịch hẹn
    const { data: appointment, isLoading } = useQuery({
        queryKey: ['appointment-exam', appointmentId],
        queryFn: () => appointmentService.getAppointmentById(appointmentId!),
        enabled: !!appointmentId,
    });

    // 2. Hàm lưu và chuyển tiếp
    const submitMutation = useMutation({
        mutationFn: (values: any) => {
            // Validate dữ liệu trước khi gọi API
            if (!appointment?.doctor_assigned_id) {
                throw new Error("Không tìm thấy thông tin bác sĩ trong lịch hẹn!");
            }

            return axiosInstance.post('/medical-records', {
                appointment_id: appointmentId,
                patient_id: appointment?.patient_id,
                doctor_id: appointment?.doctor_assigned_id,
                diagnosis: values.diagnosis,
                symptoms: values.symptoms,
                clinical_data: values.clinical_data || {},
            });
        },
        onSuccess: () => {
            message.success('Lưu bệnh án thành công!');
            // Chuyển sang trang kê đơn (Bước tiếp theo)
            navigate(`/doctor/prescription/create?appointmentId=${appointmentId}`);
        },
        onError: () => message.error('Lỗi khi lưu bệnh án'),
    });

    if (isLoading || !appointment) return <Spin fullscreen tip="Đang tải hồ sơ..." />;

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6 bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
                    <Title level={4} style={{ margin: 0 }}>Khám bệnh: {appointment.doctor?.specialization?.name || 'Đa khoa'}</Title>
                    <div className="mt-2">
                        <Text>Bệnh nhân: <strong className="text-lg mr-4">{appointment.patient?.user?.full_name}</strong></Text>
                        <Text type="secondary">Sinh năm: {dayjs(appointment.patient?.date_of_birth).format('YYYY')}</Text>
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(vals) => submitMutation.mutate(vals)}
                    initialValues={{ symptoms: appointment.notes }}
                >
                    <Row gutter={24}>
                        {/* TRÁI: CHẨN ĐOÁN */}
                        <Col span={12} xs={24}>
                            <Card title="1. Chẩn đoán & Triệu chứng" className="h-full shadow-sm">
                                <Form.Item name="symptoms" label="Triệu chứng cơ năng (Lý do khám)" rules={[{ required: true }]}>
                                    <TextArea rows={4} />
                                </Form.Item>
                                <Form.Item name="diagnosis" label="Chẩn đoán sơ bộ" rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}>
                                    <TextArea rows={4} placeholder="Ví dụ: Viêm họng cấp, Sốt xuất huyết..." />
                                </Form.Item>
                            </Card>
                        </Col>

                        {/* PHẢI: CHỈ SỐ KHÁM */}
                        <Col span={12} xs={24}>
                            <Card title="2. Chỉ số sinh tồn & Khám chi tiết" className="h-full shadow-sm bg-gray-50">
                                {/* Ở đây gọi form con */}
                                <GeneralForm />
                            </Card>
                        </Col>
                    </Row>

                    <Divider />

                    <div className="flex justify-end gap-4 pb-10">
                        <Button size="large" onClick={() => navigate(-1)}>Quay lại</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<ArrowRightOutlined />}
                            size="large"
                            loading={submitMutation.isPending}
                            className="bg-green-600 hover:bg-green-500"
                        >
                            Lưu Bệnh Án & Kê Đơn Thuốc
                        </Button>
                    </div>
                </Form>
            </div>
        </DashboardLayout>
    );
}