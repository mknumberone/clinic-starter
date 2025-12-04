// File: src/pages/admin/ShiftManagement.tsx

import { useState, useMemo, useEffect } from 'react';
import {
    Calendar, Badge, Modal, Button, Form, Select,
    TimePicker, message, Card, List, Avatar, Popconfirm,
    Tag, Tooltip, Spin, Typography, Empty, Row, Col
} from 'antd';
import {
    PlusOutlined, UserOutlined, DeleteOutlined,
    ClockCircleOutlined, HomeOutlined, ScheduleOutlined,
    MedicineBoxOutlined, FilterOutlined
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

    // State bộ lọc Chuyên khoa (Global Filter)
    const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);

    const [form] = Form.useForm();
    // Theo dõi giá trị chuyên khoa đang chọn trong Form để lọc realtime
    const formSpecId = Form.useWatch('specialization_id', form);

    // --- 1. FETCH DATA ---
    const filterParams = user?.role === 'BRANCH_MANAGER' ? { branch_id: user.branch_id } : {};

    // A. Lấy danh sách Chuyên khoa (Để lọc)
    const { data: specializations } = useQuery({
        queryKey: ['specializations'],
        queryFn: async () => (await axiosInstance.get('/specializations')).data,
    });

    // B. Lấy Shifts
    const { data: shifts, isLoading: loadingShifts } = useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            const res = await axiosInstance.get('/shifts');
            return Array.isArray(res.data) ? res.data : (res.data.data || []);
        },
    });

    // C. Lấy Doctors & Rooms (Lấy hết về rồi lọc tại Frontend cho mượt)
    const { data: doctors } = useQuery({
        queryKey: ['doctors', user?.branch_id],
        queryFn: async () => {
            const res = await axiosInstance.get('/doctors', { params: filterParams });
            if (Array.isArray(res.data)) return res.data;
            if (res.data && Array.isArray(res.data.data)) return res.data.data;
            return [];
        },
        enabled: !!user,
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms', user?.branch_id],
        queryFn: async () => {
            const res = await axiosInstance.get('/rooms', { params: filterParams });
            if (Array.isArray(res.data)) return res.data;
            if (res.data && Array.isArray(res.data.data)) return res.data.data;
            return [];
        },
        enabled: !!user,
    });

    // --- 2. LOGIC LỌC DỮ LIỆU (QUAN TRỌNG) ---

    // Lọc bác sĩ theo Chuyên khoa đang chọn trong Form
    const filteredDoctors = useMemo(() => {
        if (!doctors) return [];
        if (!formSpecId) return doctors; // Nếu chưa chọn khoa thì hiện hết (hoặc rỗng tùy bạn)
        return doctors.filter((d: any) => d.specialization?.id === formSpecId);
    }, [doctors, formSpecId]);

    // Lọc phòng theo Chuyên khoa đang chọn trong Form
    const filteredRooms = useMemo(() => {
        if (!rooms) return [];
        if (!formSpecId) return rooms;
        return rooms.filter((r: any) => r.specialization?.id === formSpecId);
    }, [rooms, formSpecId]);

    // Lọc lịch hiển thị trên Calendar theo Global Filter
    const filteredShifts = useMemo(() => {
        const safeShifts = Array.isArray(shifts) ? shifts : [];
        if (!selectedSpecId) return safeShifts;
        // Chỉ hiện lịch của bác sĩ thuộc chuyên khoa đang lọc
        return safeShifts.filter((s: any) => s.doctor?.specialization?.id === selectedSpecId);
    }, [shifts, selectedSpecId]);


    // --- 3. MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: (data: any) => axiosInstance.post('/shifts', data),
        onSuccess: () => {
            message.success('Đã thêm ca trực mới');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            // Reset các trường con, giữ lại chuyên khoa để nhập tiếp cho nhanh
            form.resetFields(['doctor_id', 'room_id', 'timeRange']);
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Lỗi tạo ca trực');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(`/shifts/${id}`),
        onSuccess: () => {
            message.success('Đã xóa ca trực');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });

    // --- 4. HANDLERS ---
    const handleSelectDate = (date: dayjs.Dayjs) => {
        setSelectedDate(date);
        setIsModalOpen(true);

        // Tự động điền chuyên khoa vào form nếu đang lọc ở ngoài
        if (selectedSpecId) {
            form.setFieldsValue({ specialization_id: selectedSpecId });
        } else {
            form.resetFields();
        }
    };

    const handleSubmit = (values: any) => {
        if (!values.timeRange || values.timeRange.length < 2) return;
        const payload = {
            doctor_id: values.doctor_id,
            room_id: values.room_id,
            start_time: selectedDate.hour(values.timeRange[0].hour()).minute(values.timeRange[0].minute()).toISOString(),
            end_time: selectedDate.hour(values.timeRange[1].hour()).minute(values.timeRange[1].minute()).toISOString(),
        };
        createMutation.mutate(payload);
    };

    // --- 5. RENDER ---
    const dateCellRender = (value: dayjs.Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const dayShifts = filteredShifts.filter((s: any) =>
            dayjs(s.start_time).format('YYYY-MM-DD') === dateStr
        );

        return (
            <ul className="p-0 list-none">
                {dayShifts.map((item: any) => (
                    <li key={item.id} className="mb-1">
                        <Badge
                            color={item.doctor?.specialization?.id === selectedSpecId ? '#1890ff' : '#52c41a'} // Highlight nếu đúng khoa
                            text={
                                <span className="text-[10px] text-gray-600">
                                    {dayjs(item.start_time).format('HH:mm')} - {item.doctor?.user?.full_name}
                                </span>
                            }
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const shiftsInModal = filteredShifts.filter((s: any) =>
        dayjs(s.start_time).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
    );

    return (
        <DashboardLayout>
            <div className="p-4 h-full flex flex-col">
                {/* --- TOOLBAR & FILTER --- */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <Title level={4} className="m-0 flex items-center gap-2 text-indigo-700">
                                <ScheduleOutlined /> Quản lý Lịch trực
                            </Title>
                            <Text type="secondary" className="text-xs">
                                Xếp lịch làm việc theo chuyên khoa và phòng khám
                            </Text>
                        </div>

                        {/* BỘ LỌC CHUYÊN KHOA */}
                        <div className="flex items-center gap-2">
                            <FilterOutlined className="text-gray-400" />
                            <span className="font-medium text-gray-600">Lọc theo khoa:</span>
                            <Select
                                className="w-64"
                                placeholder="Tất cả chuyên khoa"
                                allowClear
                                onChange={(val) => setSelectedSpecId(val)}
                                value={selectedSpecId}
                            >
                                {specializations?.map((spec: any) => (
                                    <Option key={spec.id} value={spec.id}>{spec.name}</Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>

                {/* --- CALENDAR --- */}
                <Card className="shadow-md flex-1 overflow-hidden border-0" bodyStyle={{ padding: '0' }}>
                    <Calendar
                        dateCellRender={dateCellRender}
                        onSelect={handleSelectDate}
                        className="p-2"
                    />
                </Card>

                {/* --- MODAL --- */}
                <Modal
                    title={null}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                    width={950}
                    centered
                    destroyOnClose
                    bodyStyle={{ padding: 0 }} // Custom padding
                >
                    <div className="flex h-[550px]">
                        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                        <div className="w-5/12 bg-gray-50 p-6 border-r border-gray-200 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-indigo-800 m-0">
                                    {selectedDate.format('DD/MM/YYYY')}
                                </h3>
                                <p className="text-indigo-500 text-sm">Thêm ca trực mới cho ngày này</p>
                            </div>

                            <Form form={form} layout="vertical" onFinish={handleSubmit} className="flex-1 flex flex-col">
                                {/* 1. CHỌN CHUYÊN KHOA TRƯỚC */}
                                <Form.Item
                                    name="specialization_id"
                                    label={<span className="font-semibold text-gray-700">1. Chọn Chuyên khoa</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa' }]}
                                >
                                    <Select placeholder="VD: Nội khoa, Tim mạch..." size="large" allowClear>
                                        {specializations?.map((s: any) => (
                                            <Option key={s.id} value={s.id}>{s.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* 2. CHỌN BÁC SĨ (Đã lọc theo khoa) */}
                                <Form.Item
                                    name="doctor_id"
                                    label={<span className="font-semibold text-gray-700">2. Chọn Bác sĩ</span>}
                                    rules={[{ required: true, message: 'Chọn bác sĩ' }]}
                                    tooltip="Chỉ hiển thị bác sĩ thuộc khoa đã chọn"
                                >
                                    <Select
                                        placeholder={!formSpecId ? "Vui lòng chọn khoa trước" : "Chọn bác sĩ"}
                                        disabled={!formSpecId} // Disable nếu chưa chọn khoa
                                        size="large"
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {filteredDoctors.map((d: any) => (
                                            <Option key={d.id} value={d.id}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar size="small" src={d.user?.avatar} icon={<UserOutlined />} />
                                                    {d.user?.full_name}
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* 3. CHỌN PHÒNG (Đã lọc theo khoa) */}
                                {/* 3. CHỌN PHÒNG (Đã lọc theo khoa + Hiển thị Tòa nhà) */}
                                <Form.Item
                                    name="room_id"
                                    label={<span className="font-semibold text-gray-700">3. Chọn Phòng khám</span>}
                                    rules={[{ required: true, message: 'Chọn phòng' }]}
                                    tooltip="Chỉ hiển thị phòng thuộc khoa đã chọn"
                                >
                                    <Select
                                        placeholder={!formSpecId ? "Vui lòng chọn khoa trước" : "Chọn phòng làm việc"}
                                        disabled={!formSpecId}
                                        size="large"
                                        optionLabelProp="label" // Giúp hiển thị gọn gàng khi đã chọn
                                    >
                                        {filteredRooms.map((r: any) => (
                                            <Option
                                                key={r.id}
                                                value={r.id}
                                                label={`${r.name} - ${r.building || ''}`} // Khi chọn xong thì hiện cái này
                                            >
                                                <div className="flex flex-col py-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{r.name}</span>
                                                        <Tag className="m-0">{r.code}</Tag>
                                                    </div>
                                                    {/* Hiển thị Tòa nhà nhỏ bên dưới */}
                                                    <span className="text-xs text-gray-500 mt-0.5">
                                                        🏢 {r.building ? `Tòa ${r.building}` : 'Chưa cập nhật tòa'}
                                                    </span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* 4. THỜI GIAN */}
                                <Form.Item
                                    name="timeRange"
                                    label={<span className="font-semibold text-gray-700">4. Thời gian làm việc</span>}
                                    rules={[{ required: true, message: 'Chọn giờ' }]}
                                >
                                    <TimePicker.RangePicker format="HH:mm" minuteStep={15} size="large" className="w-full" />
                                </Form.Item>

                                <div className="mt-auto">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        block
                                        size="large"
                                        loading={createMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-500 h-12 text-lg font-semibold shadow-lg shadow-indigo-200"
                                    >
                                        <PlusOutlined /> Lưu ca trực
                                    </Button>
                                </div>
                            </Form>
                        </div>

                        {/* CỘT PHẢI: DANH SÁCH CA TRỰC */}
                        <div className="w-7/12 p-6 bg-white flex flex-col">
                            <div className="flex justify-between items-end mb-4 border-b pb-2">
                                <h4 className="font-bold text-gray-700 text-lg m-0">Danh sách ca trực</h4>
                                <Tag color="blue">{shiftsInModal.length} ca</Tag>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {shiftsInModal.length === 0 ? (
                                    <Empty description="Chưa có lịch trực nào trong ngày này" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    <List
                                        dataSource={shiftsInModal}
                                        renderItem={(item: any) => (
                                            <div className="flex items-start gap-3 p-3 border rounded-lg mb-3 hover:shadow-sm transition-all bg-white group">
                                                <div className="mt-1">
                                                    <Avatar size="large" src={item.doctor?.user?.avatar} icon={<UserOutlined />} className="bg-indigo-50 text-indigo-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-gray-800 text-base">{item.doctor?.user?.full_name}</span>
                                                        <Popconfirm
                                                            title="Xóa lịch này?"
                                                            onConfirm={() => deleteMutation.mutate(item.id)}
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button type="text" danger size="small" icon={<DeleteOutlined />} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Popconfirm>
                                                    </div>
                                                    <div className="text-xs text-indigo-600 font-semibold mb-1">
                                                        {item.doctor?.specialization?.name || 'Chưa phân khoa'}
                                                    </div>
                                                    <div className="flex gap-3 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><ClockCircleOutlined /> {dayjs(item.start_time).format('HH:mm')} - {dayjs(item.end_time).format('HH:mm')}</span>
                                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><HomeOutlined /> {item.room?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>

                <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f5f5f5; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
        `}</style>
            </div>
        </DashboardLayout>
    );
}