// File: src/pages/admin/SpecializationAndRoom.tsx

import { useState, useMemo } from 'react';
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
  FilterOutlined,
  GiftOutlined
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
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  // --- STATE FILTER ---
  const [searchText, setSearchText] = useState('');
  const [filterSpecId, setFilterSpecId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [packageSearchText, setPackageSearchText] = useState('');
  const [packageFilterSpecId, setPackageFilterSpecId] = useState<string | null>(null);

  // State mới: Chọn chi nhánh (Dành cho Admin)
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(user?.branch_id || null);

  const [specForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [packageForm] = Form.useForm();

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

  // --- 4. FETCH DATA: EXAMINATION PACKAGES ---
  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ['examination-packages', packageFilterSpecId],
    queryFn: async () => {
      const res = await axiosInstance.get('/examination-packages', {
        params: { specialization_id: packageFilterSpecId || undefined }
      });
      return res.data || [];
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
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Có lỗi xảy ra');
      message.error(errorMessage);
    },
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
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Có lỗi xảy ra');
      message.error(errorMessage);
    },
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

  // --- MUTATIONS: EXAMINATION PACKAGE ---
  const createPackageMutation = useMutation({
    mutationFn: (data: any) => axiosInstance.post('/examination-packages', data).then((res) => res.data),
    onSuccess: () => {
      message.success('Tạo gói khám thành công');
      queryClient.invalidateQueries({ queryKey: ['examination-packages'] });
      setPackageModalOpen(false);
      packageForm.resetFields();
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Có lỗi xảy ra');
      message.error(errorMessage);
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }: any) => axiosInstance.put(`/examination-packages/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      message.success('Cập nhật gói khám thành công');
      queryClient.invalidateQueries({ queryKey: ['examination-packages'] });
      setPackageModalOpen(false);
      setEditingPackage(null);
      packageForm.resetFields();
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message ||
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Có lỗi xảy ra');
      message.error(errorMessage);
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/examination-packages/${id}`).then((res) => res.data),
    onSuccess: () => {
      message.success('Đã xóa gói khám');
      queryClient.invalidateQueries({ queryKey: ['examination-packages'] });
    },
    onError: () => message.error('Không thể xóa gói khám'),
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
                // Nếu slug là "temp-slug" thì tự động generate lại từ name
                const formValues = { ...record };
                if (formValues.slug === 'temp-slug' && formValues.name) {
                  formValues.slug = generateSlug(formValues.name);
                }
                specForm.setFieldsValue(formValues);
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

  // --- COLUMNS: EXAMINATION PACKAGE ---
  const packageColumns = [
    {
      title: 'Tên gói khám',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <GiftOutlined />
          </div>
          <div>
            <div className="font-medium">{name}</div>
            {record.is_featured && (
              <Tag color="gold" className="mt-1">Nổi bật</Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Chuyên khoa',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (spec: any) => spec ? <Tag color="blue">{spec.name}</Tag> : '-',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) => (
        <div>
          <div className="font-bold text-[#009CAA]">
            {new Intl.NumberFormat('vi-VN').format(Number(price))} đ
          </div>
          {record.original_price && Number(record.original_price) > Number(price) && (
            <div className="text-xs text-gray-400 line-through">
              {new Intl.NumberFormat('vi-VN').format(Number(record.original_price))} đ
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration} phút` : '-',
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'services',
      key: 'services',
      render: (services: any) => {
        if (!services) return '-';
        const serviceList = Array.isArray(services) ? services : JSON.parse(services || '[]');
        return serviceList.length > 0 ? (
          <Tag color="cyan">{serviceList.length} dịch vụ</Tag>
        ) : '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
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
                setEditingPackage(record);
                const services = Array.isArray(record.services)
                  ? record.services
                  : (record.services ? JSON.parse(record.services) : []);
                packageForm.setFieldsValue({
                  ...record,
                  services: services.join('\n'),
                  specialization_id: record.specialization?.id || record.specialization_id
                });
                setPackageModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa gói khám?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => deletePackageMutation.mutate(record.id)}
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

  const filteredPackages = useMemo(() => {
    if (!packages) return [];
    return packages.filter((pkg: any) => {
      // 1. Lọc theo Search Text
      const matchSearch =
        pkg.name.toLowerCase().includes(packageSearchText.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(packageSearchText.toLowerCase()));

      // 2. Lọc theo Chuyên khoa (đã filter ở query level)
      return matchSearch;
    });
  }, [packages, packageSearchText]);

  // --- HANDLERS ---
  // Helper function: Tạo slug từ tên chuyên khoa
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-') // Thay ký tự đặc biệt bằng dấu gạch ngang
      .replace(/^-+|-+$/g, ''); // Loại bỏ dấu gạch ngang ở đầu và cuối
  };

  const handleSpecSubmit = (values: any) => {
    // Đảm bảo slug không phải là "temp-slug" hoặc rỗng
    if (!values.slug || values.slug === 'temp-slug') {
      if (values.name) {
        values.slug = generateSlug(values.name);
      } else {
        message.error('Vui lòng nhập tên chuyên khoa để tạo slug');
        return;
      }
    }

    // Loại bỏ các trường rỗng để tránh gửi dữ liệu không cần thiết
    const cleanValues: any = {
      name: values.name,
      slug: values.slug,
    };

    if (values.description) cleanValues.description = values.description;
    if (values.image) cleanValues.image = values.image;
    if (values.icon) cleanValues.icon = values.icon;
    if (values.content) cleanValues.content = values.content;

    if (editingSpec) {
      updateSpecMutation.mutate({ id: editingSpec.id, data: cleanValues });
    } else {
      createSpecMutation.mutate(cleanValues);
    }
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

  const handlePackageSubmit = (values: any) => {
    // Chuyển đổi services từ textarea (mỗi dòng một dịch vụ) sang array
    const servicesArray = values.services
      ? values.services.split('\n').filter((s: string) => s.trim()).map((s: string) => s.trim())
      : [];

    // Đảm bảo có slug (nếu chưa nhập thì tự tạo từ tên gói)
    if (!values.slug && values.name) {
      values.slug = generateSlug(values.name);
    }

    const payload = {
      ...values,
      services: servicesArray.length > 0 ? servicesArray : undefined,
      price: Number(values.price),
      original_price: values.original_price ? Number(values.original_price) : undefined,
      duration: values.duration ? Number(values.duration) : undefined,
      is_active: values.is_active === true || values.is_active === 'true',
      is_featured: values.is_featured === true || values.is_featured === 'true',
    };

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: payload });
    } else {
      createPackageMutation.mutate(payload);
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
    {
      key: '3',
      label: (
        <Space>
          <GiftOutlined />
          <span>Quản lý Gói khám</span>
        </Space>
      ),
      children: (
        <div className="mt-4">
          {/* Toolbar & Filters */}
          <Card size="small" className="mb-4 bg-gray-50 border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-wrap gap-2 flex-1">
                {/* Search Input */}
                <Input
                  prefix={<SearchOutlined className="text-gray-400" />}
                  placeholder="Tìm tên gói khám..."
                  allowClear
                  style={{ width: 250 }}
                  onChange={(e) => setPackageSearchText(e.target.value)}
                />

                {/* Spec Filter */}
                <Select
                  placeholder="Lọc theo chuyên khoa"
                  allowClear
                  style={{ width: 220 }}
                  value={packageFilterSpecId}
                  onChange={(val) => setPackageFilterSpecId(val)}
                  options={specializations?.map((spec: any) => ({ label: spec.name, value: spec.id }))}
                  suffixIcon={<FilterOutlined />}
                />
              </div>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingPackage(null);
                  packageForm.resetFields();
                  setPackageModalOpen(true);
                }}
              >
                Thêm gói khám mới
              </Button>
            </div>
          </Card>

          <Table
            columns={packageColumns}
            dataSource={filteredPackages}
            rowKey="id"
            loading={loadingPackages}
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
          width={700}
        >
          <Form form={specForm} layout="vertical" onFinish={handleSpecSubmit} className="pt-4">
            <Form.Item
              name="name"
              label="Tên chuyên khoa"
              rules={[{ required: true, message: 'Vui lòng nhập tên chuyên khoa' }]}
            >
              <Input
                placeholder="VD: Nội tổng quát, Răng hàm mặt..."
                size="large"
                onBlur={(e) => {
                  const nameValue = e.target.value;
                  const currentSlug = specForm.getFieldValue('slug');
                  // Tự động tạo slug nếu chưa có hoặc đang chỉnh sửa và slug chưa được nhập
                  if (nameValue && (!currentSlug || (!editingSpec && !currentSlug))) {
                    specForm.setFieldValue('slug', generateSlug(nameValue));
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="slug"
              label="URL thân thiện (Slug)"
              rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
              extra="VD: noi-tong-quat, rang-ham-mat (dùng để tạo URL cho trang chi tiết). Slug sẽ tự động được tạo từ tên chuyên khoa."
            >
              <Input placeholder="VD: noi-tong-quat" size="large" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="image"
                label="Link ảnh bìa"
                extra="URL ảnh bìa hiển thị trên trang chi tiết"
              >
                <Input placeholder="https://example.com/image.jpg" size="large" />
              </Form.Item>

              <Form.Item
                name="icon"
                label="Link icon"
                extra="URL icon nhỏ (nếu cần)"
              >
                <Input placeholder="https://example.com/icon.png" size="large" />
              </Form.Item>
            </div>

            <Form.Item name="description" label="Mô tả ngắn">
              <TextArea rows={3} placeholder="Mô tả ngắn gọn về chuyên khoa này..." />
            </Form.Item>

            <Divider orientation="left" plain>Nội dung chi tiết</Divider>

            <Form.Item
              name="content"
              label="Nội dung trang chi tiết (HTML)"
              extra="Nội dung HTML hiển thị trên trang chi tiết chuyên khoa. Có thể dùng HTML để định dạng."
            >
              <TextArea
                rows={8}
                placeholder="Nhập nội dung HTML cho trang chi tiết chuyên khoa. VD: &lt;p&gt;Chuyên khoa Nội tổng quát...&lt;/p&gt;"
              />
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

        {/* --- MODAL EXAMINATION PACKAGE --- */}
        <Modal
          title={
            <Space>
              <div className="p-1 bg-purple-100 rounded text-purple-600"><GiftOutlined /></div>
              {editingPackage ? 'Cập nhật gói khám' : 'Thêm gói khám mới'}
            </Space>
          }
          open={packageModalOpen}
          onCancel={() => setPackageModalOpen(false)}
          onOk={() => packageForm.submit()}
          confirmLoading={createPackageMutation.isPending || updatePackageMutation.isPending}
          destroyOnClose
          width={800}
        >
          <Form form={packageForm} layout="vertical" onFinish={handlePackageSubmit} className="pt-4">
            <Form.Item
              name="name"
              label="Tên gói khám"
              rules={[{ required: true, message: 'Vui lòng nhập tên gói khám' }]}
            >
              <Input
                placeholder="VD: Gói khám sức khỏe tổng quát"
                size="large"
                onBlur={(e) => {
                  const nameValue = e.target.value;
                  const currentSlug = packageForm.getFieldValue('slug');
                  if (nameValue && !currentSlug && !editingPackage) {
                    packageForm.setFieldValue('slug', generateSlug(nameValue));
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Đường dẫn (Slug)"
              rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
              extra="Dùng để tạo URL cho trang chi tiết gói khám. Mặc định được sinh từ tên gói."
            >
              <Input placeholder="vd: goi-kham-suc-khoe-tong-quat" size="large" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Nhóm gói khám"
              extra="Phân loại gói khám (dùng cho trang Gói khám tổng hợp)"
            >
              <Select
                placeholder="Chọn nhóm gói khám"
                allowClear
                options={[
                  { label: 'Khám sức khỏe', value: 'health-check' },
                  { label: 'Khám theo yêu cầu', value: 'custom-check' },
                  { label: 'Khám tiền hôn nhân', value: 'pre-marriage' },
                  { label: 'Gói khám chuyên khoa', value: 'specialty' },
                ]}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="specialization_id"
              label="Chuyên khoa"
              rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa' }]}
            >
              <Select
                placeholder="Chọn chuyên khoa"
                options={specializations?.map((s: any) => ({ label: s.name, value: s.id }))}
                size="large"
              />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Mô tả về gói khám..." />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  placeholder="500000"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="original_price"
                label="Giá gốc (VND) - Nếu có giảm giá"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                  placeholder="600000"
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="duration"
                label="Thời gian khám (phút)"
              >
                <InputNumber
                  min={1}
                  className="w-full"
                  placeholder="120"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="image"
                label="Link ảnh minh họa"
              >
                <Input placeholder="https://example.com/image.jpg" size="large" />
              </Form.Item>
            </div>

            <Divider orientation="left" plain>Dịch vụ trong gói</Divider>

            <Form.Item
              name="services"
              label="Danh sách dịch vụ"
              extra="Nhập từng dịch vụ, mỗi dịch vụ một dòng"
            >
              <TextArea
                rows={6}
                placeholder="Khám tổng quát&#10;Xét nghiệm máu&#10;Siêu âm bụng&#10;..."
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="is_active"
                label="Trạng thái"
                initialValue={true}
              >
                <Select size="large">
                  <Select.Option value={true}>Hoạt động</Select.Option>
                  <Select.Option value={false}>Tạm dừng</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="is_featured"
                label="Gói nổi bật"
                initialValue={false}
              >
                <Select size="large">
                  <Select.Option value={true}>Có</Select.Option>
                  <Select.Option value={false}>Không</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}