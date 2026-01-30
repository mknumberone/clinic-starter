import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table, Card, Button, Tag, Typography, Input, Row, Col, Select, Tooltip, Space
} from 'antd';
import {
    UserAddOutlined, SearchOutlined, EditOutlined, FilterOutlined, ClearOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { staffService, type Staff } from '@/services/staff.service';
import { branchesService } from '@/services/branches.service'; // Import thêm service chi nhánh
import CreateStaffModal from '@/components/modals/CreateStaffModal';
import { Avatar, } from 'antd';
import { UserOutlined, } from '@ant-design/icons';
import EditStaffModal from '@/components/modals/EditStaffModal';
import dayjs from 'dayjs';
import { uploadService } from '@/services/upload.service';

const { Title } = Typography;

export default function StaffList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    // --- State cho bộ lọc ---
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

    // 1. Lấy danh sách nhân viên
    const { data: staffList, isLoading: loadingStaff } = useQuery({
        queryKey: ['staffs'],
        queryFn: staffService.getStaffs,
    });

    // 2. Lấy danh sách chi nhánh (để đổ vào dropdown lọc)
    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getAllBranches,
    });

    // 3. Logic Lọc dữ liệu (Client-side Filtering)
    const filteredData = useMemo(() => {
        if (!staffList) return [];

        return staffList.filter((staff) => {
            // Lọc theo tên hoặc SĐT
            const matchSearch =
                searchText === '' ||
                staff.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
                staff.phone.includes(searchText);

            // Lọc theo Vai trò
            const matchRole = roleFilter ? staff.role === roleFilter : true;

            // Lọc theo Chi nhánh
            const matchBranch = branchFilter ? staff.branch_id === branchFilter : true;

            // Lọc theo Trạng thái
            const matchStatus = statusFilter
                ? (statusFilter === 'active' ? staff.is_active : !staff.is_active)
                : true;

            return matchSearch && matchRole && matchBranch && matchStatus;
        });
    }, [staffList, searchText, roleFilter, branchFilter, statusFilter]);

    // Xử lý mở modal sửa
    const handleEdit = (record: Staff) => {
        setSelectedStaff(record);
        setIsEditModalOpen(true);
    };

    // Xóa hết bộ lọc
    const clearFilters = () => {
        setSearchText('');
        setRoleFilter(undefined);
        setBranchFilter(undefined);
        setStatusFilter(undefined);
    };

    // Cấu hình hiển thị
    const roleColors: Record<string, string> = {
        ADMIN: 'red',
        BRANCH_MANAGER: 'gold',
        DOCTOR: 'blue',
        RECEPTIONIST: 'cyan',
        PATIENT: 'green',
    };

    const roleNames: Record<string, string> = {
        ADMIN: 'Quản trị viên',
        BRANCH_MANAGER: 'Quản lý chi nhánh',
        DOCTOR: 'Bác sĩ',
        RECEPTIONIST: 'Lễ tân',
        PATIENT: 'Bệnh nhân',
    };

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 80,
            render: (avatar?: string) => (
                <Avatar
                    // Dùng getFileUrl để hiển thị ảnh từ Cloudinary hoặc tệp local
                    src={avatar ? uploadService.getFileUrl(avatar) : undefined}
                    icon={<UserOutlined />}
                    size="large"
                    className="shadow-sm border border-gray-100"
                />
            ),
        },
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
            responsive: ['lg'], // Ẩn trên màn hình nhỏ
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={roleColors[role]}>{roleNames[role] || role}</Tag>
            ),
        },
        {
            title: 'Chi nhánh',
            dataIndex: 'branch',
            key: 'branch',
            render: (branch: any) => (branch ? <Tag>{branch.name}</Tag> : <Tag color="default">Toàn hệ thống</Tag>),
        },
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
                <Tooltip title="Xem chi tiết & Sửa">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Title level={2} style={{ margin: 0 }}>Quản lý Nhân sự</Title>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        size="large"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Thêm nhân viên mới
                    </Button>
                </div>

                <Card className="shadow-sm">
                    {/* --- KHU VỰC BỘ LỌC --- */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12} lg={6}>
                            <Input
                                prefix={<SearchOutlined className="text-gray-400" />}
                                placeholder="Tìm theo tên hoặc SĐT..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={12} sm={6} lg={4}>
                            <Select
                                placeholder="Chọn Vai trò"
                                style={{ width: '100%' }}
                                value={roleFilter}
                                onChange={setRoleFilter}
                                allowClear
                                options={[
                                    { label: 'Quản lý chi nhánh', value: 'BRANCH_MANAGER' },
                                    { label: 'Bác sĩ', value: 'DOCTOR' },
                                    { label: 'Lễ tân', value: 'RECEPTIONIST' },
                                ]}
                            />
                        </Col>
                        <Col xs={12} sm={6} lg={5}>
                            <Select
                                placeholder="Chọn Chi nhánh"
                                style={{ width: '100%' }}
                                value={branchFilter}
                                onChange={setBranchFilter}
                                allowClear
                                options={branches?.map(b => ({ label: b.name, value: b.id }))}
                            />
                        </Col>
                        <Col xs={12} sm={6} lg={4}>
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
                        <Col xs={12} sm={6} lg={3}>
                            <Button
                                icon={<ClearOutlined />}
                                onClick={clearFilters}
                                block
                            >
                                Xóa bộ lọc
                            </Button>
                        </Col>
                    </Row>

                    {/* --- BẢNG DỮ LIỆU --- */}
                    <Table
                        columns={columns as any}
                        dataSource={filteredData} // Sử dụng dữ liệu đã lọc
                        rowKey="id"
                        loading={loadingStaff}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} nhân viên`
                        }}
                        scroll={{ x: 1000 }}
                    />
                </Card>

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