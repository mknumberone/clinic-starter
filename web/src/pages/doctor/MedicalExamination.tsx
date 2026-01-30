import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Card, Form, Input, Button, Row, Col, Typography, message,
    Spin, Divider, Upload, Modal
} from 'antd';
import { ArrowRightOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile, UploadProps } from 'antd/es/upload/interface';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import { appointmentService } from '@/services/appointment.service';
import axiosInstance from '@/lib/axios';
import GeneralForm from '@/components/examination-forms/GeneralForm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Hàm hỗ trợ xem trước ảnh (Preview)
const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

export default function MedicalExamination() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // --- 1. STATE QUẢN LÝ ẢNH ---
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Xử lý xem trước ảnh
    const handleCancel = () => setPreviewOpen(false);
    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as RcFile);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
    };
    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
        setFileList(newFileList);

    // --- 2. LẤY THÔNG TIN LỊCH HẸN ---
    const { data: appointment, isLoading } = useQuery({
        queryKey: ['appointment-exam', appointmentId],
        queryFn: () => appointmentService.getAppointmentById(appointmentId!),
        enabled: !!appointmentId,
    });

    // --- 3. LOGIC LƯU VÀ UPLOAD ---
    const submitMutation = useMutation({
        mutationFn: async (values: any) => {
            if (!appointment?.doctor_assigned_id) {
                throw new Error("Không tìm thấy thông tin bác sĩ trong lịch hẹn!");
            }

            // BƯỚC A: Upload ảnh lên Server (nếu có)
            let attachmentUrls: string[] = [];

            if (fileList.length > 0) {
                const formData = new FormData();
                // Chỉ lấy các file chưa được upload (có originFileObj)
                fileList.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append('files', file.originFileObj);
                    }
                });

                // Gọi API upload nhiều ảnh
                if (formData.has('files')) {
                    const uploadRes = await axiosInstance.post('/upload/images/multiple', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (uploadRes.data.success) {
                        // Backend trả về: { success: true, data: [{ url: '...' }, ...] }
                        attachmentUrls = uploadRes.data.data.map((item: any) => item.url);
                    }
                }
            }

            // BƯỚC B: Gửi dữ liệu bệnh án kèm danh sách ảnh
            return axiosInstance.post('/medical-records', {
                appointment_id: appointmentId,
                patient_id: appointment?.patient_id,
                doctor_id: appointment?.doctor_assigned_id,
                diagnosis: values.diagnosis,
                symptoms: values.symptoms,
                clinical_data: values.clinical_data || {},
                attachments: attachmentUrls, // <--- Gửi mảng URL ảnh
            });
        },
        onSuccess: () => {
            message.success('Lưu bệnh án thành công!');
            navigate(`/doctor/prescription/create?appointmentId=${appointmentId}`);
        },
        onError: (err) => {
            console.error(err);
            message.error('Lỗi khi lưu bệnh án');
        },
    });

    if (isLoading || !appointment) return <Spin fullscreen tip="Đang tải hồ sơ..." />;

    // Nút upload
    const uploadButton = (
        <button style={{ border: 0, background: 'none' }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Thêm ảnh</div>
        </button>
    );

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
                        {/* CỘT TRÁI: CHẨN ĐOÁN & ẢNH */}
                        <Col span={12} xs={24}>
                            <Card title="1. Chẩn đoán & Hình ảnh" className="h-full shadow-sm">
                                <Form.Item name="symptoms" label="Triệu chứng cơ năng (Lý do khám)" rules={[{ required: true }]}>
                                    <TextArea rows={3} />
                                </Form.Item>
                                <Form.Item name="diagnosis" label="Chẩn đoán sơ bộ" rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán' }]}>
                                    <TextArea rows={3} placeholder="Ví dụ: Viêm họng cấp, Sốt xuất huyết..." />
                                </Form.Item>

                                {/* --- PHẦN UPLOAD MỚI --- */}
                                <Form.Item label="Hình ảnh minh họa (X-quang, Siêu âm, Vết thương...)">
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onPreview={handlePreview}
                                        onChange={handleChange}
                                        beforeUpload={() => false} // Chặn upload tự động, để xử lý khi bấm Lưu
                                        accept="image/*"
                                        multiple
                                        maxCount={8}
                                    >
                                        {fileList.length >= 8 ? null : uploadButton}
                                    </Upload>
                                </Form.Item>
                            </Card>
                        </Col>

                        {/* CỘT PHẢI: CHỈ SỐ KHÁM */}
                        <Col span={12} xs={24}>
                            <Card title="2. Chỉ số sinh tồn & Khám chi tiết" className="h-full shadow-sm bg-gray-50">
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
                            {submitMutation.isPending ? 'Đang xử lý...' : 'Lưu Bệnh Án & Kê Đơn'}
                        </Button>
                    </div>
                </Form>

                {/* Modal xem trước ảnh */}
                <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
                    <img alt="example" style={{ width: '100%' }} src={previewImage} />
                </Modal>
            </div>
        </DashboardLayout>
    );
}