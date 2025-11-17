import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DoctorShift {
  id: string;
  doctor_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  recurrence?: any;
  room?: {
    name: string;
    code: string;
  };
  created_at: string;
}

interface CreateShiftDto {
  doctor_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  recurrence?: any;
}

const shiftService = {
  getMyDoctorId: (): Promise<{ id: string }> => {
    // Call API to get current doctor's info
    return axiosInstance.get('/auth/me').then(async (res) => {
      const userData = res.data;
      // If response includes doctor object
      if (userData.doctor?.id) {
        return { id: userData.doctor.id };
      }
      // Otherwise, get doctor by user_id
      const doctorsResponse = await axiosInstance.get('/doctors', {
        params: { limit: 1 },
      });
      const doctors = doctorsResponse.data.data;
      if (doctors && doctors.length > 0) {
        return { id: doctors[0].id };
      }
      throw new Error('Doctor not found');
    });
  },

  getMyShifts: (doctorId: string): Promise<DoctorShift[]> => {
    return axiosInstance.get(`/doctors/${doctorId}/shifts`).then((res) => res.data);
  },

  createShift: (data: CreateShiftDto): Promise<DoctorShift> => {
    return axiosInstance.post('/doctor-shifts', data).then((res) => res.data);
  },

  updateShift: (id: string, data: CreateShiftDto): Promise<DoctorShift> => {
    return axiosInstance.put(`/doctor-shifts/${id}`, data).then((res) => res.data);
  },

  deleteShift: (id: string): Promise<void> => {
    return axiosInstance.delete(`/doctor-shifts/${id}`).then((res) => res.data);
  },
};

export default function DoctorSchedule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<DoctorShift | null>(null);
  const [form] = Form.useForm();

  // Get doctor ID first
  const { data: doctorData, isLoading: loadingDoctorId } = useQuery({
    queryKey: ['my-doctor-id'],
    queryFn: shiftService.getMyDoctorId,
    enabled: !!user,
  });

  const doctorId = doctorData?.id;

  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['doctor-shifts', doctorId],
    queryFn: () => shiftService.getMyShifts(doctorId!),
    enabled: !!doctorId,
  });

  // Get rooms for selection
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => axiosInstance.get('/rooms').then((res) => res.data),
  });

  if (error) {
    console.error('Error loading shifts:', error);
  }

  const createMutation = useMutation({
    mutationFn: shiftService.createShift,
    onSuccess: () => {
      message.success('Thêm ca trực thành công');
      queryClient.invalidateQueries({ queryKey: ['doctor-shifts'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi thêm ca trực');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateShiftDto }) =>
      shiftService.updateShift(id, data),
    onSuccess: () => {
      message.success('Cập nhật ca trực thành công');
      queryClient.invalidateQueries({ queryKey: ['doctor-shifts'] });
      setModalOpen(false);
      setEditingShift(null);
      form.resetFields();
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật ca trực');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: shiftService.deleteShift,
    onSuccess: () => {
      message.success('Xóa ca trực thành công');
      queryClient.invalidateQueries({ queryKey: ['doctor-shifts'] });
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi xóa ca trực');
    },
  });

  const handleAdd = () => {
    setEditingShift(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (shift: DoctorShift) => {
    setEditingShift(shift);
    const startTime = dayjs(shift.start_time);
    const endTime = dayjs(shift.end_time);
    
    form.setFieldsValue({
      room_id: shift.room_id,
      date: startTime,
      time: [startTime, endTime],
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (values: any) => {
    if (!doctorId) {
      message.error('Không tìm thấy thông tin bác sĩ');
      return;
    }

    const date = values.date.format('YYYY-MM-DD');
    const startTime = values.time[0];
    const endTime = values.time[1];

    const data: CreateShiftDto = {
      doctor_id: doctorId,
      room_id: values.room_id,
      start_time: `${date}T${startTime.format('HH:mm:ss')}Z`,
      end_time: `${date}T${endTime.format('HH:mm:ss')}Z`,
    };

    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      title: 'Ngày',
      key: 'date',
      render: (_: any, record: DoctorShift) => {
        const date = dayjs(record.start_time);
        return (
          <div>
            <div><strong>{date.format('DD/MM/YYYY')}</strong></div>
            <div className="text-gray-500 text-sm">{date.format('dddd')}</div>
          </div>
        );
      },
      sorter: (a: DoctorShift, b: DoctorShift) => 
        dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf(),
    },
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      render: (room: any) => room ? `${room.code} - ${room.name}` : 'N/A',
    },
    {
      title: 'Giờ bắt đầu',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Giờ kết thúc',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Thời lượng',
      key: 'duration',
      render: (_: any, record: DoctorShift) => {
        const start = dayjs(record.start_time);
        const end = dayjs(record.end_time);
        const hours = end.diff(start, 'hour', true);
        return `${hours.toFixed(1)} giờ`;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: DoctorShift) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa ca trực"
            description="Bạn có chắc muốn xóa ca trực này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2}>
            <CalendarOutlined /> Lịch trực của tôi
          </Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            disabled={!doctorId || loadingDoctorId}
          >
            Thêm ca trực
          </Button>
        </div>

        {loadingDoctorId && (
          <Card>
            <div className="text-center py-8">Đang tải thông tin bác sĩ...</div>
          </Card>
        )}

        {!loadingDoctorId && !doctorId && (
          <Card>
            <div className="text-center py-8 text-red-500">
              Không tìm thấy thông tin bác sĩ. Vui lòng liên hệ quản trị viên.
            </div>
          </Card>
        )}

        {doctorId && (
          <Card>
            <Table
              columns={columns}
              dataSource={shifts || []}
              rowKey="id"
              loading={isLoading}
              pagination={false}
            />
          </Card>
        )}

        <Modal
          title={editingShift ? 'Cập nhật ca trực' : 'Thêm ca trực mới'}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingShift(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          confirmLoading={createMutation.isPending || updateMutation.isPending}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="date"
              label="Ngày làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker 
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Chọn ngày"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
            <Form.Item
              name="room_id"
              label="Phòng khám"
              rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
            >
              <Select placeholder="Chọn phòng">
                {roomsData?.map((room: any) => (
                  <Select.Option key={room.id} value={room.id}>
                    {room.code} - {room.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="time"
              label="Giờ làm việc"
              rules={[{ required: true, message: 'Vui lòng chọn giờ' }]}
            >
              <TimePicker.RangePicker
                format="HH:mm"
                style={{ width: '100%' }}
                placeholder={['Giờ bắt đầu', 'Giờ kết thúc']}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
