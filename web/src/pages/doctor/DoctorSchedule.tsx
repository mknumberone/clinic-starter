// File: src/pages/doctor/DoctorSchedule.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Badge,
  Alert,
  Spin,
  Button,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LoginOutlined,
  LogoutOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctor.service';
import axiosInstance from '@/lib/axios'; // Import axios instance để gọi API điểm danh
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function DoctorSchedule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // 1. Lấy thông tin Bác sĩ
  const { data: doctorProfile, isLoading: loadingProfile, isError: profileError } = useQuery({
    queryKey: ['my-doctor-schedule-profile', user?.id],
    queryFn: async () => {
      try {
        const response = await doctorService.getDoctors({ limit: 100 });
        const doctors = response?.data || [];
        const myProfile = doctors.find((d: any) => d.user?.id === user?.id || d.user_id === user?.id);
        if (!myProfile) throw new Error('Tài khoản chưa liên kết với hồ sơ bác sĩ');
        return myProfile;
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // 2. Lấy Lịch trực
  const { data: shifts, isLoading: loadingShifts, isError: shiftsError, error: shiftsErrorDetail } = useQuery({
    queryKey: ['my-shifts', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];
      const data = await doctorService.getDoctorShifts(doctorProfile.id);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    },
    enabled: !!doctorProfile?.id,
  });

  // 3. Mutation Check-in / Check-out
  const attendanceMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'CHECK_IN' | 'CHECK_OUT' }) => {
      // Gọi API mà chúng ta đã định nghĩa ở Backend
      return axiosInstance.patch(`/shifts/${id}/attendance`, { type });
    },
    onSuccess: (_, variables) => {
      message.success(variables.type === 'CHECK_IN' ? 'Check-in thành công!' : 'Check-out thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Lỗi điểm danh');
    }
  });

  // --- LOGIC TRẠNG THÁI HIỂN THỊ ---
  const getShiftStatus = (record: any) => {
    const now = dayjs();
    const start = dayjs(record.start_time);
    const end = dayjs(record.end_time);

    // Logic trạng thái thời gian
    if (now.isBefore(start)) return { color: 'blue', text: 'Sắp tới' };
    if (now.isAfter(end)) return { color: 'default', text: 'Đã kết thúc' };
    return { color: 'green', text: 'Đang diễn ra', processing: true };
  };

  const getAttendanceStatus = (record: any) => {
    // Nếu chưa có checkin
    if (!record.actual_start_time) return null;

    const scheduledStart = dayjs(record.start_time);
    const actualStart = dayjs(record.actual_start_time);

    // Tính trễ (cho phép trễ 15 phút)
    const isLate = actualStart.diff(scheduledStart, 'minute') > 15;

    if (!record.actual_end_time) {
      return isLate
        ? <Tag color="orange">Đang làm (Đến muộn)</Tag>
        : <Tag color="processing">Đang làm việc</Tag>;
    }

    const scheduledEnd = dayjs(record.end_time);
    const actualEnd = dayjs(record.actual_end_time);
    // Tính về sớm (sớm hơn 15 phút)
    const isEarly = scheduledEnd.diff(actualEnd, 'minute') > 15;

    if (isLate && isEarly) return <Tag color="red">Muộn & Về sớm</Tag>;
    if (isLate) return <Tag color="orange">Đi muộn</Tag>;
    if (isEarly) return <Tag color="warning">Về sớm</Tag>;

    return <Tag color="success">Đúng giờ</Tag>;
  };

  const columns = [
    {
      title: 'Ngày trực',
      key: 'date',
      width: 120,
      render: (_: any, record: any) => {
        const date = dayjs(record.start_time);
        return (
          <div>
            <div className="font-bold text-base text-indigo-700">{date.format('DD/MM/YYYY')}</div>
            <div className="text-gray-500 text-sm">{date.format('dddd')}</div>
          </div>
        );
      },
      sorter: (a: any, b: any) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Khung giờ',
      key: 'time',
      width: 150,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={2}>
          <Tag icon={<ClockCircleOutlined />} color="cyan">
            {dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}
          </Tag>
          {/* Hiển thị thời gian thực tế nếu có */}
          {record.actual_start_time && (
            <div className="text-xs text-gray-500">
              In: <span className="font-semibold">{dayjs(record.actual_start_time).format('HH:mm')}</span>
              {record.actual_end_time && (
                <span> - Out: <span className="font-semibold">{dayjs(record.actual_end_time).format('HH:mm')}</span></span>
              )}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Địa điểm',
      key: 'room',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium"><EnvironmentOutlined /> {record.room?.name || 'Chưa xếp phòng'}</span>
          <div className="flex gap-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">{record.room?.code}</span>
            {record.room?.building && <span className="text-xs text-blue-500 bg-blue-50 px-1 rounded">{record.room.building}</span>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Chấm công', // [MỚI] Cột trạng thái công việc
      key: 'attendance_status',
      render: (_: any, record: any) => getAttendanceStatus(record) || <Text type="secondary" className="text-xs">Chưa check-in</Text>
    },
    {
      title: 'Thao tác', // [MỚI] Nút bấm
      key: 'action',
      width: 150,
      render: (_: any, record: any) => {
        const isToday = dayjs().isSame(dayjs(record.start_time), 'day');
        const hasCheckedIn = !!record.actual_start_time;
        const hasCheckedOut = !!record.actual_end_time;

        if (!isToday) {
          // Nếu không phải hôm nay -> Chỉ xem trạng thái
          return hasCheckedOut ? <CheckCircleOutlined className="text-green-500 text-xl" /> : <Text disabled>--</Text>;
        }

        if (hasCheckedOut) {
          return <div className="text-green-600 font-medium"><CheckCircleOutlined /> Hoàn thành</div>;
        }

        if (hasCheckedIn) {
          return (
            <Popconfirm
              title="Xác nhận kết thúc ca làm việc?"
              onConfirm={() => attendanceMutation.mutate({ id: record.id, type: 'CHECK_OUT' })}
            >
              <Button type="primary" danger icon={<LogoutOutlined />} loading={attendanceMutation.isPending}>
                Check Out
              </Button>
            </Popconfirm>
          );
        }

        return (
          <Popconfirm
            title="Xác nhận bắt đầu ca làm việc?"
            onConfirm={() => attendanceMutation.mutate({ id: record.id, type: 'CHECK_IN' })}
          >
            <Button type="primary" icon={<LoginOutlined />} loading={attendanceMutation.isPending}>
              Check In
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={2} className="flex items-center gap-2 m-0">
              <CalendarOutlined /> Lịch trực & Chấm công
            </Title>
            <Typography.Text type="secondary">
              Quản lý thời gian làm việc và điểm danh hàng ngày.
            </Typography.Text>
          </div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['my-shifts'] })}>
            Làm mới dữ liệu
          </Button>
        </div>

        {/* Loading & Error States... (Giữ nguyên như cũ) */}
        {(loadingProfile || (doctorProfile && loadingShifts)) && (
          <Card>
            <div className="text-center py-12">
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          </Card>
        )}

        {/* Data Table */}
        {doctorProfile && !loadingShifts && !shiftsError && (
          <Card className="shadow-md rounded-lg overflow-hidden" bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={shifts || []}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Chưa có lịch trực nào được xếp.' }}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}