// File: src/pages/admin/ShiftManagement.tsx

import { useState, useMemo, useEffect } from 'react';
import {
    Calendar, Badge, Modal, Button, Form, Select,
    TimePicker, message, Card, Table, Avatar, Popconfirm,
    Tag, Typography, Empty, Row, Col, Input, Space, Radio
} from 'antd';
import {
    PlusOutlined, UserOutlined, DeleteOutlined,
    ClockCircleOutlined, HomeOutlined, ScheduleOutlined,
    FilterOutlined, CloseOutlined, SearchOutlined, TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';

const { Option } = Select;
const { Title, Text } = Typography;

export default function ShiftManagement() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // [MỚI] State quản lý vai trò đang xem (Bác sĩ hoặc Lễ tân)
    const [viewRole, setViewRole] = useState<'DOCTOR' | 'RECEPTIONIST'>('DOCTOR');

    // State bộ lọc trong Modal
    const [modalSearchText, setModalSearchText] = useState('');
    const [modalSpecFilter, setModalSpecFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'NOT_ASSIGNED'>('ALL');

    // State bộ lọc Chuyên khoa ngoài Calendar (chỉ dùng cho bác sĩ)
    const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);

    const [form] = Form.useForm();

    // Theo dõi các giá trị Form
    const formSpecId = Form.useWatch('specialization_id', form);
    const formPersonId = Form.useWatch('doctor_id', form); // Dùng chung field name cho cả Doctor/Staff ID

    // --- 1. FETCH DATA ---
    const filterParams = user?.role === 'BRANCH_MANAGER' ? { branch_id: user.branch_id } : {};

    const { data: specializations } = useQuery({
        queryKey: ['specializations'],
        queryFn: async () => (await axiosInstance.get('/specializations')).data,
    });

    const { data: shifts } = useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            const res = await axiosInstance.get('/shifts');
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
    });

    const { data: doctors } = useQuery({
        queryKey: ['doctors', user?.branch_id],
        queryFn: async () => {
            const res = await axiosInstance.get('/doctors', { params: filterParams });
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
        enabled: !!user,
    });

    // [MỚI] Fetch danh sách Lễ tân
    const { data: receptionists } = useQuery({
        queryKey: ['receptionists', user?.branch_id],
        queryFn: async () => {
            // Giả định API lấy user theo role. Bạn hãy đổi '/users' thành endpoint đúng của bạn nếu khác.
            const res = await axiosInstance.get('/users', {
                params: {
                    role: 'RECEPTIONIST',
                    branch_id: user?.branch_id,
                    limit: 100
                }
            });
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
        enabled: !!user && viewRole === 'RECEPTIONIST', // Chỉ gọi khi cần
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms', user?.branch_id],
        queryFn: async () => {
            const res = await axiosInstance.get('/rooms', { params: filterParams });
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
        enabled: !!user,
    });

    // --- 2. LOGIC LỌC DỮ LIỆU ---

    // [CẬP NHẬT] Tìm thông tin người đang được chọn (Bác sĩ hoặc Lễ tân)
    const selectedPerson = useMemo(() => {
        if (!formPersonId) return null;
        if (viewRole === 'DOCTOR') {
            return doctors?.find((d: any) => d.id === formPersonId);
        } else {
            return receptionists?.find((r: any) => r.id === formPersonId);
        }
    }, [doctors, receptionists, formPersonId, viewRole]);

    // [CẬP NHẬT] Lọc danh sách phòng
    const filteredRooms = useMemo(() => {
        if (!rooms) return [];
        let result = rooms;

        // 1. Lọc theo chuyên khoa (Chỉ áp dụng cho Bác sĩ)
        if (viewRole === 'DOCTOR') {
            if (formSpecId) {
                result = result.filter((r: any) => (r.specialization?.id || r.specialization_id) === formSpecId);
            } else {
                return []; // Nếu chưa chọn khoa thì chưa hiện phòng
            }
        }
        // Nếu là Lễ tân, có thể hiện tất cả phòng hoặc lọc logic riêng (ví dụ chỉ hiện Quầy lễ tân)
        // Hiện tại tôi để hiện tất cả phòng thuộc chi nhánh để bạn dễ test

        // 2. Lọc theo chi nhánh của người được chọn (Logic đa tầng)
        if (selectedPerson) {
            const personBranchId = selectedPerson.branch_id
                || selectedPerson.branch?.id
                || selectedPerson.user?.branch_id;

            if (personBranchId) {
                result = result.filter((r: any) => {
                    const roomBranchId = r.branch_id || r.branch?.id || r.branchId;
                    return roomBranchId === personBranchId;
                });
            }
        }

        return result;
    }, [rooms, formSpecId, selectedPerson, viewRole]);

    // Lọc danh sách bác sĩ (Chỉ dùng khi viewRole = DOCTOR)
    const filteredDoctors = useMemo(() => {
        if (!doctors || !formSpecId) return [];
        return doctors.filter((d: any) => d.specialization?.id === formSpecId);
    }, [doctors, formSpecId]);

    // Tự động reset ô chọn phòng khi thay đổi người
    useEffect(() => {
        form.setFieldValue('room_id', undefined);
    }, [formPersonId, form]);

    // Lấy danh sách lịch trực của ngày đang chọn
    const rawShiftsInDate = useMemo(() => {
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        return safeShifts.filter((s: any) =>
            dayjs(s.start_time).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
        );
    }, [shifts, selectedDate]);

    // [CẬP NHẬT] Logic kết hợp dữ liệu hiển thị bảng (Hỗ trợ cả 2 vai trò)
    const combinedDataInModal = useMemo(() => {
        let sourceData = [];
        if (viewRole === 'DOCTOR') {
            sourceData = doctors || [];
        } else {
            sourceData = receptionists || [];
        }

        if (!sourceData.length) return [];

        const data = sourceData.map((person: any) => {
            // Tìm ca trực: Bác sĩ dùng doctor_id, Lễ tân dùng staff_id (hoặc user_id tùy backend)
            // Giả định backend trả về 'staff_id' hoặc 'receptionist_id' cho lễ tân
            // Hoặc nếu backend dùng chung user_id thì sửa logic find ở đây.
            const shift = rawShiftsInDate.find((s: any) => {
                if (viewRole === 'DOCTOR') return s.doctor_id === person.id;
                // Với lễ tân, kiểm tra staff_id hoặc user_id
                return s.staff_id === person.id || s.user_id === person.id;
            });

            return {
                key: person.id,
                personInfo: person,
                shift: shift || null,
                isAssigned: !!shift,
                // Lấy thông tin hiển thị
                fullName: person.user?.full_name || person.full_name,
                avatar: person.user?.avatar || person.avatar,
                specializationName: viewRole === 'DOCTOR' ? person.specialization?.name : 'Lễ tân',
                specializationId: viewRole === 'DOCTOR' ? person.specialization?.id : null,
            };
        });

        return data.filter((item: any) => {
            const matchSearch = item.fullName?.toLowerCase().includes(modalSearchText.toLowerCase());

            // Lọc chuyên khoa chỉ áp dụng cho Bác sĩ
            const matchSpec = viewRole === 'DOCTOR'
                ? (!modalSpecFilter || item.specializationId === modalSpecFilter)
                : true;

            const matchStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ASSIGNED' && item.isAssigned) ||
                (statusFilter === 'NOT_ASSIGNED' && !item.isAssigned);

            return matchSearch && matchSpec && matchStatus;
        });
    }, [doctors, receptionists, rawShiftsInDate, modalSearchText, modalSpecFilter, statusFilter, viewRole]);

    // Logic cho Calendar (Chỉ hiển thị chấm đỏ cho Bác sĩ để tránh rối, hoặc cả 2 tùy bạn)
    const calendarFilteredShifts = useMemo(() => {
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        // Hiện tại chỉ hiển thị lịch bác sĩ trên calendar chính
        if (!selectedSpecId) return safeShifts;
        return safeShifts.filter((s: any) => s.doctor?.specialization?.id === selectedSpecId);
    }, [shifts, selectedSpecId]);

    // --- 3. MUTATIONS & HANDLERS ---
    const createMutation = useMutation({
        mutationFn: (data: any) => axiosInstance.post('/shifts', data),
        onSuccess: () => {
            message.success('Đã thêm ca trực');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            form.resetFields(['doctor_id', 'room_id', 'timeRange']);
            setShowForm(false);
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Lỗi tạo ca trực');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(`/shifts/${id}`),
        onSuccess: () => {
            message.success('Đã xóa');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });

    const handleSubmit = (values: any) => {
        if (!values.timeRange || values.timeRange.length < 2) {
            message.warning('Vui lòng chọn đầy đủ khoảng thời gian');
            return;
        }

        const payload: any = {
            room_id: values.room_id,
            start_time: selectedDate
                .hour(values.timeRange[0].hour())
                .minute(values.timeRange[0].minute())
                .second(0)
                .toISOString(),
            end_time: selectedDate
                .hour(values.timeRange[1].hour())
                .minute(values.timeRange[1].minute())
                .second(0)
                .toISOString(),
        };

        // Gửi ID tùy theo vai trò
        if (viewRole === 'DOCTOR') {
            payload.doctor_id = values.doctor_id;
        } else {
            // Backend cần nhận staff_id cho lễ tân
            payload.staff_id = values.doctor_id; // (Form field name là doctor_id nhưng chứa ID của staff)
        }

        createMutation.mutate(payload);
    };

    const handleOpenAssign = (personId: string, specId: string) => {
        setShowForm(true);
        form.setFieldsValue({
            specialization_id: specId,
            doctor_id: personId // doctor_id là tên field chung trong form
        });
    };

    // --- 4. COLUMNS ---
    const columns = [
        {
            title: viewRole === 'DOCTOR' ? 'Bác sĩ' : 'Nhân viên',
            key: 'person',
            width: 250,
            render: (record: any) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <Text strong>{record.fullName}</Text>
                </Space>
            ),
        },
        {
            title: viewRole === 'DOCTOR' ? 'Chuyên khoa' : 'Vai trò',
            dataIndex: 'specializationName',
            key: 'spec',
            render: (text: string) => <Tag color={viewRole === 'DOCTOR' ? "blue" : "orange"}>{text}</Tag>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (record: any) => record.isAssigned ? (
                <Tag color="green">Đã xếp lịch</Tag>
            ) : (
                <Tag color="default">Chưa xếp</Tag>
            ),
        },
        {
            title: 'Thời gian & Phòng',
            key: 'info',
            render: (record: any) => record.shift ? (
                <div className="text-xs">
                    <div className="text-indigo-600 font-medium">
                        <ClockCircleOutlined /> {dayjs(record.shift.start_time).format('HH:mm')} - {dayjs(record.shift.end_time).format('HH:mm')}
                    </div>
                    <div className="text-gray-500 italic">🏢 {record.shift.room?.name} ({record.shift.room?.building})</div>
                </div>
            ) : <Text type="secondary">-</Text>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'right' as const,
            render: (record: any) => record.isAssigned ? (
                <Popconfirm title="Xóa lịch trực này?" onConfirm={() => deleteMutation.mutate(record.shift.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ) : (
                <Button type="link" onClick={() => handleOpenAssign(record.id, record.specializationId)}>
                    Xếp ngay
                </Button>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="p-6 h-full flex flex-col bg-gray-50">
                {/* TOOLBAR CALENDAR */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex justify-between items-center border border-gray-100">
                    <Title level={4} className="m-0"><ScheduleOutlined /> Quản lý Lịch trực</Title>
                    <Select
                        className="w-64"
                        placeholder="Lọc chuyên khoa tại lịch"
                        allowClear
                        onChange={setSelectedSpecId}
                    >
                        {specializations?.map((spec: any) => (
                            <Option key={spec.id} value={spec.id}>{spec.name}</Option>
                        ))}
                    </Select>
                </div>

                <Card className="flex-1 shadow-sm rounded-xl overflow-hidden">
                    <Calendar
                        dateCellRender={(value) => {
                            const dateStr = value.format('YYYY-MM-DD');
                            const dayShifts = calendarFilteredShifts.filter((s: any) =>
                                dayjs(s.start_time).format('YYYY-MM-DD') === dateStr
                            );
                            return (
                                <ul className="p-0 list-none">
                                    {dayShifts.slice(0, 2).map((item: any) => (
                                        <li key={item.id} className="mb-0.5">
                                            <Badge status="processing" text={<span className="text-[10px]">{item.doctor?.user?.full_name}</span>} />
                                        </li>
                                    ))}
                                </ul>
                            );
                        }}
                        onSelect={(date) => { setSelectedDate(date); setIsModalOpen(true); }}
                    />
                </Card>

                {/* MODAL DANH SÁCH CHI TIẾT */}
                <Modal
                    title={null}
                    open={isModalOpen}
                    onCancel={() => { setIsModalOpen(false); setShowForm(false); }}
                    footer={null}

                    width="calc(100% - 300px)"
                    style={{
                        right: -120,
                        maxWidth: '1400px'
                    }}
                    centered
                    destroyOnClose
                >
                    <div className="p-2">
                        <div className="flex justify-between items-end mb-6 border-b pb-4">
                            <div>
                                <Title level={3} className="m-0">
                                    {selectedDate.format('DD [Tháng] MM, YYYY')}
                                </Title>
                                <Text type="secondary">Quản lý và xếp lịch trực cho nhân sự</Text>
                            </div>

                            {/* [MỚI] Bộ chuyển đổi Vai trò */}
                            <div className="flex flex-col items-end gap-3 pr-10">
                                <Radio.Group
                                    value={viewRole}
                                    onChange={(e) => {
                                        setViewRole(e.target.value);
                                        setShowForm(false);
                                        form.resetFields();
                                    }}
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="DOCTOR"><UserOutlined /> Bác sĩ</Radio.Button>
                                    <Radio.Button value="RECEPTIONIST"><TeamOutlined /> Lễ tân</Radio.Button>
                                </Radio.Group>

                                <Button
                                    type={showForm ? "default" : "primary"}
                                    size="large"
                                    icon={showForm ? <CloseOutlined /> : <PlusOutlined />}
                                    onClick={() => setShowForm(!showForm)}
                                >
                                    {showForm ? "Đóng Form" : "Thêm ca trực"}
                                </Button>
                            </div>
                        </div>

                        {/* FORM TẠO MỚI */}
                        {showForm && (
                            <Card className="mb-6 bg-indigo-50 border-indigo-100">
                                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                    <Row gutter={16}>
                                        {/* Chỉ hiện chọn Chuyên khoa nếu là Bác sĩ */}
                                        {viewRole === 'DOCTOR' && (
                                            <Col span={6}>
                                                <Form.Item name="specialization_id" label="Chuyên khoa" rules={[{ required: true }]}>
                                                    <Select placeholder="Chọn khoa">
                                                        {specializations?.map((s: any) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        )}

                                        <Col span={6}>
                                            <Form.Item
                                                name="doctor_id"
                                                label={viewRole === 'DOCTOR' ? "Bác sĩ" : "Nhân viên"}
                                                rules={[{ required: true }]}
                                            >
                                                <Select
                                                    placeholder="Chọn nhân sự"
                                                    disabled={viewRole === 'DOCTOR' && !formSpecId}
                                                >
                                                    {viewRole === 'DOCTOR'
                                                        ? filteredDoctors.map((d: any) => (
                                                            <Option key={d.id} value={d.id}>{d.user?.full_name}</Option>
                                                        ))
                                                        : receptionists?.map((r: any) => (
                                                            // Giả định structure user object của Lễ tân
                                                            <Option key={r.id} value={r.id}>{r.user?.full_name || r.full_name}</Option>
                                                        ))
                                                    }
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col span={6}>
                                            <Form.Item name="room_id" label="Phòng / Vị trí" rules={[{ required: true }]}>
                                                <Select
                                                    placeholder={viewRole === 'DOCTOR' && !formSpecId ? "Chọn khoa trước" : "Chọn phòng"}
                                                    disabled={viewRole === 'DOCTOR' && !formSpecId}
                                                    allowClear
                                                >
                                                    {filteredRooms.map((r: any) => (
                                                        <Option key={r.id} value={r.id}>
                                                            {r.name} - {r.building} {selectedPerson ? '' : `(${r.branch?.name || 'Chi nhánh ?'})`}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>

                                        <Col span={6}>
                                            <Form.Item name="timeRange" label="Thời gian" rules={[{ required: true }]}>
                                                <TimePicker.RangePicker format="HH:mm" className="w-full" />
                                            </Form.Item>
                                        </Col>

                                        <Col span={24} className="text-right">
                                            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>Lưu lịch trực</Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>
                        )}

                        {/* BỘ LỌC TÌM KIẾM TRONG MODAL */}
                        <div className="mb-4 flex gap-4 bg-gray-50 p-4 rounded-lg">
                            <Input
                                placeholder={viewRole === 'DOCTOR' ? "Tìm tên bác sĩ..." : "Tìm tên lễ tân..."}
                                prefix={<SearchOutlined />}
                                className="w-1/3"
                                onChange={e => setModalSearchText(e.target.value)}
                            />

                            {/* Chỉ hiện lọc Chuyên khoa nếu là Bác sĩ */}
                            {viewRole === 'DOCTOR' && (
                                <Select
                                    placeholder="Lọc theo chuyên khoa"
                                    className="w-1/4"
                                    allowClear
                                    onChange={setModalSpecFilter}
                                >
                                    {specializations?.map((s: any) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            )}

                            <Select
                                value={statusFilter}
                                className="w-1/4"
                                onChange={setStatusFilter}
                            >
                                <Option value="ALL">Tất cả nhân sự</Option>
                                <Option value="ASSIGNED">Đã có lịch</Option>
                                <Option value="NOT_ASSIGNED">Chưa có lịch</Option>
                            </Select>
                        </div>

                        {/* BẢNG DỮ LIỆU */}
                        <Table
                            columns={columns}
                            dataSource={combinedDataInModal}
                            pagination={{ pageSize: 8 }}
                            scroll={{ y: 400 }}
                            bordered
                        />
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}