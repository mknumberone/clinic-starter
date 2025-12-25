import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Form,
  Input,
  message,
  Avatar,
  Divider,
  Tag,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';
import AvatarUpload from '@/components/upload/AvatarUpload';
import { uploadService } from '@/services/upload.service';

const { Title, Text } = Typography;

interface DoctorProfile {
  id: string;
  user_id: string;
  code: string;
  title?: string;
  biography?: string;
  qualifications?: any;
  user: {
    id: string;
    phone: string;
    email?: string;
    full_name: string;
    avatar?: string;
  };
  specialization?: {
    id: string;
    name: string;
  };
}

interface UpdateProfileDto {
  title?: string;
  biography?: string;
  avatar?: string;
}

export default function DoctorProfile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  // 1. Lấy thông tin hồ sơ (Logic đã sửa: Tìm theo User ID)
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['my-doctor-profile-detail', user?.id],
    queryFn: async () => {
      // Gọi API lấy danh sách bác sĩ với limit lớn để tìm chính mình
      const res = await axiosInstance.get('/doctors', {
        params: { 
          limit: 1000
        }
      });

      const doctors = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      // Tìm bác sĩ có user_id trùng với user đang đăng nhập
      const myProfile = doctors.find((d: any) => {
        return d.user?.id === user?.id || d.user_id === user?.id;
      });

      if (!myProfile) {
        throw new Error('Tài khoản chưa liên kết với hồ sơ bác sĩ');
      }
      
      // Gọi chi tiết để lấy đầy đủ thông tin (nếu API list thiếu trường)
      const detailRes = await axiosInstance.get(`/doctors/${myProfile.id}`);
      return detailRes.data as DoctorProfile;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => {
      return axiosInstance.put(`/doctors/${profile?.id}`, data);
    },
    onSuccess: (response) => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile-detail'] });
      // Update avatar in auth store if changed
      if (response.data?.user?.avatar) {
        updateUser({
          ...user!,
          avatar: response.data.user.avatar,
        });
      }
      setIsEditing(false);
      setAvatarUrl(undefined); // Reset avatarUrl state
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    },
  });

  const handleEdit = () => {
    if (profile) {
      form.setFieldsValue({
        title: profile.title,
        biography: profile.biography,
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
      title: values.title,
      biography: values.biography,
      avatar: avatarUrl,
    };
    updateMutation.mutate(data);
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    message.success('Đã tải ảnh đại diện lên');
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" tip="Đang tải hồ sơ..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert
            type="error"
            message="Không tìm thấy hồ sơ"
            description="Tài khoản của bạn chưa được liên kết với hồ sơ bác sĩ nào."
            showIcon
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Title level={2} style={{ margin: 0 }}>Hồ sơ của tôi</Title>
          {!isEditing && (
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              Chỉnh sửa thông tin
            </Button>
          )}
        </div>

        <Card className="shadow-md">
          <div className="flex items-center mb-8 p-4 bg-gray-50 rounded-lg">
            {isEditing ? (
              <div className="mr-6">
                <AvatarUpload
                  currentAvatar={profile.user.avatar}
                  onUploadSuccess={handleAvatarUpload}
                  size={120}
                />
                <p className="text-center text-sm text-gray-500 mt-2">Click để đổi ảnh</p>
              </div>
            ) : (
              <Avatar
                size={120}
                src={profile.user.avatar ? uploadService.getFileUrl(profile.user.avatar) : undefined}
                icon={<UserOutlined />}
                className="mr-6 border-4 border-white shadow-sm bg-indigo-200 text-indigo-600"
              />
            )}
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {profile.title ? `${profile.title}. ` : 'Bác sĩ '} {profile.user.full_name}
              </Title>
              <div className="mt-2 space-x-2">
                <Tag color="blue">{profile.code}</Tag>
                {profile.specialization ? (
                  <Tag color="purple">{profile.specialization.name}</Tag>
                ) : (
                  <Tag>Chưa phân khoa</Tag>
                )}
              </div>
            </div>
          </div>

          <Divider orientation="left">Thông tin chi tiết</Divider>

          {!isEditing ? (
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle" labelStyle={{ width: '150px', fontWeight: 600 }}>
              <Descriptions.Item label="Họ và tên">
                {profile.user.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Mã bác sĩ">
                {profile.code}
              </Descriptions.Item>
              <Descriptions.Item label="Chức danh">
                {profile.title || <span className="text-gray-400 italic">Chưa cập nhật</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {profile.user.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {profile.user.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Chuyên khoa">
                {profile.specialization?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tiểu sử / Kinh nghiệm" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {profile.biography || <span className="text-gray-400 italic">Chưa có thông tin giới thiệu</span>}
                </div>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-w-2xl">
              <Form.Item
                name="title"
                label="Chức danh"
                rules={[{ required: true, message: 'Vui lòng nhập chức danh' }]}
                tooltip="Ví dụ: Bác sĩ, Thạc sĩ, Tiến sĩ..."
              >
                <Input placeholder="VD: Bác sĩ CKI" />
              </Form.Item>

              <Form.Item name="biography" label="Tiểu sử & Kinh nghiệm">
                <Input.TextArea
                  rows={6}
                  placeholder="Giới thiệu về bản thân, số năm kinh nghiệm, thế mạnh chuyên môn..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <div className="flex justify-start gap-3 mt-6">
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={updateMutation.isPending}>
                  Lưu thay đổi
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancel}>
                  Hủy bỏ
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}