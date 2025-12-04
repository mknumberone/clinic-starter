// src/pages/patient/AppointmentList.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card, Table, Tag, Typography, Tabs, Space, Avatar, Empty, Tooltip, Button, Spin
} from 'antd';
import {
    CalendarOutlined, UserOutlined, EnvironmentOutlined,
    ClockCircleOutlined, EyeOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/authStore';
import axiosInstance from '@/lib/axios';

const { Title, Text } = Typography;

export default function PatientAppointmentList() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');

    const { data, isLoading } = useQuery({
        queryKey: ['my-appointments', user?.id],
        queryFn: async () => {
            const res = await axiosInstance.get('/appointments', {
                params: { limit: 100 }
            });
            // Kiểm tra dữ liệu trả về để lấy đúng mảng
            const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
            return list;
        },
        enabled: !!user,
    });

    const appointments = Array.isArray(data) ? data : [];

    // --- LOGIC LỌC QUAN TRỌNG ---
    // Danh sách status cho tab "Sắp tới"
    const upcomingStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'PENDING'];

    const upcomingList = appointments.filter((appt: any) =>
        upcomingStatuses.includes(appt.status)
    );

    // Danh sách status cho tab "Lịch sử"
    const historyStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

    const historyList = appointments.filter((appt: any) =>
        historyStatuses.includes(appt.status)
    );

    const columns = [
        {
            title: 'Bác sĩ',
            key: 'doctor',
            width: 250,
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={record.doctor?.user?.avatar}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#87d068' }}
                    />
                    <div className="flex flex-col">
                        <Text strong>{record.doctor?.user?.full_name || 'Hệ thống đang xếp'}</Text>
                        {record.doctor?.specialization && (
                            <Tag className="m-0 w-fit text-[10px]">{record.doctor.specialization.name}</Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            width: 150,
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-indigo-600">
                        {dayjs(record.start_time).format('HH:mm')}
                    </span>
                    <span className="text-gray-500 text-xs">
                        {dayjs(record.start_time).format('DD/MM/YYYY')}
                    </span>
                </div>
            ),
        },
        {
            title: 'Địa điểm',
            key: 'location',
            responsive: ['md'],
            render: (_: any, record: any) => (
                <div className="flex flex-col text-xs text-gray-600">
                    <Space><EnvironmentOutlined /> {record.branch?.name}</Space>
                    {record.room && <Space><MedicineBoxOutlined /> {record.room.name}</Space>}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            dataIndex: 'status',
            width: 120,
            render: (status: string) => {
                let color = 'default';
                let text = status;

                switch (status) {
                    case 'SCHEDULED': color = 'blue'; text = 'Đã đặt'; break;
                    case 'CONFIRMED': color = 'cyan'; text = 'Đã xác nhận'; break;
                    case 'COMPLETED': color = 'green'; text = 'Hoàn thành'; break;
                    case 'CANCELLED': color = 'red'; text = 'Đã hủy'; break;
                    case 'PENDING': color = 'orange'; text = 'Chờ xếp'; break;
                }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: '',
            key: 'action',
            width: 50,
            // Thêm tham số record vào hàm render để lấy ID
            render: (_: any, record: any) => (
                <Tooltip title="Xem chi tiết">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        // Thêm sự kiện onClick để chuyển hướng
                        onClick={() => navigate(`/patient/appointments/${record.id}`)}
                    />
                </Tooltip>
            )
        }
    ];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-96">
                    <Spin size="large" tip="Đang tải lịch hẹn..." />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="p-6 min-h-screen bg-gray-50">
                <div className="mb-6">
                    <Title level={2} className="m-0 text-indigo-800">Lịch hẹn của tôi</Title>
                    <Text type="secondary">Theo dõi trạng thái khám chữa bệnh</Text>
                </div>

                <Card className="shadow-md border-0">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'upcoming',
                                label: <span className="text-base"><ClockCircleOutlined /> Sắp tới ({upcomingList.length})</span>,
                                children: (
                                    <Table
                                        columns={columns as any}
                                        dataSource={upcomingList}
                                        rowKey="id"
                                        pagination={{ pageSize: 5 }}
                                        locale={{
                                            emptyText: <Empty description="Bạn chưa có lịch hẹn nào sắp tới" />
                                        }}
                                    />
                                )
                            },
                            {
                                key: 'history',
                                label: <span className="text-base"><CalendarOutlined /> Lịch sử khám</span>,
                                children: (
                                    <Table
                                        columns={columns as any}
                                        dataSource={historyList}
                                        rowKey="id"
                                        pagination={{ pageSize: 10 }}
                                        locale={{
                                            emptyText: <Empty description="Chưa có lịch sử khám" />
                                        }}
                                    />
                                )
                            }
                        ]}
                    />
                </Card>
            </div>
        </DashboardLayout>
    );
}