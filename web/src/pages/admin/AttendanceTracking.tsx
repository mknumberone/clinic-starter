import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    Table,
    Tag,
    Typography,
    DatePicker,
    Row,
    Col,
    Statistic,
    Space,
    Avatar,
    Button,
    Select
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    TeamOutlined,
    ReloadOutlined,
    WarningOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosInstance from '@/lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AttendanceTracking() {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'DOCTOR' | 'RECEPTIONIST'>('ALL');

    // 1. Fetch dữ liệu ca trực trong ngày
    const { data: shifts, isLoading, refetch } = useQuery({
        queryKey: ['daily-attendance', selectedDate.format('YYYY-MM-DD'), user?.branch_id],
        queryFn: async () => {
            const start = selectedDate.startOf('day').toISOString();
            const end = selectedDate.endOf('day').toISOString();

            const res = await axiosInstance.get('/shifts', {
                params: {
                    start,
                    end,
                    branch_id: user?.branch_id // Admin chi nhánh nào xem chi nhánh đó
                }
            });
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
        // Tự động refresh mỗi 1 phút để cập nhật trạng thái thực
        refetchInterval: 60000
    });

    // 2. Logic tính toán trạng thái & Thống kê
    const { stats, filteredData } = useMemo(() => {
        const rawData = shifts || [];
        const now = dayjs();

        let total = 0;
        let working = 0;
        let completed = 0;
        let late = 0;
        let absent = 0; // Vắng (hết giờ mà chưa check-in)

        const processedData = rawData.map((shift: any) => {
            const scheduledStart = dayjs(shift.start_time);
            const scheduledEnd = dayjs(shift.end_time);
            const actualStart = shift.actual_start_time ? dayjs(shift.actual_start_time) : null;
            const actualEnd = shift.actual_end_time ? dayjs(shift.actual_end_time) : null;

            // Xác định trạng thái chi tiết
            let statusTag = <Tag color="default">Chưa đến giờ</Tag>;
            let statusType = 'WAITING'; // WAITING, WORKING, COMPLETED, LATE, ABSENT

            if (actualStart) {
                // Đã Check-in
                const isLate = actualStart.diff(scheduledStart, 'minute') > 15;
                if (isLate) late++;

                if (actualEnd) {
                    // Đã Check-out
                    completed++;
                    const isEarly = scheduledEnd.diff(actualEnd, 'minute') > 15;

                    if (isLate && isEarly) {
                        statusTag = <Tag color="red">Muộn & Về sớm</Tag>;
                    } else if (isLate) {
                        statusTag = <Tag color="orange">Đi muộn</Tag>;
                    } else if (isEarly) {
                        statusTag = <Tag color="warning">Về sớm</Tag>;
                    } else {
                        statusTag = <Tag color="success">Hoàn thành tốt</Tag>;
                    }
                    statusType = 'COMPLETED';
                } else {
                    // Đang làm việc
                    working++;
                    statusTag = isLate
                        ? <Tag color="volcano" icon={<ClockCircleOutlined />}>Đang làm (Đến muộn)</Tag>
                        : <Tag color="processing" icon={<CheckCircleOutlined />}>Đang làm việc</Tag>;
                    statusType = 'WORKING';
                }
            } else {
                // Chưa Check-in
                if (now.isAfter(scheduledEnd)) {
                    absent++;
                    statusTag = <Tag color="error" icon={<CloseCircleOutlined />}>Vắng mặt</Tag>;
                    statusType = 'ABSENT';
                } else if (now.isAfter(scheduledStart.add(15, 'minute'))) {
                    // Quá giờ start 15p mà chưa check-in
                    statusTag = <Tag color="red" icon={<WarningOutlined />}>Chưa Check-in (Trễ)</Tag>;
                    statusType = 'LATE_NOT_CHECKIN';
                } else {
                    statusTag = <Tag color="default">Chưa bắt đầu</Tag>;
                    statusType = 'WAITING';
                }
            }

            return {
                ...shift,
                statusTag,
                statusType,
                person: shift.doctor || shift.staff, // Gộp thông tin người trực
                role: shift.doctor ? 'DOCTOR' : 'RECEPTIONIST'
            };
        });

        total = processedData.length;

        // Lọc theo Role filter
        const finalData = roleFilter === 'ALL'
            ? processedData
            : processedData.filter((d: any) => d.role === roleFilter);

        return {
            stats: { total, working, completed, late, absent },
            filteredData: finalData
        };
    }, [shifts, roleFilter]);

    // 3. Cấu hình cột bảng
    const columns = [
        {
            title: 'Nhân sự',
            key: 'person',
            render: (_: any, record: any) => (
                <Space>
                    <Avatar src={record.person?.user?.avatar || record.person?.avatar} icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">{record.person?.user?.full_name || record.person?.full_name}</div>
                        <div className="text-xs text-gray-500">
                            {record.role === 'DOCTOR' ? <Tag color="blue">Bác sĩ</Tag> : <Tag color="orange">Lễ tân</Tag>}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Lịch trực',
            key: 'schedule',
            render: (_: any, record: any) => (
                <div>
                    <div className="text-indigo-600 font-medium">
                        {dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}
                    </div>
                    <div className="text-xs text-gray-400">
                        {record.room?.name}
                    </div>
                </div>
            )
        },
        {
            title: 'Giờ thực tế',
            key: 'actual',
            render: (_: any, record: any) => (
                <div className="text-sm">
                    <div>Vào: {record.actual_start_time ? <b>{dayjs(record.actual_start_time).format('HH:mm')}</b> : '--:--'}</div>
                    <div>Ra: &nbsp;{record.actual_end_time ? <b>{dayjs(record.actual_end_time).format('HH:mm')}</b> : '--:--'}</div>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: any, record: any) => record.statusTag
        }
    ];

    return (
        <DashboardLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={3} className="m-0">Theo dõi Chấm công</Title>
                        <Text type="secondary">Giám sát hoạt động nhân sự trong ngày</Text>
                    </div>
                    <Space>
                        <DatePicker
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                            allowClear={false}
                        />
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Làm mới</Button>
                    </Space>
                </div>

                {/* STATS CARDS */}
                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Tổng ca trực"
                                value={stats.total}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Đang làm việc"
                                value={stats.working}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Đi muộn"
                                value={stats.late}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic
                                title="Vắng mặt / Chưa đến"
                                value={stats.absent}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* FILTERS & TABLE */}
                <Card className="shadow-sm rounded-lg" bodyStyle={{ padding: 0 }}>
                    <div className="p-4 border-b flex justify-between items-center">
                        <div className="font-medium text-lg">Chi tiết ca trực</div>
                        <Select
                            defaultValue="ALL"
                            style={{ width: 150 }}
                            onChange={setRoleFilter}
                        >
                            <Option value="ALL">Tất cả</Option>
                            <Option value="DOCTOR">Chỉ Bác sĩ</Option>
                            <Option value="RECEPTIONIST">Chỉ Lễ tân</Option>
                        </Select>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </div>
        </DashboardLayout>
    );
}