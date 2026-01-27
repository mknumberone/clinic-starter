import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Switch, message, Button } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService, type Staff } from '@/services/staff.service';
import { branchesService } from '@/services/branches.service';
import AvatarUpload from '@/components/upload/AvatarUpload'; // Import component upload

interface Props {
    open: boolean;
    onCancel: () => void;
    staff: Staff | null;
}

export default function EditStaffModal({ open, onCancel, staff }: Props) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // State để quản lý key ảnh (avatar). Khi upload ảnh mới, state này sẽ cập nhật
    const [avatarKey, setAvatarKey] = useState<string | undefined>();

    // Lấy danh sách chi nhánh để Admin/Manager có thể điều chuyển nhân sự
    const { data: branches, isLoading: loadingBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getAllBranches,
        enabled: open,
    });

    // Cập nhật dữ liệu vào form khi mở modal hoặc khi dữ liệu staff thay đổi
    useEffect(() => {
        if (staff && open) {
            form.setFieldsValue({
                full_name: staff.full_name,
                phone: staff.phone,
                email: staff.email,
                role: staff.role,
                branch_id: staff.branch_id || (staff.branch as any)?.id,
                is_active: staff.is_active ?? true,
            });
            // Khởi tạo avatarKey bằng ảnh hiện tại của nhân viên
            setAvatarKey(staff.avatar);
        }
    }, [staff, open, form]);

    // Mutation xử lý cập nhật thông tin
    const updateMutation = useMutation({
        mutationFn: (values: any) => {
            // Gộp dữ liệu từ form và avatarKey mới nhất để gửi lên server
            const finalData = {
                ...values,
                avatar: avatarKey
            };
            return staffService.updateStaff(staff!.id, finalData);
        },
        onSuccess: () => {
            message.success('Cập nhật thông tin nhân viên thành công');
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            onCancel();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
        },
    });

    const handleOk = () => {
        form.submit();
    };

    return (
        <Modal
            title="Chi tiết & Chỉnh sửa nhân viên"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Đóng
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleOk}
                    loading={updateMutation.isPending}
                >
                    Lưu thay đổi
                </Button>
            ]}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={(v) => updateMutation.mutate(v)}
            >
                {/* Phần upload ảnh đại diện */}
                <div className="flex flex-col items-center justify-center mb-6 py-4 bg-gray-50 rounded-lg">
                    <AvatarUpload
                        currentAvatar={staff?.avatar} // Hiển thị ảnh hiện tại từ database
                        onUploadSuccess={(url) => setAvatarKey(url)} // Cập nhật key sau khi upload thành công
                        size={120}
                    />
                    <div className="mt-2 text-gray-500 text-xs">
                        Nhấn vào ảnh để thay đổi ảnh đại diện
                    </div>
                </div>

                <Form.Item
                    label="Họ và tên"
                    name="full_name"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                    <Input placeholder="Nhập họ và tên nhân viên" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ pattern: /^[0-9]{10}$/, message: 'SĐT phải có 10 chữ số' }]}
                    >
                        <Input placeholder="09xxxxxxxx" />
                    </Form.Item>

                    <Form.Item label="Email (Không thể sửa)" name="email">
                        <Input disabled className="bg-gray-100 cursor-not-allowed" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Vai trò" name="role">
                        <Select disabled options={[
                            { label: 'Quản trị viên', value: 'ADMIN' },
                            { label: 'Quản lý Chi nhánh', value: 'BRANCH_MANAGER' },
                            { label: 'Bác sĩ', value: 'DOCTOR' },
                            { label: 'Lễ tân', value: 'RECEPTIONIST' }
                        ]} className="cursor-not-allowed" />
                    </Form.Item>

                    <Form.Item
                        label="Chi nhánh công tác"
                        name="branch_id"
                        rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
                    >
                        <Select
                            loading={loadingBranches}
                            placeholder="Chọn chi nhánh"
                            options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                        />
                    </Form.Item>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                    <span className="text-blue-700 font-medium">Trạng thái tài khoản</span>
                    <Form.Item name="is_active" valuePropName="checked" noStyle>
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Đã khóa" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
}