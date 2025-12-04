// src/pages/admin/BranchManagement.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table, Card, Button, Space, Input, Modal, Form,
    message, Popconfirm, Tag, Tooltip, Typography, Select
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    ShopOutlined, PhoneOutlined, EnvironmentOutlined, GlobalOutlined,
    CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { branchesService } from '@/services/branches.service'; // Đảm bảo import đúng
import DashboardLayout from '@/components/layouts/DashboardLayout';

const { Title } = Typography;
const { Option } = Select;

export default function BranchManagement() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<any>(null); // any để linh hoạt
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    // --- Fetch Data ---
    const { data: branches, isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getBranches,
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: branchesService.createBranch,
        onSuccess: () => {
            message.success('Thêm chi nhánh thành công');
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            handleCloseModal();
        },
        onError: () => message.error('Lỗi khi thêm chi nhánh'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            branchesService.updateBranch(id, data),
        onSuccess: () => {
            message.success('Cập nhật thông tin thành công');
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            handleCloseModal();
        },
        onError: () => message.error('Lỗi khi cập nhật'),
    });

    const deleteMutation = useMutation({
        mutationFn: branchesService.deleteBranch,
        onSuccess: () => {
            message.success('Đã chuyển chi nhánh sang trạng thái ngừng hoạt động');
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        },
        onError: () => message.error('Không thể xóa chi nhánh này'),
    });

    // --- Handlers ---
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
        form.resetFields();
    };

    const handleSubmit = (values: any) => {
        if (editingBranch) {
            updateMutation.mutate({ id: editingBranch.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const openEditModal = (record: any) => {
        setEditingBranch(record);
        form.setFieldsValue({
            ...record,
            // Đảm bảo load đúng trạng thái vào form
            is_active: record.is_active
        });
        setIsModalOpen(true);
    };

    // --- Columns ---
    const columns = [
        {
            title: 'Tên chi nhánh',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <ShopOutlined />
                    </div>
                    <span className="font-bold text-gray-700">{text}</span>
                </Space>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (text: string) => <span className="text-gray-500">{text}</span>,
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_: any, record: any) => (
                <div className="flex flex-col gap-1 text-xs">
                    <Space><PhoneOutlined className="text-blue-500" /> {record.phone}</Space>
                    {record.email && <Space><GlobalOutlined className="text-green-500" /> {record.email}</Space>}
                </div>
            ),
        },
        // --- SỬA PHẦN HIỂN THỊ TRẠNG THÁI ---
        {
            title: 'Trạng thái',
            dataIndex: 'is_active', // Map đúng tên trường trong DB
            key: 'is_active',
            render: (isActive: boolean) =>
                isActive ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Đang hoạt động</Tag>
                ) : (
                    <Tag color="error" icon={<StopOutlined />}>Ngừng hoạt động</Tag>
                ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title="Sửa">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => openEditModal(record)}
                        />
                    </Tooltip>

                    {/* Chỉ hiện nút Xóa nếu đang Active */}
                    {record.is_active && (
                        <Popconfirm
                            title="Ngừng hoạt động chi nhánh này?"
                            description="Chi nhánh sẽ chuyển sang trạng thái ẩn."
                            onConfirm={() => deleteMutation.mutate(record.id)}
                            okButtonProps={{ danger: true }}
                            okText="Đồng ý"
                            cancelText="Hủy"
                        >
                            <Tooltip title="Ngừng hoạt động">
                                <Button icon={<DeleteOutlined />} type="text" danger />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // Filter Logic
    const filteredData = branches?.filter((item: any) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.address.toLowerCase().includes(searchText.toLowerCase())
    ) || [];

    return (
        <DashboardLayout>
            <div className="p-2">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <Title level={3} className="m-0">Quản lý Hệ thống Chi nhánh</Title>
                        <span className="text-gray-500">Quản lý danh sách các cơ sở trong hệ thống</span>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => { setIsModalOpen(true); form.resetFields(); }}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-md"
                    >
                        Thêm chi nhánh mới
                    </Button>
                </div>

                <Card className="shadow-sm border-gray-200">
                    <div className="mb-4 flex gap-4">
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            size="large"
                            className="max-w-md"
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 6 }}
                    />
                </Card>

                {/* --- MODAL FORM ĐÃ THÊM TRẠNG THÁI --- */}
                <Modal
                    title={editingBranch ? "Cập nhật thông tin" : "Thêm chi nhánh mới"}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    onOk={() => form.submit()}
                    confirmLoading={createMutation.isPending || updateMutation.isPending}
                    destroyOnClose
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ is_active: true }}>
                        <Form.Item
                            name="name"
                            label="Tên chi nhánh"
                            rules={[{ required: true, message: "Vui lòng nhập tên chi nhánh" }]}
                        >
                            <Input prefix={<ShopOutlined />} placeholder="VD: Cơ sở TP.HCM" />
                        </Form.Item>

                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                        >
                            <Input prefix={<EnvironmentOutlined />} placeholder="VD: Quận 10..." />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="phone"
                                label="Hotline"
                                rules={[{ required: true, message: "Nhập số điện thoại" }]}
                            >
                                <Input prefix={<PhoneOutlined />} />
                            </Form.Item>

                            <Form.Item name="email" label="Email liên hệ">
                                <Input prefix={<GlobalOutlined />} />
                            </Form.Item>
                        </div>

                        {/* CHỈ HIỆN CHỌN TRẠNG THÁI KHI ĐANG SỬA */}
                        {editingBranch && (
                            <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="value">
                                <Select>
                                    <Option value={true}>
                                        <Space><CheckCircleOutlined className="text-green-500" /> Đang hoạt động</Space>
                                    </Option>
                                    <Option value={false}>
                                        <Space><StopOutlined className="text-red-500" /> Ngừng hoạt động</Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        )}
                    </Form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}