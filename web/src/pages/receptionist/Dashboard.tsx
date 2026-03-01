import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { CalendarOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { dashboardService } from '@/services/dashboard.service';

export default function ReceptionistDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['receptionist-dashboard-stats'],
        queryFn: () => dashboardService.getAdminStats(),
    });

    useQuery({
        queryKey: ['receptionist-upcoming-appointments'],
        queryFn: () => dashboardService.getAdminUpcomingAppointments(10),
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-96">
                    <Spin size="large" tip="Đang tải..." />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Bàn Lễ tân</h2>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Chờ check-in"
                                value={stats?.todayAppointments ?? 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Lịch hẹn hôm nay"
                                value={stats?.todayAppointments ?? 0}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Hóa đơn chưa thu"
                                value={stats?.pendingInvoices ?? 0}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </DashboardLayout>
    );
}