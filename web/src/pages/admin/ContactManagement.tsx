import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    message,
    Descriptions,
} from 'antd';
import {
    MailOutlined,
    EyeOutlined,
    MessageOutlined,
    CustomerServiceOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { contactService } from '@/services/contact.service';
import { branchesService } from '@/services/branches.service';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title } = Typography;

const statusConfig: Record<string, { color: string; text: string }> = {
    NEW: { color: 'blue', text: 'Mới' },
    READ: { color: 'cyan', text: 'Đã đọc' },
    REPLIED: { color: 'green', text: 'Đã phản hồi' },
};

export default function ContactManagement() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [branchFilter, setBranchFilter] = useState<string | undefined>();
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [form] = Form.useForm();

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getBranches,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['contacts', page, limit, statusFilter, branchFilter],
        queryFn: () =>
            contactService.getAll({
                page,
                limit,
                status: statusFilter,
                branchId: branchFilter,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { status?: string; admin_reply?: string } }) =>
            contactService.update(id, data),
        onSuccess: () => {
            message.success('Cập nhật thành công');
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            setDetailModalOpen(false);
            setReplyModalOpen(false);
            form.resetFields();
        },
        onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Có lỗi xảy ra');
        },
    });

    const handleMarkRead = (record: any) => {
        if (record.status === 'NEW') {
            updateMutation.mutate({ id: record.id, data: { status: 'READ' } });
        }
    };

    const handleOpenDetail = (record: any) => {
        setSelectedContact(record);
        handleMarkRead(record);
        setDetailModalOpen(true);
    };

    const handleOpenReply = (record: any) => {
        setSelectedContact(record);
        form.setFieldsValue({ admin_reply: record.admin_reply || '' });
        setReplyModalOpen(true);
    };

    const handleReplySubmit = () => {
        form.validateFields().then((values) => {
            if (!selectedContact) return;
            updateMutation.mutate({
                id: selectedContact.id,
                data: { admin_reply: values.admin_reply, status: 'REPLIED' },
            });
        });
    };

    const contacts = data?.data || [];
    const pagination = data?.pagination || { total: 0, page: 1, limit: 10 };

    const columns = [
        {
            title: 'Ngày gửi',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 110,
            render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Họ tên',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
            width: 110,
        },
        {
            title: 'Chủ đề',
            dataIndex: 'subject',
            key: 'subject',
            ellipsis: true,
        },
        {
            title: 'Chi nhánh',
            key: 'branch',
            width: 140,
            render: (_: unknown, r: any) => r.branch?.name || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: string) => {
                const c = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={c.color}>{c.text}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 140,
            fixed: 'right' as const,
            render: (_: unknown, record: any) => (
                <Space>
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
                        Xem
                    </Button>
                    <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => handleOpenReply(record)}>
                        Phản hồi
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <Title level={3} style={{ margin: 0 }}>
                        <CustomerServiceOutlined className="mr-2" />
                        Quản lý Liên hệ
                    </Title>
                </div>

                <Card>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <Select
                            placeholder="Lọc trạng thái"
                            allowClear
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { label: 'Mới', value: 'NEW' },
                                { label: 'Đã đọc', value: 'READ' },
                                { label: 'Đã phản hồi', value: 'REPLIED' },
                            ]}
                        />
                        <Select
                            placeholder="Lọc chi nhánh"
                            allowClear
                            style={{ width: 200 }}
                            value={branchFilter}
                            onChange={setBranchFilter}
                            options={branches.map((b: any) => ({ label: b.name, value: b.id }))}
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={contacts}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            current: pagination.page,
                            pageSize: pagination.limit,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (t) => `Tổng ${t} liên hệ`,
                            onChange: (p, ps) => {
                                setPage(p);
                                setLimit(ps || 10);
                            },
                        }}
                    />
                </Card>

                {/* Modal chi tiết */}
                <Modal
                    title="Chi tiết liên hệ"
                    open={detailModalOpen}
                    onCancel={() => setDetailModalOpen(false)}
                    footer={
                        <Space>
                            <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
                            <Button type="primary" icon={<MessageOutlined />} onClick={() => selectedContact && handleOpenReply(selectedContact)}>
                                Phản hồi
                            </Button>
                        </Space>
                    }
                    width={560}
                >
                    {selectedContact && (
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Ngày gửi">
                                {dayjs(selectedContact.created_at).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Họ tên">{selectedContact.name}</Descriptions.Item>
                            <Descriptions.Item label="Email">
                                <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                <a href={`tel:${selectedContact.phone}`}>{selectedContact.phone}</a>
                            </Descriptions.Item>
                            <Descriptions.Item label="Chủ đề">{selectedContact.subject}</Descriptions.Item>
                            <Descriptions.Item label="Chi nhánh">{selectedContact.branch?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Nội dung">
                                <div className="whitespace-pre-wrap">{selectedContact.message}</div>
                            </Descriptions.Item>
                            {selectedContact.admin_reply && (
                                <Descriptions.Item label="Phản hồi của bạn">
                                    <div className="whitespace-pre-wrap">{selectedContact.admin_reply}</div>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    )}
                </Modal>

                {/* Modal phản hồi */}
                <Modal
                    title="Phản hồi khách hàng"
                    open={replyModalOpen}
                    onCancel={() => setReplyModalOpen(false)}
                    onOk={handleReplySubmit}
                    okText="Gửi phản hồi"
                    confirmLoading={updateMutation.isPending}
                >
                    {selectedContact && (
                        <>
                            <p className="text-gray-600 mb-2">
                                Phản hồi tới: <strong>{selectedContact.name}</strong> ({selectedContact.email} / {selectedContact.phone})
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                Bạn có thể gửi phản hồi qua email hoặc gọi điện. Nội dung dưới đây là gợi ý để lưu lại trong hệ thống.
                            </p>
                            <Form form={form} layout="vertical">
                                <Form.Item
                                    name="admin_reply"
                                    label="Nội dung phản hồi"
                                    rules={[{ required: true, message: 'Nhập nội dung phản hồi' }]}
                                >
                                    <TextArea rows={5} placeholder="Nhập nội dung phản hồi cho khách hàng..." />
                                </Form.Item>
                            </Form>
                        </>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
