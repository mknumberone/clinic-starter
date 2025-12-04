import { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, message, Button } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService, type Staff } from '@/services/staff.service';
import { branchesService } from '@/services/branches.service';

interface Props {
    open: boolean;
    onCancel: () => void;
    staff: Staff | null;
}

export default function EditStaffModal({ open, onCancel, staff }: Props) {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Lấy danh sách chi nhánh
    const { data: branches, isLoading: loadingBranches } = useQuery({
        queryKey: ['branches'],
        // --- FIX: Đổi từ getBranches thành getAllBranches ---
        queryFn: branchesService.getAllBranches,
        enabled: open,
    });

    useEffect(() => {
        if (staff && open) {
            form.setFieldsValue({
                full_name: staff.full_name,
                phone: staff.phone,
                email: staff.email,
                role: staff.role,
                // Ưu tiên lấy branch_id trực tiếp, fallback sang object branch
                branch_id: staff.branch_id || (staff.branch as any)?.id,
                is_active: staff.is_active ?? true,
            });
        }
    }, [staff, open, form]);

    const updateMutation = useMutation({
        mutationFn: (values: any) => staffService.updateStaff(staff!.id, values),
        onSuccess: () => {
            message.success('Cập nhật thành công');
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            onCancel();
        },
        onError: () => message.error('Cập nhật thất bại'),
    });

    const handleSubmit = (values: any) => {
        updateMutation.mutate(values);
    };

    return (
        <Modal
            title="Chi tiết nhân viên"
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>Đóng</Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={() => form.submit()}
                    loading={updateMutation.isPending}
                >
                    Lưu thay đổi
                </Button>
            ]}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Số điện thoại" name="phone">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name="email">
                        <Input disabled className="bg-gray-100 text-gray-500" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="Vai trò" name="role">
                        <Select disabled options={[
                            { label: 'Quản trị viên', value: 'ADMIN' },
                            { label: 'Quản lý', value: 'BRANCH_MANAGER' },
                            { label: 'Bác sĩ', value: 'DOCTOR' },
                            { label: 'Lễ tân', value: 'RECEPTIONIST' }
                        ]} />
                    </Form.Item>

                    <Form.Item label="Chi nhánh" name="branch_id">
                        <Select
                            loading={loadingBranches}
                            placeholder="Chọn chi nhánh"
                            // Map dữ liệu an toàn
                            options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                        />
                    </Form.Item>
                </div>

                <Form.Item label="Trạng thái" name="is_active" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Đã khóa" />
                </Form.Item>
            </Form>
        </Modal>
    );
}