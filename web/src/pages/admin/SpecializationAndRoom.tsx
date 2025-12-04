// File: src/pages/admin/SpecializationAndRoom.tsx

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tabs,
  Select,
  Tooltip,
  InputNumber,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  SearchOutlined,
  ShopOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore'; // Lấy thông tin User
import axiosInstance from '@/lib/axios';

const { TextArea } = Input;

export default function SpecializationAndRoomManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore(); // Lấy user để check role và branch_id

  // --- STATE QUẢN LÝ ---
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // --- STATE FILTER ---
  const [searchText, setSearchText] = useState('');
  const [filterSpecId, setFilterSpecId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // State mới: Chọn chi nhánh (Dành cho Admin)
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(user?.branch_id || null);

  const [specForm] = Form.useForm();
  const [roomForm] = Form.useForm();

  // --- 1. FETCH DATA: BRANCHES (Chỉ Admin cần) ---
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => axiosInstance.get('/branches').then((res) => res.data),
    enabled: !user?.branch_id, // Chỉ gọi khi user không có branch cố định (Admin)
  });

  // --- 2. FETCH DATA: SPECIALIZATIONS ---
  const { data: specializations, isLoading: loadingSpecs } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => doctorService.getSpecializations(),
  });

  // --- 3. FETCH DATA: ROOMS (Cập nhật logic lọc theo branch) ---
  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', selectedBranchId], // Reload khi đổi chi nhánh
    queryFn: async () => {
      // Gọi API có truyền branch_id vào params để Backend lọc
      const res = await axiosInstance.get('/rooms', {
        params: { branch_id: selectedBranchId || undefined }
      });
      return res.data;
    },
  });

  // --- MUTATIONS: SPECIALIZATION ---
  const createSpecMutation = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/specializations', data).then((res) => res.data),
    onSuccess: () => {
      message.success('Tạo chuyên khoa thành công');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setSpecModalOpen(false);
      specForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const updateSpecMutation = useMutation({
    mutationFn: ({ id, data }: any) => axiosInstance.put(`/specializations/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      message.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setSpecModalOpen(false);
      setEditingSpec(null);
      specForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const deleteSpecMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/specializations/${id}`).then((res) => res.data),
    onSuccess: () => {
      message.success('Đã xóa chuyên khoa');
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
    onError: () => message.error('Không thể xóa (đang được sử dụng)'),
  });

  // --- MUTATIONS: ROOM ---
  const createRoomMutation = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/rooms', data).then((res) => res.data),
    onSuccess: () => {
      message.success('Tạo phòng khám thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomModalOpen(false);
      roomForm.resetFields();
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: any) => axiosInstance.put(`/rooms/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      message.success('Cập nhật phòng thành công');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomModalOpen(false);
      setEditingRoom(null);
      roomForm.resetFields();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/rooms/${id}`).then((res) => res.data),
    onSuccess: () => {
      message.success('Đã xóa phòng khám');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  // --- COLUMNS: SPECIALIZATION ---
  const specColumns = [
    {
      title: 'Tên chuyên khoa',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <MedicineBoxOutlined />
          </div>
          <span className="font-medium">{name}</span>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc?: string) => <span className="text-gray-500">{desc || '-'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              className="text-blue-500 hover:bg-blue-50"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingSpec(record);
                specForm.setFieldsValue(record);
                setSpecModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa chuyên khoa?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => deleteSpecMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- COLUMNS: ROOM ---
  const roomColumns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => <Tag color="purple" className="font-bold">{code}</Tag>,
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <HomeOutlined className="text-gray-400" />
          <span className="font-medium">{name}</span>
        </Space>
      ),
    },
    // Cột Chi nhánh (Chỉ hiện nếu Admin chưa lọc cụ thể)
    {
      title: 'Chi nhánh',
      dataIndex: 'branch',
      key: 'branch',
      hidden: !!user?.branch_id, // Ẩn nếu là Manager
      render: (branch: any) => branch ? <Tag color="blue">{branch.name}</Tag> : '-'
    },
    {
      title: 'Tòa nhà',
      dataIndex: 'building',
      key: 'building',
      render: (building: string) => building ? <Tag color="cyan">{building}</Tag> : '-',
    },
    {
      title: 'Vị trí',
      dataIndex: 'floor',
      key: 'floor',
      width: 100,
      render: (floor: string) => <Tag>{floor}</Tag>,
    },
    {
      title: 'Chuyên khoa',
      key: 'specialization',
      render: (_: any, record: any) =>
        record.specialization ? (
          <Tag color="blue">{record.specialization.name}</Tag>
        ) : (
          <span className="text-gray-400 text-xs italic">Chung</span>
        ),
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (capacity: number) => `${capacity} người`,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              className="text-blue-500 hover:bg-blue-50"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRoom(record);
                // Map dữ liệu vào form (làm phẳng object)
                roomForm.setFieldsValue({
                  ...record,
                  specialization_id: record.specialization?.id,
                  branch_id: record.branch_id
                });
                setRoomModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa phòng khám?"
            onConfirm={() => deleteRoomMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  // --- FILTER LOGIC (Client-side) ---
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((room: any) => {
      // 1. Lọc theo Search Text
      const matchSearch =
        room.name.toLowerCase().includes(searchText.toLowerCase()) ||
        room.code.toLowerCase().includes(searchText.toLowerCase());

      // 2. Lọc theo Chuyên khoa
      const matchSpec = filterSpecId ? room.specialization?.id === filterSpecId : true;

      // 3. Lọc theo Status (Giả lập)
      let matchStatus = true;
      if (filterStatus === 'empty') {
        // Logic giả định: phòng chưa có chuyên khoa là phòng trống
        // matchStatus = !room.specialization;
      }

      return matchSearch && matchSpec && matchStatus;
    });
  }, [rooms, searchText, filterSpecId, filterStatus]);

  // --- HANDLERS ---
  const handleSpecSubmit = (values: any) => {
    if (editingSpec) updateSpecMutation.mutate({ id: editingSpec.id, data: values });
    else createSpecMutation.mutate(values);
  };

  const handleRoomSubmit = (values: any) => {
    // Logic gán Branch ID:
    // - Nếu user là Manager: Lấy user.branch_id
    // - Nếu user là Admin: Lấy từ Form Select
    const payload = {
      ...values,
      branch_id: user?.branch_id || values.branch_id
    };

    if (!payload.branch_id) {
      message.error("Vui lòng chọn cơ sở cho phòng khám!");
      return;
    }

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data: payload });
    } else {
      createRoomMutation.mutate(payload);
    }
  };

  // --- TABS ITEMS ---
  const items = [
    {
      key: '1',
      label: (
        <Space>
          <MedicineBoxOutlined />
          <span>Quản lý Chuyên khoa</span>
        </Space>
      ),
      children: (
        <div className="mt-4">
          <div className="flex justify-between mb-4">
            <span className="text-gray-500">Danh sách các chuyên khoa trong hệ thống</span>
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
          </div>
          <Table
            columns={specColumns}
            dataSource={specializations || []}
            rowKey="id"
            loading={loadingSpecs}
            pagination={{ pageSize: 8 }}
            bordered
          />
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <Space>
          <HomeOutlined />
          <span>Quản lý Phòng khám</span>
        </Space>
      ),
      children: (
        <div className="mt-4">
          {/* Toolbar & Filters */}
          <Card size="small" className="mb-4 bg-gray-50 border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">

              <div className="flex flex-wrap gap-2 flex-1">
                {/* ADMIN BRANCH SELECTOR */}
                {!user?.branch_id && (
                  <Select
                    placeholder="Chọn Chi nhánh quản lý"
                    style={{ width: 220 }}
                    allowClear
                    value={selectedBranchId}
                    onChange={(val) => setSelectedBranchId(val)}
                    options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                    suffixIcon={<ShopOutlined />}
                    className="border-blue-200"
                  />
                )}

                {/* Search Input */}
                <Input
                  prefix={<SearchOutlined className="text-gray-400" />}
                  placeholder="Tìm tên phòng hoặc mã..."
                  allowClear
                  style={{ width: 200 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                {/* Spec Filter */}
                <Select
                  placeholder="Lọc theo chuyên khoa"
                  allowClear
                  style={{ width: 180 }}
                  onChange={(val) => setFilterSpecId(val)}
                  options={specializations?.map((spec: any) => ({ label: spec.name, value: spec.id }))}
                  suffixIcon={<FilterOutlined />}
                />

                {/* Status Filter */}
                <Select
                  defaultValue="all"
                  style={{ width: 160 }}
                  onChange={(val) => setFilterStatus(val)}
                  options={[
                    { label: 'Tất cả trạng thái', value: 'all' },
                    { label: 'Đang hoạt động', value: 'active' },
                    { label: 'Còn trống', value: 'empty' },
                    { label: 'Bảo trì', value: 'maintenance' },
                  ]}
                />
              </div>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                // Nếu là Admin mà chưa chọn Branch Filter thì disable nút thêm để tránh lỗi
                disabled={!user?.branch_id && !selectedBranchId}
                title={!user?.branch_id && !selectedBranchId ? "Vui lòng chọn chi nhánh trước khi thêm phòng" : ""}
                onClick={() => {
                  setEditingRoom(null);
                  roomForm.resetFields();
                  // Nếu Admin đã filter theo branch, set default value cho form luôn
                  if (selectedBranchId) roomForm.setFieldValue('branch_id', selectedBranchId);
                  setRoomModalOpen(true);
                }}
              >
                Thêm phòng mới
              </Button>
            </div>

            {!user?.branch_id && !selectedBranchId && (
              <div className="text-orange-500 mt-2 text-xs flex items-center gap-1">
                <ShopOutlined /> Vui lòng chọn Chi nhánh để xem và quản lý danh sách phòng khám.
              </div>
            )}
          </Card>

          <Table
            columns={roomColumns}
            dataSource={filteredRooms}
            rowKey="id"
            loading={loadingRooms}
            pagination={{ pageSize: 8 }}
            bordered
          />
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4">
        <Card bordered={false} className="shadow-sm">
          <Tabs defaultActiveKey="1" items={items} size="large" />
        </Card>

        {/* --- MODAL SPECIALIZATION --- */}
        <Modal
          title={
            <Space>
              <div className="p-1 bg-blue-100 rounded text-blue-600"><MedicineBoxOutlined /></div>
              {editingSpec ? 'Cập nhật chuyên khoa' : 'Thêm chuyên khoa mới'}
            </Space>
          }
          open={specModalOpen}
          onCancel={() => setSpecModalOpen(false)}
          onOk={() => specForm.submit()}
          confirmLoading={createSpecMutation.isPending || updateSpecMutation.isPending}
          destroyOnClose
        >
          <Form form={specForm} layout="vertical" onFinish={handleSpecSubmit} className="pt-4">
            <Form.Item
              name="name"
              label="Tên chuyên khoa"
              rules={[{ required: true, message: 'Vui lòng nhập tên chuyên khoa' }]}
            >
              <Input placeholder="VD: Nội tổng quát, Răng hàm mặt..." size="large" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <TextArea rows={4} placeholder="Mô tả chi tiết về chuyên khoa này..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* --- MODAL ROOM --- */}
        <Modal
          title={
            <Space>
              <div className="p-1 bg-purple-100 rounded text-purple-600"><HomeOutlined /></div>
              {editingRoom ? 'Cập nhật thông tin phòng' : 'Thêm phòng khám mới'}
            </Space>
          }
          open={roomModalOpen}
          onCancel={() => setRoomModalOpen(false)}
          onOk={() => roomForm.submit()}
          confirmLoading={createRoomMutation.isPending || updateRoomMutation.isPending}
          destroyOnClose
          width={700}
        >
          <Form form={roomForm} layout="vertical" onFinish={handleRoomSubmit} className="pt-4">

            {/* Nếu là Admin thì hiện ô chọn Branch trong Modal */}
            {!user?.branch_id && (
              <Form.Item
                name="branch_id"
                label="Thuộc Chi nhánh"
                rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
              >
                <Select
                  placeholder="Chọn chi nhánh quản lý phòng này"
                  options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                  size="large"
                />
              </Form.Item>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="code"
                label="Mã phòng"
                rules={[{ required: true, message: 'Nhập mã phòng' }]}
              >
                <Input placeholder="VD: P001" disabled={!!editingRoom} />
              </Form.Item>
              <Form.Item
                name="name"
                label="Tên phòng"
                rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
              >
                <Input placeholder="VD: Phòng khám Nội 1" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="building" label="Tòa nhà">
                <Input placeholder="Tòa A" />
              </Form.Item>
              <Form.Item
                name="floor"
                label="Vị trí (Tầng)"
                rules={[{ required: true, message: 'Nhập tầng' }]}
              >
                <Input placeholder="Tầng 2" />
              </Form.Item>
              <Form.Item
                name="capacity"
                label="Sức chứa"
                initialValue={1}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </div>

            <Divider orientation="left" plain>Cấu hình chuyên môn</Divider>

            <Form.Item
              name="specialization_id"
              label="Chuyên khoa (Nếu là phòng chuyên biệt)"
              extra="Để trống nếu là phòng khám đa khoa hoặc phòng chức năng chung"
            >
              <Select
                placeholder="Chọn chuyên khoa"
                allowClear
                options={specializations?.map((s: any) => ({ label: s.name, value: s.id }))}
                size="large"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}