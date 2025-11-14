import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';

const { Title } = Typography;
const { TextArea } = Input;

export default function SpecializationAndRoomManagement() {
  const queryClient = useQueryClient();
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [specForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // Fetch data
  const { data: specializations, isLoading: loadingSpecs } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorService.getSpecializations(),
  });

  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => doctorService.getRooms(),
  });

  // Mutations
  const createSpecMutation = useMutation({
    mutationFn: (data: any) =>
      axiosInstance.post('/specializations', data).then((res) => res.data),
    onSuccess: () => {
      message.success('Tạo chuyên khoa thành công');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setSpecModalOpen(false);
      specForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const updateSpecMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      axiosInstance.put(`/specializations/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      message.success('Cập nhật chuyên khoa thành công');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setSpecModalOpen(false);
      setEditingSpec(null);
      specForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const deleteSpecMutation = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/specializations/${id}`).then((res) => res.data),
    onSuccess: () => {
      message.success('Xóa chuyên khoa thành công');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
    onError: () => message.error('Không thể xóa chuyên khoa'),
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: any) =>
      axiosInstance.post('/rooms', data).then((res) => res.data),
    onSuccess: () => {
      message.success('Tạo phòng khám thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomModalOpen(false);
      roomForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: any) =>
      axiosInstance.put(`/rooms/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      message.success('Cập nhật phòng khám thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomModalOpen(false);
      setEditingRoom(null);
      roomForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/rooms/${id}`).then((res) => res.data),
    onSuccess: () => {
      message.success('Xóa phòng khám thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: () => message.error('Không thể xóa phòng khám'),
  });

  // Specialization columns
  const specColumns = [
    {
      title: 'Tên chuyên khoa',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <MedicineBoxOutlined />
          <Typography.Text strong>{name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc?: string) => desc || '-',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingSpec(record);
              specForm.setFieldsValue(record);
              setSpecModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa chuyên khoa?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => deleteSpecMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Room columns
  const roomColumns = [
    {
      title: 'Mã phòng',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <HomeOutlined />
          <Typography.Text strong>{name}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tầng',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => `${capacity} người`,
    },
    {
      title: 'Chuyên khoa',
      key: 'specialization',
      render: (_: unknown, record: any) =>
        record.specialization?.name ? (
          <Tag color="green">{record.specialization.name}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: unknown, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRoom(record);
              roomForm.setFieldsValue(record);
              setRoomModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa phòng khám?"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => deleteRoomMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSpecSubmit = (values: any) => {
    if (editingSpec) {
      updateSpecMutation.mutate({ id: editingSpec.id, data: values });
    } else {
      createSpecMutation.mutate(values);
    }
  };

  const handleRoomSubmit = (values: any) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data: values });
    } else {
      createRoomMutation.mutate(values);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Title level={2}>Quản lý Chuyên khoa & Phòng khám</Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <MedicineBoxOutlined />
                  Chuyên khoa
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSpec(null);
                    specForm.resetFields();
                    setSpecModalOpen(true);
                  }}
                >
                  Thêm chuyên khoa
                </Button>
              }
            >
              <Table
                columns={specColumns}
                dataSource={specializations || []}
                rowKey="id"
                loading={loadingSpecs}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <HomeOutlined />
                  Phòng khám
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingRoom(null);
                    roomForm.resetFields();
                    setRoomModalOpen(true);
                  }}
                >
                  Thêm phòng
                </Button>
              }
            >
              <Table
                columns={roomColumns}
                dataSource={rooms || []}
                rowKey="id"
                loading={loadingRooms}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Specialization Modal */}
        <Modal
          title={editingSpec ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa mới'}
          open={specModalOpen}
          onCancel={() => {
            setSpecModalOpen(false);
            setEditingSpec(null);
            specForm.resetFields();
          }}
          onOk={() => specForm.submit()}
          confirmLoading={
            createSpecMutation.isPending || updateSpecMutation.isPending
          }
        >
          <Form form={specForm} layout="vertical" onFinish={handleSpecSubmit}>
            <Form.Item
              name="name"
              label="Tên chuyên khoa"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="VD: Nội tổng quát" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Mô tả về chuyên khoa" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Room Modal */}
        <Modal
          title={editingRoom ? 'Sửa phòng khám' : 'Thêm phòng khám mới'}
          open={roomModalOpen}
          onCancel={() => {
            setRoomModalOpen(false);
            setEditingRoom(null);
            roomForm.resetFields();
          }}
          onOk={() => roomForm.submit()}
          confirmLoading={
            createRoomMutation.isPending || updateRoomMutation.isPending
          }
        >
          <Form form={roomForm} layout="vertical" onFinish={handleRoomSubmit}>
            <Form.Item
              name="code"
              label="Mã phòng"
              rules={[{ required: true, message: 'Vui lòng nhập mã phòng' }]}
            >
              <Input placeholder="VD: P001" disabled={!!editingRoom} />
            </Form.Item>
            <Form.Item
              name="name"
              label="Tên phòng"
              rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
            >
              <Input placeholder="VD: Phòng khám 1" />
            </Form.Item>
            <Form.Item
              name="floor"
              label="Tầng"
              rules={[{ required: true, message: 'Vui lòng nhập tầng' }]}
            >
              <Input placeholder="VD: Tầng 1" />
            </Form.Item>
            <Form.Item
              name="capacity"
              label="Sức chứa"
              rules={[{ required: true, message: 'Vui lòng nhập sức chứa' }]}
            >
              <Input type="number" placeholder="VD: 1" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
