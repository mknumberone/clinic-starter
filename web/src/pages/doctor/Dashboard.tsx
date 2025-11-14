import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, List, Tag, Space, Avatar, Statistic } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  MedicineBoxOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { dashboardService } from '../../services/dashboard.service';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import dayjs from 'dayjs';

export default function DoctorDashboard() {
  const { data: dashboard } = useQuery({
    queryKey: ['doctorDashboard'],
    queryFn: () => dashboardService.getDoctorDashboard(),
  });

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Today's Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Lịch hẹn hôm nay"
                  value={dashboard?.todayAppointments || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Hoàn thành tuần này"
                  value={dashboard?.weeklyStats?.completed || 0}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Hủy tuần này"
                  value={dashboard?.weeklyStats?.cancelled || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Today's Shifts */}
          <Card title="Ca trực hôm nay">
            {dashboard?.todayShifts && dashboard.todayShifts.length > 0 ? (
              <List
                dataSource={dashboard.todayShifts}
                renderItem={(shift: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={`${shift.startTime} - ${shift.endTime}`}
                      description={
                        <Space>
                          <span>Phòng: {shift.room.roomNumber}</span>
                          <Tag color="blue">{shift.dayOfWeek}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <p>Không có ca trực hôm nay</p>
            )}
          </Card>

          {/* Today's Appointments */}
          <Card title="Lịch hẹn hôm nay">
            {dashboard?.todayAppointmentsList && dashboard.todayAppointmentsList.length > 0 ? (
              <List
                dataSource={dashboard.todayAppointmentsList}
                renderItem={(appointment: any) => (
                  <List.Item
                    actions={[
                      <Tag color={
                        appointment.status === 'COMPLETED' ? 'green' :
                        appointment.status === 'IN_PROGRESS' ? 'orange' :
                        appointment.status === 'CANCELLED' ? 'red' : 'blue'
                      }>
                        {appointment.status}
                      </Tag>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={appointment.patient.user.name}
                      description={
                        <Space direction="vertical">
                          <span>⏰ {appointment.startTime} - {appointment.endTime}</span>
                          <span>📍 Phòng {appointment.room.roomNumber}</span>
                          {appointment.reason && <span>📝 {appointment.reason}</span>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <p>Không có lịch hẹn hôm nay</p>
            )}
          </Card>

          {/* Weekly Summary */}
          <Card title="Tổng kết tuần này">
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng lịch hẹn"
                    value={dashboard?.weeklyStats?.total || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Đã hoàn thành"
                    value={dashboard?.weeklyStats?.completed || 0}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Đã hủy"
                    value={dashboard?.weeklyStats?.cancelled || 0}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Space>
    </DashboardLayout>
  );
}
