import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Button,
  Typography,
  Form,
  Input,
  message,
  Avatar,
  Divider,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

interface AdminProfile {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: string;
}

interface UpdateProfileDto {
  full_name?: string;
  email?: string;
}

export default function AdminProfile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      const response = await axiosInstance.get('/auth/me');
      return response.data as AdminProfile;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => {
      // Note: Backend might need an update profile endpoint for admin
      return axiosInstance.put(`/users/${user?.id}`, data);
    },
    onSuccess: (response) => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      if (response.data.full_name) {
        updateUser({
          ...user!,
          full_name: response.data.full_name,
          email: response.data.email,
        });
      }
      setIsEditing(false);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    },
  });

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
    const data: UpdateProfileDto = {
      full_name: values.full_name,
      email: values.email,
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card loading />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <div className="text-center py-8 text-red-500">
              Không tìm thấy thông tin hồ sơ
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2}>Hồ sơ của tôi</Title>
          {!isEditing && (
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              Chỉnh sửa
            </Button>
          )}
        </div>

        <Card>
          <div className="flex items-center mb-6">
            <Avatar
              size={80}
              icon={<UserOutlined />}
              className="mr-4"
              style={{ backgroundColor: '#f56a00' }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {profile.full_name}
              </Title>
              <Text type="secondary">
                <CrownOutlined /> Quản trị viên
              </Text>
              <br />
              <Text type="secondary">{profile.phone}</Text>
            </div>
          </div>

          <Divider />

          {!isEditing ? (
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Họ và tên">
                {profile.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                Quản trị viên
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {profile.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {profile.email || '-'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                rules={[
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập địa chỉ email" />
              </Form.Item>

              <div className="flex justify-end gap-2 mt-4">
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
