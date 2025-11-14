import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, List, Tag, Space, Button, Empty, Avatar } from 'antd';
import { 
  UserOutlined,
  CalendarOutlined, 
  MedicineBoxOutlined,
  DollarOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { dashboardService } from '../../services/dashboard.service';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import dayjs from 'dayjs';

export default function PatientDashboard() {
  const { data: dashboard } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: () => dashboardService.getPatientDashboard(),
  });

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Quick Actions */}
          <Card>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} size="large">
                Đặt lịch khám
              </Button>
              <Button icon={<CalendarOutlined />} size="large">
                Lịch hẹn của tôi
              </Button>
              <Button icon={<MedicineBoxOutlined />} size="large">
                Đơn thuốc
              </Button>
              <Button icon={<DollarOutlined />} size="large">
                Hóa đơn
              </Button>
            </Space>
          </Card>

          {/* Upcoming Appointments */}
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                <span>Lịch hẹn sắp tới</span>
              </Space>
            }
          >
            {dashboard?.upcomingAppointments && dashboard.upcomingAppointments.length > 0 ? (
              <List
                dataSource={dashboard.upcomingAppointments}
                renderItem={(appointment: any) => (
                  <List.Item
                    actions={[
                      <Tag color="blue">{appointment.status}</Tag>,
                      <Button type="link">Chi tiết</Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />}
                      title={`BS. ${appointment.doctor.user.name}`}
                      description={
                        <Space direction="vertical">
                          <span>
                            📅 {dayjs(appointment.appointmentDate).format('DD/MM/YYYY')} 
                            {' '} ⏰ {appointment.startTime} - {appointment.endTime}
                          </span>
                          <span>🏥 Phòng {appointment.room.roomNumber}</span>
                          <span>🔬 {appointment.doctor.specialization.name}</span>
                          {appointment.reason && <span>📝 {appointment.reason}</span>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không có lịch hẹn sắp tới" />
            )}
          </Card>

          {/* Recent Prescriptions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <MedicineBoxOutlined />
                    <span>Đơn thuốc gần đây</span>
                  </Space>
                }
              >
                {dashboard?.recentPrescriptions && dashboard.recentPrescriptions.length > 0 ? (
                  <List
                    dataSource={dashboard.recentPrescriptions}
                    renderItem={(prescription: any) => (
                      <List.Item
                        actions={[<Button type="link">Xem</Button>]}
                      >
                        <List.Item.Meta
                          avatar={<MedicineBoxOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                          title={`BS. ${prescription.doctor.user.name}`}
                          description={
                            <Space direction="vertical">
                              <span>📅 {dayjs(prescription.prescriptionDate).format('DD/MM/YYYY')}</span>
                              {prescription.diagnosis && <span>🔍 {prescription.diagnosis}</span>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Chưa có đơn thuốc" />
                )}
              </Card>
            </Col>

            {/* Unpaid Invoices */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <DollarOutlined />
                    <span>Hóa đơn chưa thanh toán</span>
                  </Space>
                }
              >
                {dashboard?.unpaidInvoices && dashboard.unpaidInvoices.length > 0 ? (
                  <List
                    dataSource={dashboard.unpaidInvoices}
                    renderItem={(invoice: any) => (
                      <List.Item
                        actions={[
                          <Button type="primary" danger>Thanh toán</Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<DollarOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                          title={`${invoice.totalAmount.toLocaleString('vi-VN')}₫`}
                          description={
                            <Space direction="vertical">
                              <span>📅 {dayjs(invoice.issueDate).format('DD/MM/YYYY')}</span>
                              <Tag color="red">Chưa thanh toán</Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Không có hóa đơn chưa thanh toán" />
                )}
              </Card>
            </Col>
          </Row>
        </Space>
    </DashboardLayout>
  );
}
