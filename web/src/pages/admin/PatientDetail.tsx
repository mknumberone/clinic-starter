import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Tabs,
  Table,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { patientService } from '@/services/patient.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.getPatientById(id!),
    enabled: !!id,
    onError: () => {
      message.error('Không thể tải thông tin bệnh nhân');
      navigate('/admin/patients');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return null;
  }

  const calculateAge = (dateOfBirth: string) => {
    return dayjs().diff(dayjs(dateOfBirth), 'year');
  };

  const appointmentColumns = [
    {
      title: 'Ngày khám',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => dayjs(time).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Loại khám',
      dataIndex: 'appointment_type',
      key: 'appointment_type',
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_: unknown, record: any) =>
        `${record.doctor.title} ${record.doctor.full_name}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          scheduled: 'blue',
          confirmed: 'cyan',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        };
        const labelMap: Record<string, string> = {
          scheduled: 'Đã đặt',
          confirmed: 'Đã xác nhận',
          completed: 'Hoàn thành',
          cancelled: 'Đã hủy',
          no_show: 'Vắng mặt',
        };
        return <Tag color={colorMap[status]}>{labelMap[status] || status}</Tag>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Hồ sơ Bệnh nhân
            </Title>
          </Space>
          <Button type="primary" icon={<EditOutlined />}>
            Chỉnh sửa
          </Button>
        </div>

        <Card className="mb-4">
          <Descriptions
            title="Thông tin cá nhân"
            bordered
            column={{ xs: 1, sm: 2, md: 2 }}
          >
            <Descriptions.Item
              label={
                <Space>
                  <UserOutlined /> Họ và tên
                </Space>
              }
            >
              <Typography.Text strong>{patient.user.full_name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã bệnh nhân">
              <Typography.Text code>{patient.id.slice(0, 8)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <PhoneOutlined /> Số điện thoại
                </Space>
              }
            >
              {patient.user.phone}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <MailOutlined /> Email
                </Space>
              }
            >
              {patient.user.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <CalendarOutlined /> Ngày sinh
                </Space>
              }
            >
              {dayjs(patient.date_of_birth).format('DD/MM/YYYY')} (
              {calculateAge(patient.date_of_birth)} tuổi)
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              <Tag
                color={
                  patient.gender === 'male'
                    ? 'blue'
                    : patient.gender === 'female'
                      ? 'pink'
                      : 'default'
                }
              >
                {patient.gender === 'male'
                  ? 'Nam'
                  : patient.gender === 'female'
                    ? 'Nữ'
                    : 'Khác'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nhóm máu">
              {patient.blood_group ? (
                <Tag color="red">{patient.blood_group}</Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <HomeOutlined /> Địa chỉ
                </Space>
              }
              span={2}
            >
              {patient.address}
            </Descriptions.Item>
            <Descriptions.Item label="Dị ứng" span={2}>
              {patient.allergies || 'Không có'}
            </Descriptions.Item>
            <Descriptions.Item label="Liên hệ khẩn cấp" span={2}>
              {patient.emergency_contact || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký">
              {dayjs(patient.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {dayjs(patient.updated_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card>
          <Tabs
            defaultActiveKey="appointments"
            items={[
              {
                key: 'appointments',
                label: 'Lịch sử khám',
                children: (
                  <Table
                    columns={appointmentColumns}
                    dataSource={patient.appointments || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
              {
                key: 'prescriptions',
                label: 'Đơn thuốc',
                children: (
                  <Timeline
                    items={
                      patient.prescriptions?.map((prescription) => ({
                        children: (
                          <Card size="small">
                            <div className="mb-2">
                              <Typography.Text type="secondary">
                                {dayjs(prescription.created_at).format(
                                  'DD/MM/YYYY HH:mm'
                                )}
                              </Typography.Text>
                              <br />
                              <Typography.Text strong>
                                Bác sĩ: {prescription.doctor.full_name}
                              </Typography.Text>
                            </div>
                            <ul className="list-disc pl-5">
                              {prescription.items.map((item, idx) => (
                                <li key={idx}>
                                  <Typography.Text>
                                    {item.name} - {item.dosage} - {item.frequency}{' '}
                                    - {item.duration}
                                  </Typography.Text>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        ),
                      })) || []
                    }
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
