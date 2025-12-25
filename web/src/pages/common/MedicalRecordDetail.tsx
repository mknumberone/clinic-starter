import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Descriptions, Table, Typography,
    Button, Spin, Row, Col, Divider, Empty, Tag, Image
} from 'antd';
import {
    ArrowLeftOutlined, PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { appointmentService } from '@/services/appointment.service';
import { uploadService } from '@/services/upload.service'; // <--- 1. Import service upload

const { Title, Text } = Typography;

export default function MedicalRecordDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Gọi API lấy chi tiết lịch hẹn
    const { data: record, isLoading } = useQuery({
        queryKey: ['medical-record-detail', id],
        queryFn: () => appointmentService.getAppointmentById(id!),
        enabled: !!id,
    });

    if (isLoading) return <Spin fullscreen tip="Đang tải bệnh án..." />;

    if (!record || !record.medical_record) {
        return (
            <DashboardLayout>
                <div className="p-10 text-center">
                    <Empty description="Chưa có dữ liệu bệnh án cho lịch hẹn này" />
                    <Button onClick={() => navigate(-1)} className="mt-4">Quay lại</Button>
                </div>
            </DashboardLayout>
        );
    }

    const { medical_record, prescriptions, patient, doctor, branch } = record;
    const clinicalData = medical_record.clinical_data || {};
    // <--- 2. Lấy danh sách ảnh (nếu không có thì là mảng rỗng)
    const attachments = (medical_record.attachments as string[]) || [];

    // Cấu hình cột cho bảng đơn thuốc
    const prescriptionColumns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            render: (_: any, __: any, index: number) => index + 1,
            align: 'center' as const
        },
        {
            title: 'Tên thuốc',
            dataIndex: 'name',
            key: 'name',
            render: (t: string) => <span className="font-semibold text-gray-800">{t}</span>
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center' as const,
            render: (qty: number) => <span className="font-bold">{qty}</span>
        },
        {
            title: 'Liều dùng',
            dataIndex: 'dosage',
            key: 'dosage'
        },
        {
            title: 'Cách dùng',
            dataIndex: 'frequency',
            key: 'frequency'
        },
    ];

    const currentPrescription = prescriptions && prescriptions.length > 0 ? prescriptions[0] : null;

    return (
        <DashboardLayout>
            <div className="py-8 px-[48px] bg-gray-100 min-h-screen flex flex-col items-center">

                {/* Toolbar */}
                <div className="w-full max-w-5xl flex justify-between mb-6 print:hidden">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Trở về</Button>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>In Phiếu Kết Quả</Button>
                </div>

                {/* A4 Paper Container */}
                <div
                    className="
              bg-white 
              shadow-xl 
              w-full 
              min-h-[297mm] 
              px-20 py-12 
              print:shadow-none 
              print:w-full 
              print:p-12 
              print:m-0
            "
                    id="medical-record-print"
                >

                    {/* 1. HEADER */}
                    <Row gutter={24} align="middle" className="border-b-2 border-gray-800 pb-6 mb-8">
                        <Col span={5}>
                            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-sm print:border print:border-gray-300">
                                C
                            </div>
                        </Col>
                        <Col span={19}>
                            <div className="text-center">
                                <Title level={4} style={{ marginBottom: 4, textTransform: 'uppercase', color: '#374151', letterSpacing: '1px' }}>
                                    {branch?.name || 'PHÒNG KHÁM ĐA KHOA CLINIC'}
                                </Title>
                                <Text className="block text-gray-500 text-sm mb-1">{branch?.address}</Text>
                                <Text className="block text-gray-500 text-sm">Hotline: <span className="font-semibold text-gray-700">{branch?.phone || '1900 xxxx'}</span></Text>

                                <Title level={2} style={{ marginTop: 24, marginBottom: 0, color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 800 }}>
                                    Phiếu Kết Quả Khám Bệnh
                                </Title>
                            </div>
                        </Col>
                    </Row>

                    {/* 2. THÔNG TIN HÀNH CHÍNH */}
                    <div className="mb-8">
                        <div className="bg-blue-50 py-2 px-4 mb-4 border-l-4 border-blue-600 print:bg-gray-100">
                            <Text strong className="uppercase text-blue-800 print:text-black">I. Hành chính</Text>
                        </div>

                        <Descriptions column={2} size="middle" labelStyle={{ fontWeight: 600, color: '#4b5563', width: '140px' }} contentStyle={{ color: '#111827', fontWeight: 500 }}>
                            <Descriptions.Item label="Họ tên">
                                <span className="uppercase font-bold text-lg">{patient?.user?.full_name}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Năm sinh">
                                {dayjs(patient?.date_of_birth).format('YYYY')} ({dayjs().year() - dayjs(patient?.date_of_birth).year()} tuổi)
                            </Descriptions.Item>
                            <Descriptions.Item label="Giới tính">{patient?.gender === 'MALE' ? 'Nam' : 'Nữ'}</Descriptions.Item>
                            <Descriptions.Item label="Điện thoại">{patient?.user?.phone}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>{patient?.address || '---'}</Descriptions.Item>
                            <Descriptions.Item label="Bác sĩ khám">{doctor?.user?.full_name}</Descriptions.Item>
                            <Descriptions.Item label="Chuyên khoa">
                                <Tag color="blue">{doctor?.specialization?.name}</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    {/* 3. THÔNG TIN KHÁM */}
                    <div className="mb-8">
                        <div className="bg-blue-50 py-2 px-4 mb-4 border-l-4 border-blue-600 print:bg-gray-100">
                            <Text strong className="uppercase text-blue-800 print:text-black">II. Thông tin khám bệnh</Text>
                        </div>

                        <Row gutter={[48, 24]}>
                            <Col span={24}>
                                <Text type="secondary" className="block text-xs uppercase tracking-wider mb-1 font-semibold">Lý do khám / Triệu chứng</Text>
                                <p className="text-gray-900 font-medium text-base border-b border-gray-200 pb-2">
                                    {medical_record.symptoms}
                                </p>
                            </Col>

                            <Col span={24}>
                                <Text type="secondary" className="block text-xs uppercase tracking-wider mb-3 font-semibold">Chỉ số sinh tồn</Text>
                                <div className="grid grid-cols-4 gap-6">
                                    <div className="border border-gray-200 rounded p-3 text-center bg-gray-50 print:border-gray-400">
                                        <div className="text-xs text-gray-500 mb-1">Mạch</div>
                                        <div className="font-bold text-lg text-indigo-600 print:text-black">{clinicalData.heart_rate || '-'} <span className="text-xs font-normal text-gray-400">l/p</span></div>
                                    </div>
                                    <div className="border border-gray-200 rounded p-3 text-center bg-gray-50 print:border-gray-400">
                                        <div className="text-xs text-gray-500 mb-1">Nhiệt độ</div>
                                        <div className="font-bold text-lg text-indigo-600 print:text-black">{clinicalData.temperature || '-'} <span className="text-xs font-normal text-gray-400">°C</span></div>
                                    </div>
                                    <div className="border border-gray-200 rounded p-3 text-center bg-gray-50 print:border-gray-400">
                                        <div className="text-xs text-gray-500 mb-1">Huyết áp</div>
                                        <div className="font-bold text-lg text-indigo-600 print:text-black">{clinicalData.blood_pressure || '-'} <span className="text-xs font-normal text-gray-400">mmHg</span></div>
                                    </div>
                                    <div className="border border-gray-200 rounded p-3 text-center bg-gray-50 print:border-gray-400">
                                        <div className="text-xs text-gray-500 mb-1">Cân nặng</div>
                                        <div className="font-bold text-lg text-indigo-600 print:text-black">{clinicalData.weight || '-'} <span className="text-xs font-normal text-gray-400">kg</span></div>
                                    </div>
                                </div>
                            </Col>

                            <Col span={24}>
                                <Text type="secondary" className="block text-xs uppercase tracking-wider mb-2 font-semibold">Chẩn đoán của bác sĩ</Text>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 print:bg-white print:border-black">
                                    <Text strong className="text-xl text-indigo-900 print:text-black">{medical_record.diagnosis}</Text>
                                </div>
                            </Col>

                            {/* --- 3. PHẦN HIỂN THỊ HÌNH ẢNH MỚI THÊM --- */}
                            {attachments.length > 0 && (
                                <Col span={24}>
                                    <Text type="secondary" className="block text-xs uppercase tracking-wider mb-3 font-semibold">Hình ảnh / Kết quả cận lâm sàng</Text>
                                    <div className="flex gap-3 flex-wrap">
                                        <Image.PreviewGroup>
                                            {attachments.map((url, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <Image
                                                        width={140}
                                                        height={140}
                                                        src={uploadService.getFileUrl(url)}
                                                        className="object-cover"
                                                        alt={`attachment-${index}`}
                                                    />
                                                </div>
                                            ))}
                                        </Image.PreviewGroup>
                                    </div>
                                </Col>
                            )}
                            {/* ----------------------------------------- */}

                        </Row>
                    </div>

                    {/* 4. ĐƠN THUỐC */}
                    <div className="mb-12">
                        <div className="bg-blue-50 py-2 px-4 mb-4 border-l-4 border-blue-600 print:bg-gray-100">
                            <Text strong className="uppercase text-blue-800 print:text-black">III. Đơn thuốc & Chỉ định</Text>
                        </div>

                        {currentPrescription ? (
                            <>
                                <Table
                                    dataSource={currentPrescription.items}
                                    columns={prescriptionColumns}
                                    pagination={false}
                                    size="small"
                                    bordered
                                    rowKey="id"
                                    className="mb-4"
                                />
                                {currentPrescription.notes && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4 print:bg-white print:border-gray-300">
                                        <Text strong className="text-yellow-800 block mb-1 print:text-black">Lời dặn của bác sĩ:</Text>
                                        <p className="italic text-gray-700 print:text-black">{currentPrescription.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6 text-gray-400 italic bg-gray-50 rounded border border-dashed border-gray-200">
                                Không có chỉ định thuốc cho lần khám này.
                            </div>
                        )}
                    </div>

                    {/* 5. FOOTER */}
                    <Row>
                        <Col span={12}></Col>
                        <Col span={12} className="text-center">
                            <Text className="text-gray-500 italic block mb-2">
                                Ngày {dayjs(record.start_time).format('DD')} tháng {dayjs(record.start_time).format('MM')} năm {dayjs(record.start_time).format('YYYY')}
                            </Text>
                            <Text strong className="uppercase text-base block mb-20 font-bold">Bác sĩ điều trị</Text>

                            <Text strong className="text-lg text-indigo-900 border-b border-indigo-200 pb-1 px-4 print:text-black print:border-black">
                                {doctor?.title} {doctor?.user?.full_name}
                            </Text>
                        </Col>
                    </Row>

                    <Divider className="my-8" />

                    <div className="text-center text-[10px] text-gray-400 print:text-black">
                        <p>Phiếu khám bệnh điện tử - Lưu hành nội bộ</p>
                        <p>Vui lòng mang theo phiếu này khi tái khám để bác sĩ theo dõi tiến triển bệnh.</p>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}