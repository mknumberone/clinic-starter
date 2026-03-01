// src/pages/manager/Dashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin, Typography, Divider, Table, Tag } from 'antd';
import { CalendarOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/authStore';
import { appointmentService } from '@/services/appointment.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ManagerDashboard() {
    const { user } = useAuthStore();

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['manager-admin-stats'],
        queryFn: () => dashboardService.getAdminStats(),
        enabled: !!user?.branch_id,
        refetchInterval: 30000,
    });

    const { data: upcomingAppointments } = useQuery({
        queryKey: ['manager-upcoming-appointments'],
        queryFn: () => dashboardService.getAdminUpcomingAppointments(5),
        enabled: !!user?.branch_id,
        refetchInterval: 30000,
    });

    const { data: todayAppointmentsData } = useQuery({
        queryKey: ['manager-today-appointments', user?.branch_id],
        queryFn: () =>
            appointmentService.getAppointments({
                startDate: dayjs().startOf('day').format('YYYY-MM-DD'),
                endDate: dayjs().endOf('day').format('YYYY-MM-DD'),
                ...(user?.branch_id ? { branchId: user.branch_id } : {}),
                limit: 100,
            }),
        enabled: !!user?.branch_id,
        refetchInterval: 30000,
    });

    // Nếu Dashboard đang load hoặc không có branch_id
    if (loadingStats || !user?.branch_id) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-96">
                    <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
                </div>
            </DashboardLayout>
        );
    }

    const upcomingApptData = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];
    const todayAppointments = todayAppointmentsData?.data ?? [];

    const apptColumns = [
        { title: 'Giờ', dataIndex: 'start_time', render: (t: any) => t ? dayjs(t).format('HH:mm') : '--' },
        { title: 'Bệnh nhân', render: (_: any, r: any) => r.patient?.user?.full_name || 'N/A' },
        { title: 'Bác sĩ', render: (_: any, r: any) => r.doctor?.user?.full_name || 'Đang xếp' },
        { title: 'Phòng', render: (_: any, r: any) => <Tag>{r.room?.code || r.room?.name || '--'}</Tag> },
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <Title level={2}>Dashboard Quản Lý Chi Nhánh</Title>
                <Text type="secondary" className="block mb-6">
                    Tổng quan hoạt động của chi nhánh {user.branch?.name || user.branch_id}
                </Text>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card className="shadow-sm">
                            <Statistic
                                title="Tổng số lịch hẹn"
                                value={stats?.totalAppointments || 0}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />

                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="shadow-sm">
                            <Statistic
                                title="Tổng doanh thu tuần"
                                value={stats?.totalRevenue || 0}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                                suffix="VNĐ"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="shadow-sm">
                            <Statistic
                                title="Tổng số bệnh nhân"
                                value={stats?.totalPatients || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Divider orientation="left">Lịch hẹn trong ngày ({todayAppointments.length})</Divider>

                <Card className="mb-6 shadow-sm">
                    <Table
                        columns={apptColumns}
                        dataSource={todayAppointments}
                        rowKey="id"
                        pagination={false}
                        locale={{ emptyText: 'Không có lịch hẹn nào hôm nay' }}
                    />
                </Card>

                <Divider orientation="left">Lịch hẹn sắp tới (Top 5)</Divider>

                <Card className="shadow-sm">
                    <Table
                        columns={apptColumns}
                        dataSource={upcomingApptData}
                        rowKey="id"
                        pagination={false}
                        locale={{ emptyText: 'Không có lịch hẹn sắp tới' }}
                    />
                </Card>
            </div>
        </DashboardLayout>
    );
}