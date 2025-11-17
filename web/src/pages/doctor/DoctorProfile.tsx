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
  };
  specializations?: Array<{
    id: string;
    name: string;
  }>;
}

interface UpdateProfileDto {
  title?: string;
  biography?: string;
  qualifications?: any;
}

export default function DoctorProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      // Get doctor info
      const doctorsResponse = await axiosInstance.get('/doctors', { params: { limit: 1 } });
      const doctors = doctorsResponse.data.data;
      if (doctors && doctors.length > 0) {
        const doctorId = doctors[0].id;
        const profileResponse = await axiosInstance.get(`/doctors/${doctorId}`);
        return profileResponse.data as DoctorProfile;
      }
      throw new Error('Doctor not found');
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => {
      return axiosInstance.put(`/doctors/${profile?.id}`, data);
    },
    onSuccess: () => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      setIsEditing(false);
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
            <Avatar size={80} icon={<UserOutlined />} className="mr-4" />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {profile.title} {profile.user.full_name}
              </Title>
              <Text type="secondary">Mã bác sĩ: {profile.code}</Text>
              <br />
              <Text type="secondary">{profile.user.phone}</Text>
            </div>
          </div>

          <Divider />

          {!isEditing ? (
            <>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Họ và tên">
                  {profile.user.full_name}
                </Descriptions.Item>
                <Descriptions.Item label="Mã bác sĩ">
                  {profile.code}
                </Descriptions.Item>
                <Descriptions.Item label="Chức danh">
                  {profile.title || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {profile.user.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {profile.user.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Chuyên khoa">
                  {profile.specializations && profile.specializations.length > 0 ? (
                    <Space wrap>
                      {profile.specializations.map((spec) => (
                        <Tag key={spec.id} icon={<MedicineBoxOutlined />} color="blue">
                          {spec.name}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Tiểu sử" span={2}>
                  {profile.biography || '-'}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="title"
                label="Chức danh"
                rules={[{ required: true, message: 'Vui lòng nhập chức danh' }]}
              >
                <Input placeholder="VD: Bác sĩ, Thạc sĩ, Tiến sĩ" />
              </Form.Item>

              <Form.Item name="biography" label="Tiểu sử">
                <Input.TextArea
                  rows={5}
                  placeholder="Giới thiệu về bản thân, kinh nghiệm làm việc..."
                />
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
