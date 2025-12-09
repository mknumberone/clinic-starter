// src/pages/manager/ManagerProfile.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Descriptions, Button, Typography, Form, Input, message, Avatar, Divider, Tag, Spin, Alert, Space
} from 'antd';
import {
    UserOutlined, EditOutlined, SaveOutlined, CloseOutlined, ShopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

interface ManagerProfile {
    id: string;
    phone: string;
    email?: string;
    full_name: string;
    role: string;
    branch_id?: string;
    branch?: {
        name: string;
    };
}

// Giả định backend có endpoint chung để sửa thông tin User (hoặc /staff/:id)
interface UpdateProfileDto {
    full_name?: string;
    email?: string;
    // Các trường khác như password_hash, v.v.
}

export default function ManagerProfile() {
    const { user, updateUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    // 1. Lấy thông tin hồ sơ (dùng API /auth/me để lấy profile đầy đủ)
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['manager-profile', user?.id],
        queryFn: async () => {
            const response = await axiosInstance.get('/auth/me');
            // Thêm thông tin branch nếu user có branch_id
            const data = response.data;
            if (data.branch_id) {
                const branchRes = await axiosInstance.get(`/branches/${data.branch_id}`);
                data.branch = branchRes.data;
            }
            return data as ManagerProfile;
        },
        enabled: !!user,
    });

    // 2. Mutation cập nhật (Sử dụng API staff/users chung)
    const updateMutation = useMutation({
        mutationFn: (data: UpdateProfileDto) => {
            // Sửa profile của chính mình qua API /staff/:id
            return axiosInstance.put(`/staff/${user?.id}`, data);
        },
        onSuccess: (response) => {
            message.success('Cập nhật hồ sơ thành công');
            queryClient.invalidateQueries({ queryKey: ['manager-profile'] });

            // Cập nhật lại tên hiển thị trên Header
            if (response.data.full_name) {
                updateUser({
                    ...user!,
                    full_name: response.data.full_name,
                });
            }
            setIsEditing(false);
        },
        onError: () => {
            message.error('Có lỗi xảy ra khi cập nhật hồ sơ');
        },
    });

    // --- Handlers ---
    const handleEdit = () => {
        if (profile) {
            form.setFieldsValue({
                full_name: profile.full_name,
                email: profile.email,
            });
        }
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.resetFields();
    };

    const handleSubmit = (values: any) => {
        updateMutation.mutate(values);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Spin size="large" tip="Đang tải hồ sơ..." /></div>;
    }

    if (error || !profile) {
        return <Alert message="Không tìm thấy hồ sơ" description="Vui lòng đăng xuất và đăng nhập lại." type="error" showIcon />;
    }


    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <Title level={2}>Hồ sơ cá nhân</Title>
                    {!isEditing && (
                        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                            Chỉnh sửa
                        </Button>
                    )}
                </div>

                <Card className='shadow-md'>
                    <div className="flex items-center mb-6">
                        <Avatar size={80} icon={<UserOutlined />} className="mr-4 bg-orange-100 text-orange-600" />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                {profile.full_name}
                            </Title>
                            <Text type="secondary">
                                <Tag color='orange'>Quản lý Chi nhánh</Tag>
                            </Text>
                        </div>
                    </div>

                    <Divider />

                    {!isEditing ? (
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                            <Descriptions.Item label="Họ và tên">
                                {profile.full_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Vai trò">
                                Quản lý Chi nhánh
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {profile.phone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {profile.email || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chi nhánh quản lý" span={2}>
                                <Space>
                                    <ShopOutlined />
                                    <Text strong className='text-blue-600'>{profile.branch?.name || 'Không xác định'}</Text>
                                    {profile.branch?.name && <Tag color='green' icon={<CheckCircleOutlined />}>Đã gán</Tag>}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                    ) : (
                        <Form form={form} layout="vertical" onFinish={handleSubmit} className='max-w-xl'>
                            <Form.Item
                                name="full_name"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                            >
                                <Input placeholder="Nhập họ và tên" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                            >
                                <Input placeholder="Nhập địa chỉ email" />
                            </Form.Item>

                            <div className="flex justify-start gap-2 mt-4">
                                <Button icon={<CloseOutlined />} onClick={handleCancel}>
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    htmlType="submit"
                                    loading={updateMutation.isPending}
                                >
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}