import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Spin, Button, Descriptions, Tag, Avatar, Divider,
    Alert, Space, Popconfirm, message, Row, Col, Typography
} from 'antd';
import {
    ArrowLeftOutlined, CalendarOutlined,
    EnvironmentOutlined, UserOutlined,
    CloseCircleOutlined, HomeOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { appointmentService } from '@/services/appointment.service';

const { Title, Text, Paragraph } = Typography;

export default function AppointmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 1. Lấy dữ liệu chi tiết
    const { data: appointment, isLoading, isError } = useQuery({
        queryKey: ['appointment', id],
        queryFn: () => appointmentService.getAppointmentById(id!),
        enabled: !!id,
    });

    // 2. Xử lý Hủy lịch
    const cancelMutation = useMutation({
        mutationFn: () => appointmentService.cancelAppointment(id!, "Bệnh nhân chủ động hủy"),
        onSuccess: () => {
            message.success('Đã hủy lịch hẹn thành công');
            // Invalidate để cập nhật lại UI ngay lập tức
            queryClient.invalidateQueries({ queryKey: ['appointment', id] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] }); // Cập nhật cả danh sách bên ngoài
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Lỗi khi hủy lịch');
        },
    });

    // --- RENDER HELPERS ---
    const getStatusTag = (status: string) => {
        const config: any = {
            SCHEDULED: { color: 'blue', text: 'Đã đặt lịch', alertType: 'info', msg: 'Lịch hẹn đang chờ đến ngày khám.' },
            CONFIRMED: { color: 'cyan', text: 'Đã xác nhận', alertType: 'success', msg: 'Bác sĩ đã xác nhận lịch hẹn này.' },
            COMPLETED: { color: 'green', text: 'Hoàn thành', alertType: 'success', msg: 'Buổi khám đã kết thúc.' },
            CANCELLED: { color: 'red', text: 'Đã hủy', alertType: 'error', msg: 'Lịch hẹn này đã bị hủy.' },
            NO_SHOW: { color: 'orange', text: 'Vắng mặt', alertType: 'warning', msg: 'Bệnh nhân không đến khám.' },
        };
        return config[status] || { color: 'default', text: status, alertType: 'info', msg: '' };
    };

    if (isLoading) return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-[50vh]"><Spin size="large" /></div>
        </DashboardLayout>
    );

    if (isError || !appointment) return (
        <DashboardLayout>
            <div className="p-6">
                <Alert message="Lỗi" description="Không tìm thấy thông tin lịch hẹn" type="error" showIcon />
                <Button className="mt-4" onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        </DashboardLayout>
    );

    const statusConfig = getStatusTag(appointment.status);

    return (
        <DashboardLayout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* HEADER */}
                <div className="mb-6 flex items-center justify-between">
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Trở về</Button>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>Chi tiết lịch hẹn</Title>
                            <Text type="secondary">Mã: #{appointment.id.substring(0, 8).toUpperCase()}</Text>
                        </div>
                    </Space>
                    <Tag color={statusConfig.color} className="text-base px-3 py-1">
                        {statusConfig.text}
                    </Tag>
                </div>

                {/* STATUS BANNER */}
                <Alert
                    message={statusConfig.msg}
                    type={statusConfig.alertType}
                    showIcon
                    className="mb-6 shadow-sm"
                />

                <Row gutter={24}>
                    {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
                    <Col xs={24} lg={16}>
                        <Card title={<><CalendarOutlined /> Thông tin buổi khám</>} className="shadow-md mb-6">
                            <Descriptions column={1} bordered size="middle" labelStyle={{ width: '180px', fontWeight: 600 }}>

                                <Descriptions.Item label="Thời gian">
                                    <div className="text-lg font-semibold text-indigo-700">
                                        {dayjs(appointment.start_time).format('HH:mm')} - {dayjs(appointment.end_time).format('HH:mm')}
                                    </div>
                                    <div className="text-gray-500">
                                        {dayjs(appointment.start_time).format('dddd, DD/MM/YYYY')}
                                    </div>
                                </Descriptions.Item>

                                <Descriptions.Item label="Địa điểm">
                                    <Space direction="vertical" size={2}>
                                        <span className="font-bold text-gray-800">
                                            <EnvironmentOutlined /> {appointment.branch?.name}
                                        </span>
                                        <span className="text-gray-600 pl-5 block">
                                            {appointment.branch?.address || 'Đang cập nhật địa chỉ...'}
                                        </span>
                                    </Space>
                                </Descriptions.Item>

                                {/* ---> HIỂN THỊ PHÒNG KHÁM CHI TIẾT <--- */}
                                <Descriptions.Item label="Phòng khám">
                                    {appointment.room ? (
                                        <Space>
                                            <Tag color="purple"><HomeOutlined /> {appointment.room.code}</Tag>
                                            <span className="font-medium">{appointment.room.name}</span>
                                            {appointment.room.floor && <Tag>{appointment.room.floor}</Tag>}
                                            {appointment.room.building && <Tag color="cyan">{appointment.room.building}</Tag>}
                                        </Space>
                                    ) : (
                                        <span className="text-gray-400 italic">Chưa xếp phòng</span>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Loại khám">
                                    <Tag color="blue">{appointment.appointment_type || 'Khám thường'}</Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Triệu chứng / Ghi chú">
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100 italic text-gray-600">
                                        {appointment.notes || 'Không có ghi chú thêm'}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI: THÔNG TIN BÁC SĨ & ACTION */}
                    <Col xs={24} lg={8}>
                        {/* THẺ BÁC SĨ */}
                        <Card className="shadow-md mb-6 border-t-4 border-indigo-500">
                            <div className="flex flex-col items-center text-center">
                                <Avatar
                                    size={100}
                                    src={appointment.doctor?.user?.avatar}
                                    icon={<UserOutlined />}
                                    className="mb-4 bg-indigo-50 text-indigo-500 border-2 border-indigo-100"
                                />
                                <Title level={4} style={{ marginBottom: 4 }}>
                                    {appointment.doctor?.title} {appointment.doctor?.user?.full_name}
                                </Title>

                                {/* ---> HIỂN THỊ CHUYÊN KHOA ĐÚNG <--- */}
                                <Tag color="geekblue" className="mb-4 text-sm px-3 py-1">
                                    {appointment.doctor?.specialization?.name || 'Đa khoa'}
                                </Tag>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* ---> HIỂN THỊ GIỚI THIỆU (BIO) <--- */}
                                <div className="w-full text-left">
                                    <div className="mb-3">
                                        <Text type="secondary" className="block mb-1"><InfoCircleOutlined /> Giới thiệu:</Text>
                                        <Paragraph
                                            ellipsis={{ rows: 3, expandable: true, symbol: 'xem thêm' }}
                                            className="text-gray-600 text-sm bg-gray-50 p-2 rounded"
                                        >
                                            {appointment.doctor?.biography || 'Bác sĩ chưa cập nhật thông tin giới thiệu.'}
                                        </Paragraph>
                                    </div>

                                    <div className="flex justify-between mb-2">
                                        <Text type="secondary">Mã bác sĩ:</Text>
                                        <Text strong>{appointment.doctor?.code}</Text>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* ACTIONS: CHỈ HIỆN KHI CHƯA HỦY/HOÀN THÀNH */}
                        {appointment.status === 'SCHEDULED' && (
                            <Card title="Thao tác" className="shadow-md border-red-100">
                                <div className="flex flex-col gap-3">
                                    <Popconfirm
                                        title="Hủy lịch hẹn?"
                                        description="Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này sẽ được hệ thống ghi nhận."
                                        onConfirm={() => cancelMutation.mutate()}
                                        okText="Đồng ý hủy"
                                        cancelText="Giữ lại"
                                        okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
                                    >
                                        <Button block danger icon={<CloseCircleOutlined />} size="large">
                                            Hủy lịch hẹn
                                        </Button>
                                    </Popconfirm>

                                    <div className="text-xs text-gray-400 text-center mt-2">
                                        * Bạn chỉ có thể hủy lịch trước giờ khám 2 tiếng.
                                    </div>
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
        </DashboardLayout>
    );
}