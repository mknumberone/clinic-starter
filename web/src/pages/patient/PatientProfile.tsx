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
  Select,
  DatePicker,
  message,
  Avatar,
  Divider,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';
import AvatarUpload from '@/components/upload/AvatarUpload';
import { uploadService } from '@/services/upload.service';

const { Title, Text } = Typography;

interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  insurance?: string;
  user: {
    id: string;
    phone: string;
    email?: string;
    full_name: string;
    avatar?: string;
  };
}

interface UpdateProfileDto {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  insurance?: string;
  avatar?: string;
}

export default function PatientProfile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile', user?.id],
    queryFn: async () => {
      // Get patient info for the logged-in user
      const patientsResponse = await axiosInstance.get('/patients', { 
        params: { 
          user_id: user?.id, // Filter by logged-in user's ID
          limit: 1 
        } 
      });
      const patients = patientsResponse.data.data;
      if (patients && patients.length > 0) {
        const patientId = patients[0].id;
        const profileResponse = await axiosInstance.get(`/patients/${patientId}`);
        return profileResponse.data as PatientProfile;
      }
      throw new Error('Patient not found');
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => {
      return axiosInstance.put(`/patients/${profile?.id}`, data);
    },
    onSuccess: (response) => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      if (response.data.patient?.user) {
        updateUser({
          ...user!,
          full_name: response.data.patient.user.full_name,
          avatar: response.data.patient.user.avatar, // Update avatar in auth store
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
        full_name: profile.user.full_name,
        date_of_birth: profile.date_of_birth ? dayjs(profile.date_of_birth) : undefined,
        gender: profile.gender,
        address: profile.address,
        emergency_contact: profile.emergency_contact,
        insurance: profile.insurance,
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
      date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
      gender: values.gender,
      address: values.address,
      emergency_contact: values.emergency_contact,
      insurance: values.insurance,
      avatar: avatarUrl,
    };
    updateMutation.mutate(data);
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    message.success('Đã tải ảnh đại diện lên');
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
            {isEditing ? (
              <div className="mr-4">
                <AvatarUpload
                  currentAvatar={profile.user.avatar}
                  onUploadSuccess={handleAvatarUpload}
                  size={100}
                />
                <p className="text-center text-sm text-gray-500 mt-2">Click để đổi ảnh</p>
              </div>
            ) : (
              <Avatar
                size={100}
                src={profile.user.avatar ? uploadService.getFileUrl(profile.user.avatar) : undefined}
                icon={<UserOutlined />}
                className="mr-4"
              />
            )}
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {profile.user.full_name}
              </Title>
              <Text type="secondary">{profile.user.phone}</Text>
            </div>
          </div>

          <Divider />

          {!isEditing ? (
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Họ và tên">
                {profile.user.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {profile.user.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {profile.user.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {profile.date_of_birth
                  ? dayjs(profile.date_of_birth).format('DD/MM/YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {profile.gender === 'male'
                  ? 'Nam'
                  : profile.gender === 'female'
                  ? 'Nữ'
                  : profile.gender === 'other'
                  ? 'Khác'
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {profile.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Liên hệ khẩn cấp">
                {profile.emergency_contact || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Bảo hiểm">
                {profile.insurance || '-'}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="full_name"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input placeholder="Nhập họ và tên" />
                </Form.Item>

                <Form.Item name="date_of_birth" label="Ngày sinh">
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item name="gender" label="Giới tính">
                  <Select placeholder="Chọn giới tính">
                    <Select.Option value="male">Nam</Select.Option>
                    <Select.Option value="female">Nữ</Select.Option>
                    <Select.Option value="other">Khác</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="emergency_contact" label="Liên hệ khẩn cấp">
                  <Input placeholder="Số điện thoại người thân" />
                </Form.Item>

                <Form.Item name="insurance" label="Bảo hiểm">
                  <Input placeholder="Mã số bảo hiểm y tế" />
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ" className="md:col-span-2">
                  <Input.TextArea rows={3} placeholder="Địa chỉ đầy đủ" />
                </Form.Item>
              </div>

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
