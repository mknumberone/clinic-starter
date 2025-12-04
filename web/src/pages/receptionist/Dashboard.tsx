import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { CalendarOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function ReceptionistDashboard() {
    // Tạm thời chưa gọi API thật để tránh lỗi, dùng UI tĩnh trước
    return (
        <DashboardLayout>
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Bàn Lễ tân</h2>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Chờ check-in"
                                value={5}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Lịch hẹn hôm nay"
                                value={12}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Hóa đơn chưa thu"
                                value={3}
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