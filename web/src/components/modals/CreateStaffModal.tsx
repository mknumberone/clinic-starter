import { Modal, Form, Input, Select, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService, type CreateStaffDto } from '@/services/staff.service';
import { branchesService } from '@/services/branches.service';
import { useAuthStore } from '@/stores/authStore';
import AvatarUpload from '@/components/upload/AvatarUpload'; // Import component đã có
import { useState } from 'react';

interface Props {
    open: boolean;
    onCancel: () => void;
}

export default function CreateStaffModal({ open, onCancel }: Props) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // State lưu trữ key ảnh sau khi upload thành công lên Cloudinary
    const [avatarKey, setAvatarKey] = useState<string | undefined>();

    // Load danh sách chi nhánh dành cho Admin
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getAllBranches,
        enabled: open && user?.role === 'ADMIN',
    });

    // Mutation xử lý tạo nhân viên mới
    const createMutation = useMutation({
        mutationFn: (data: CreateStaffDto) => staffService.createStaff(data),
        onSuccess: () => {
            message.success('Tạo nhân viên thành công!');
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            form.resetFields();
            setAvatarKey(undefined); // Reset ảnh sau khi thành công
            onCancel();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên');
        },
    });

    const handleSubmit = (values: any) => {
        // Ghi đè giá trị avatar từ form bằng key ảnh thực tế từ Cloudinary
        const finalData = {
            ...values,
            avatar: avatarKey,
        };
        createMutation.mutate(finalData);
    };

    // Phân quyền chọn Role (Admin được tạo Manager, Manager chỉ tạo Doctor/Receptionist)
    const roleOptions = user?.role === 'ADMIN'
        ? [
            { label: 'Quản lý Chi nhánh', value: 'BRANCH_MANAGER' },
            { label: 'Bác sĩ', value: 'DOCTOR' },
            { label: 'Lễ tân', value: 'RECEPTIONIST' },
        ]
        : [
            { label: 'Bác sĩ', value: 'DOCTOR' },
            { label: 'Lễ tân', value: 'RECEPTIONIST' },
        ];

    return (
        <Modal
            title="Thêm nhân viên mới"
            open={open}
            onCancel={() => {
                form.resetFields();
                setAvatarKey(undefined);
                onCancel();
            }}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending}
            destroyOnClose
            width={600}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                {/* Khu vực Upload ảnh đại diện */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <AvatarUpload
                        onUploadSuccess={(url) => setAvatarKey(url)}
                        size={100}
                    />
                    <span className="text-gray-400 text-xs mt-2">Ảnh đại diện nhân viên</span>
                </div>

                <Form.Item
                    name="full_name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input placeholder="Ví dụ: Nguyễn Văn A" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Nhập SĐT' },
                            { pattern: /^[0-9]{10}$/, message: 'SĐT phải có 10 chữ số' },
                        ]}
                    >
                        <Input placeholder="09..." />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: 'Email không đúng định dạng' }]}
                    >
                        <Input placeholder="example@clinic.com" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="password"
                    label="Mật khẩu khởi tạo"
                    rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}
                >
                    <Input.Password placeholder="Nhập mật khẩu mặc định" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select placeholder="Chọn vai trò" options={roleOptions} />
                    </Form.Item>

                    {user?.role === 'ADMIN' && (
                        <Form.Item
                            name="branch_id"
                            label="Thuộc chi nhánh"
                            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
                        >
                            <Select
                                placeholder="Chọn chi nhánh"
                                options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                            />
                        </Form.Item>
                    )}
                </div>
            </Form>
        </Modal>
    );
}