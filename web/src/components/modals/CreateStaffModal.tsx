import { Modal, Form, Input, Select, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService, type CreateStaffDto } from '@/services/staff.service';
// --- FIX 1: Import đúng file (số ít) và đúng tên service (số ít) ---
import { branchesService } from '@/services/branches.service';
import { useAuthStore } from '@/stores/authStore';

interface Props {
    open: boolean;
    onCancel: () => void;
}

export default function CreateStaffModal({ open, onCancel }: Props) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // Load danh sách chi nhánh
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        // --- FIX 2: Gọi đúng hàm getAllBranches (Service mới) ---
        queryFn: branchesService.getAllBranches,
        enabled: open && user?.role === 'ADMIN',
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateStaffDto) => staffService.createStaff(data),
        onSuccess: () => {
            message.success('Tạo nhân viên thành công!');
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            form.resetFields();
            onCancel();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        },
    });

    const handleSubmit = (values: any) => {
        createMutation.mutate(values);
    };

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
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                            { pattern: /^[0-9]{10}$/, message: 'SĐT không hợp lệ' },
                        ]}
                    >
                        <Input placeholder="09..." />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: 'Email sai định dạng' }]}
                    >
                        <Input placeholder="example@clinic.com" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="password"
                    label="Mật khẩu khởi tạo"
                    rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}
                >
                    <Input.Password placeholder="******" />
                </Form.Item>

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
                            // Kiểm tra optional chaining để tránh lỗi nếu branches null
                            options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
}