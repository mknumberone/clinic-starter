// src/pages/manager/Dashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin, Alert, Typography, Divider, Table, Tag } from 'antd';
import { CalendarOutlined, DollarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ManagerDashboard() {
    const { user } = useAuthStore();

    // 1. Lấy thông tin Dashboard chung (dùng API Admin hoặc API Dashboard chung nếu có)
    // Ở đây, chúng ta sẽ gọi API của Admin, nhưng Backend sẽ tự lọc theo branch_id
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['manager-admin-stats'],
        queryFn: () => dashboardService.getAdminStats(),
        enabled: !!user?.branch_id,
    });

    // <<<<<<< HEAD
    // 2. Lấy danh sách lịch hẹn sắp tới
    const { data: upcomingAppointments, isLoading: loadingAppts } = useQuery({
        queryKey: ['manager-upcoming-appointments'],
        queryFn: () => dashboardService.getAdminUpcomingAppointments(5),
        enabled: !!user?.branch_id,
    });

    // Cần phải có API để lấy thống kê Lịch trực của Chi nhánh (Backend đã có logic này)
    const { data: shifts, isLoading: loadingShifts } = useQuery({
        queryKey: ['manager-shifts-today'],
        queryFn: async () => {
            // Gọi API lấy shifts, lọc theo ngày hôm nay
            const res = await dashboardService.getAdminAppointments({
                startDate: dayjs().startOf('day').toISOString(),
                endDate: dayjs().endOf('day').toISOString()
            });
            // Giả định API Admin Appointments trả về lịch hẹn.
            // Để lấy Lịch trực, cần phải gọi API GET /shifts
            // Ở đây, tạm thời reuse Appointment API để lấy dữ liệu về lịch hẹn trong ngày.
            return res;
        },
        enabled: !!user?.branch_id,
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
    const todayAppointments = Array.isArray(shifts) ? shifts : [];

    // Cột cho Lịch hẹn sắp tới
    const apptColumns = [
        { title: 'Giờ', dataIndex: 'start_time', render: (t: string) => dayjs(t).format('HH:mm') },
        { title: 'Bệnh nhân', render: (r: any) => r.patient?.user?.full_name || 'N/A' },
        { title: 'Bác sĩ', render: (r: any) => r.doctor?.user?.full_name || 'Đang xếp' },
        { title: 'Phòng', dataIndex: ['room', 'code'], render: (c: string) => <Tag>{c}</Tag> },
    ];
    // =======
    // // Debug: Check dashboard structure
    // console.log('Dashboard data:', dashboard);
    // // >>>>>>> 9a79bf37bb3c16df3400143c05117f4a818e9768

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