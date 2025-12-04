import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Card, Button, Tag, Typography, Input, Row, Col, Select, Tooltip
} from 'antd';
import {
    UserAddOutlined, SearchOutlined, EditOutlined, ClearOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { staffService, type Staff } from '@/services/staff.service';
import CreateStaffModal from '@/components/modals/CreateStaffModal';
import EditStaffModal from '@/components/modals/EditStaffModal';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ManagerStaffList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    // --- Bộ lọc (Bỏ lọc chi nhánh) ---
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    const { data: staffList, isLoading } = useQuery({
        queryKey: ['staffs'], // Tự động gọi API GET /staff (Backend sẽ tự lọc)
        queryFn: staffService.getStaffs,
    });

    // Logic Lọc Client-side
    const filteredData = useMemo(() => {
        if (!staffList) return [];
        return staffList.filter((staff) => {
            const matchSearch =
                searchText === '' ||
                staff.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
                staff.phone.includes(searchText);
            const matchRole = roleFilter ? staff.role === roleFilter : true;
            const matchStatus = statusFilter
                ? (statusFilter === 'active' ? staff.is_active : !staff.is_active)
                : true;
            return matchSearch && matchRole && matchStatus;
        });
    }, [staffList, searchText, roleFilter, statusFilter]);

    const handleEdit = (record: Staff) => {
        setSelectedStaff(record);
        setIsEditModalOpen(true);
    };

    const clearFilters = () => {
        setSearchText('');
        setRoleFilter(undefined);
        setStatusFilter(undefined);
    };

    const roleColors: Record<string, string> = {
        DOCTOR: 'blue',
        RECEPTIONIST: 'cyan',
    };
    const roleNames: Record<string, string> = {
        DOCTOR: 'Bác sĩ',
        RECEPTIONIST: 'Lễ tân',
    };

    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string) => <span className="font-medium">{text}</span>,
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            responsive: ['lg'],
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={roleColors[role]}>{roleNames[role] || role}</Tag>
            ),
        },
        // Bỏ cột Chi nhánh vì Manager chỉ quản lý 1 chi nhánh
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            responsive: ['xl'],
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'error'}>
                    {isActive ? 'Hoạt động' : 'Đã khóa'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Staff) => (
                <Tooltip title="Sửa thông tin">
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-blue-600" />}
                        onClick={() => handleEdit(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <Title level={2} style={{ margin: 0 }}>Nhân sự Chi nhánh</Title>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        size="large"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Thêm nhân viên
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} md={8}>
                            <Input
                                prefix={<SearchOutlined className="text-gray-400" />}
                                placeholder="Tìm theo tên hoặc SĐT..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Select
                                placeholder="Vai trò"
                                style={{ width: '100%' }}
                                value={roleFilter}
                                onChange={setRoleFilter}
                                allowClear
                                options={[
                                    { label: 'Bác sĩ', value: 'DOCTOR' },
                                    { label: 'Lễ tân', value: 'RECEPTIONIST' },
                                ]}
                            />
                        </Col>
                        <Col xs={12} md={6}>
                            <Select
                                placeholder="Trạng thái"
                                style={{ width: '100%' }}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                allowClear
                                options={[
                                    { label: 'Hoạt động', value: 'active' },
                                    { label: 'Đã khóa', value: 'inactive' },
                                ]}
                            />
                        </Col>
                        <Col xs={24} md={4}>
                            <Button icon={<ClearOutlined />} onClick={clearFilters} block>
                                Xóa lọc
                            </Button>
                        </Col>
                    </Row>

                    <Table
                        columns={columns as any}
                        dataSource={filteredData}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>

                {/* Reuse lại Modal cũ - Modal này tự biết ẩn ô Chi nhánh đi nếu user không phải Admin */}
                <CreateStaffModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                />

                <EditStaffModal
                    open={isEditModalOpen}
                    onCancel={() => setIsEditModalOpen(false)}
                    staff={selectedStaff}
                />
            </div>
        </DashboardLayout>
    );
}