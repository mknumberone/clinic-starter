import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Space,
  Typography,
  message,
  Steps,
  Row,
  Col,
  Tag,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { patientService } from '@/services/patient.service';
import { doctorService } from '@/services/doctor.service';
import { appointmentService } from '@/services/appointment.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function BookAppointment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const { data: patients } = useQuery({
    queryKey: ['patients-simple'],
    queryFn: () => patientService.getPatients({ limit: 100 }),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-simple'],
    queryFn: () => doctorService.getDoctors({ limit: 100 }),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => doctorService.getRooms(),
  });

  // Fetch available slots when doctor and date are selected
  const fetchSlots = async (doctorId: string, date: dayjs.Dayjs) => {
    try {
      const slots = await appointmentService.getAvailableSlots(
        doctorId,
        date.format('YYYY-MM-DD')
      );
      setAvailableSlots(slots);
    } catch (error) {
      message.error('Không thể tải lịch trống');
      setAvailableSlots([]);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => appointmentService.createAppointment(data),
    onSuccess: () => {
      message.success('Đặt lịch hẹn thành công');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      navigate('/admin/appointments');
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi đặt lịch');
    },
  });

  const handlePatientChange = (patientId: string) => {
    const patient = patients?.data.find((p) => p.id === patientId);
    setSelectedPatient(patient);
    form.setFieldValue('patient_id', patientId);
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors?.data.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor);
    form.setFieldValue('doctor_assigned_id', doctorId);
    
    if (selectedDate) {
      fetchSlots(doctorId, selectedDate);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
    form.setFieldValue('appointment_date', date);
    
    const doctorId = form.getFieldValue('doctor_assigned_id');
    if (doctorId && date) {
      fetchSlots(doctorId, date);
    }
  };

  const handleSubmit = (values: any) => {
    const startTime = dayjs(values.appointment_date)
      .hour(parseInt(values.start_time.split(':')[0]))
      .minute(parseInt(values.start_time.split(':')[1]))
      .toISOString();

    const endTime = dayjs(values.appointment_date)
      .hour(parseInt(values.end_time.split(':')[0]))
      .minute(parseInt(values.end_time.split(':')[1]))
      .toISOString();

    createMutation.mutate({
      patient_id: values.patient_id,
      doctor_assigned_id: values.doctor_assigned_id,
      room_id: values.room_id,
      start_time: startTime,
      end_time: endTime,
      appointment_type: values.appointment_type,
      notes: values.notes,
    });
  };

  const steps = [
    {
      title: 'Chọn bệnh nhân',
      icon: <UserOutlined />,
    },
    {
      title: 'Chọn bác sĩ & thời gian',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Xác nhận',
      icon: <MedicineBoxOutlined />,
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
              Đặt lịch hẹn mới
            </Title>
          </Space>
        </div>

        <Card className="mb-4">
          <Steps current={currentStep} items={steps} />
        </Card>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              appointment_type: 'Khám tổng quát',
            }}
          >
            {/* Step 1: Select Patient */}
            {currentStep === 0 && (
              <div>
                <Form.Item
                  name="patient_id"
                  label="Chọn bệnh nhân"
                  rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân' }]}
                >
                  <Select
                    showSearch
                    placeholder="Tìm bệnh nhân theo tên hoặc SĐT"
                    optionFilterProp="children"
                    onChange={handlePatientChange}
                    filterOption={(input, option: any) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {patients?.data.map((patient) => (
                      <Select.Option key={patient.id} value={patient.id}>
                        {patient.user.full_name} - {patient.user.phone}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedPatient && (
                  <Alert
                    message="Thông tin bệnh nhân"
                    description={
                      <div>
                        <Text strong>{selectedPatient.user.full_name}</Text>
                        <br />
                        SĐT: {selectedPatient.user.phone}
                        <br />
                        Giới tính: {selectedPatient.gender === 'male' ? 'Nam' : 'Nữ'}
                        <br />
                        Ngày sinh: {dayjs(selectedPatient.date_of_birth).format('DD/MM/YYYY')}
                      </div>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                )}

                <Button
                  type="primary"
                  onClick={() => {
                    if (form.getFieldValue('patient_id')) {
                      setCurrentStep(1);
                    } else {
                      message.warning('Vui lòng chọn bệnh nhân');
                    }
                  }}
                >
                  Tiếp tục
                </Button>
              </div>
            )}

            {/* Step 2: Select Doctor & Time */}
            {currentStep === 1 && (
              <div>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="doctor_assigned_id"
                      label="Chọn bác sĩ"
                      rules={[{ required: true, message: 'Vui lòng chọn bác sĩ' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn bác sĩ"
                        optionFilterProp="children"
                        onChange={handleDoctorChange}
                      >
                        {doctors?.data.map((doctor) => (
                          <Select.Option key={doctor.id} value={doctor.id}>
                            {doctor.title} {doctor.user.full_name} ({doctor.code})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="appointment_date"
                      label="Chọn ngày"
                      rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        disabledDate={(current) =>
                          current && current < dayjs().startOf('day')
                        }
                        onChange={handleDateChange}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {availableSlots.length > 0 && (
                  <Form.Item label="Chọn khung giờ">
                    <Space wrap>
                      {availableSlots.map((slot) => (
                        <Tag.CheckableTag
                          key={slot.start}
                          checked={form.getFieldValue('start_time') === slot.start}
                          onChange={() => {
                            form.setFieldsValue({
                              start_time: slot.start,
                              end_time: slot.end,
                            });
                          }}
                        >
                          {slot.start} - {slot.end}
                        </Tag.CheckableTag>
                      ))}
                    </Space>
                  </Form.Item>
                )}

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="start_time"
                      label="Giờ bắt đầu"
                      rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
                    >
                      <Input placeholder="HH:mm" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="end_time"
                      label="Giờ kết thúc"
                      rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
                    >
                      <Input placeholder="HH:mm" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="room_id"
                      label="Phòng khám"
                      rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
                    >
                      <Select placeholder="Chọn phòng">
                        {rooms?.map((room) => (
                          <Select.Option key={room.id} value={room.id}>
                            {room.code} - {room.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="appointment_type"
                  label="Loại khám"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="VD: Khám tổng quát" />
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                  <TextArea rows={3} placeholder="Ghi chú thêm về lịch hẹn" />
                </Form.Item>

                <Space>
                  <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      form
                        .validateFields([
                          'doctor_assigned_id',
                          'appointment_date',
                          'start_time',
                          'end_time',
                          'room_id',
                        ])
                        .then(() => setCurrentStep(2))
                        .catch(() => message.warning('Vui lòng điền đầy đủ thông tin'));
                    }}
                  >
                    Tiếp tục
                  </Button>
                </Space>
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 2 && (
              <div>
                <Alert
                  message="Xác nhận thông tin lịch hẹn"
                  description={
                    <div>
                      <Text strong>Bệnh nhân:</Text> {selectedPatient?.user.full_name}
                      <br />
                      <Text strong>Bác sĩ:</Text> {selectedDoctor?.title}{' '}
                      {selectedDoctor?.user.full_name}
                      <br />
                      <Text strong>Ngày:</Text>{' '}
                      {selectedDate?.format('DD/MM/YYYY')}
                      <br />
                      <Text strong>Giờ:</Text> {form.getFieldValue('start_time')} -{' '}
                      {form.getFieldValue('end_time')}
                      <br />
                      <Text strong>Loại khám:</Text>{' '}
                      {form.getFieldValue('appointment_type')}
                    </div>
                  }
                  type="success"
                  showIcon
                  className="mb-4"
                />

                <Space>
                  <Button onClick={() => setCurrentStep(1)}>Quay lại</Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={createMutation.isPending}
                  >
                    Xác nhận đặt lịch
                  </Button>
                </Space>
              </div>
            )}
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
