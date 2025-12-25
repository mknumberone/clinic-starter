import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Badge,
  Alert,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';
import { doctorService } from '@/services/doctor.service';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function DoctorSchedule() {
  const { user } = useAuthStore();

  // 1. Lấy thông tin Bác sĩ
  const { data: doctorProfile, isLoading: loadingProfile, isError: profileError } = useQuery({
    queryKey: ['my-doctor-schedule-profile', user?.id],
    queryFn: async () => {
      console.log("--- DEBUG TÌM BÁC SĨ ---");
      console.log("User ID đang đăng nhập:", user?.id);

      try {
        // Sử dụng service thay vì gọi trực tiếp axiosInstance
        const response = await doctorService.getDoctors({ limit: 100 });
        // doctorService.getDoctors() trả về { data: [...], pagination: {...} }
        const doctors = response?.data || [];
        console.log("Danh sách bác sĩ tải về:", doctors);

        // Tìm bác sĩ
        const myProfile = doctors.find((d: any) => d.user?.id === user?.id || d.user_id === user?.id);

        if (myProfile) {
          console.log("=> ĐÃ TÌM THẤY BÁC SĨ:", myProfile.user.full_name);
        } else {
          console.error("=> KHÔNG TÌM THẤY BÁC SĨ KHỚP VỚI ID:", user?.id);
        }

        if (!myProfile) throw new Error('Tài khoản chưa liên kết với hồ sơ bác sĩ');
        return myProfile;
      } catch (error: any) {
        console.error("Lỗi khi tìm bác sĩ:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // 2. Lấy Lịch trực
  const { data: shifts, isLoading: loadingShifts, isError: shiftsError, error: shiftsErrorDetail } = useQuery({
    queryKey: ['my-shifts', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];
      console.log("Gọi API lấy lịch cho Doctor ID:", doctorProfile.id);
      try {
        const data = await doctorService.getDoctorShifts(doctorProfile.id);
        // Xử lý response an toàn
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.shifts)) return data.shifts;
        return [];
      } catch (error: any) {
        console.error("Lỗi khi lấy lịch trực:", error);
        throw error;
      }
    },
    enabled: !!doctorProfile?.id,
    retry: 1,
  });

  const getShiftStatus = (start: string, end: string) => {
    const now = dayjs();
    const startTime = dayjs(start);
    const endTime = dayjs(end);

    if (now.isBefore(startTime)) return { color: 'blue', text: 'Sắp tới' };
    if (now.isAfter(endTime)) return { color: 'default', text: 'Đã qua' };
    return { color: 'green', text: 'Đang diễn ra', processing: true };
  };

  const columns = [
    {
      title: 'Ngày trực',
      key: 'date',
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
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: any) => (
        <Tag icon={<ClockCircleOutlined />} color="cyan" className="px-2 py-1 text-sm">
          {dayjs(record.start_time).format('HH:mm')} - {dayjs(record.end_time).format('HH:mm')}
        </Tag>
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
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const status = getShiftStatus(record.start_time, record.end_time);
        return status.processing ? (
          <Badge status="processing" text={<span className="text-green-600 font-bold">{status.text}</span>} />
        ) : (
          <Badge status={status.color === 'blue' ? 'warning' : 'default'} text={status.text} />
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Title level={2} className="flex items-center gap-2">
            <CalendarOutlined /> Lịch trực của tôi
          </Title>
          <Typography.Text type="secondary">
            Xem danh sách các ca trực đã được phân công cho bạn.
          </Typography.Text>
        </div>

        {/* Loading */}
        {(loadingProfile || (doctorProfile && loadingShifts)) && (
          <Card>
            <div className="text-center py-12">
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          </Card>
        )}

        {/* Error State - Không tìm thấy bác sĩ */}
        {!loadingProfile && (!doctorProfile || profileError) && (
          <Alert
            message="Không tìm thấy thông tin Bác sĩ"
            description={
              <div>
                Tài khoản của bạn chưa được liên kết với hồ sơ bác sĩ.
                <br /><b>Cách khắc phục:</b> Hãy thử Đăng xuất và Đăng nhập lại.
                {profileError && (
                  <div className="mt-2 text-xs text-gray-500">
                    Chi tiết lỗi: {(profileError as any)?.response?.data?.message || (profileError as any)?.message || 'Lỗi không xác định'}
                  </div>
                )}
              </div>
            }
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {/* Error State - Lỗi khi lấy lịch trực */}
        {doctorProfile && shiftsError && (
          <Alert
            message="Lỗi kết nối"
            description={
              <div>
                Không thể tải dữ liệu lịch trực. Vui lòng thử lại sau.
                <br />
                <span className="text-xs text-gray-500">
                  {(shiftsErrorDetail as any)?.response?.data?.message || (shiftsErrorDetail as any)?.message || 'Lỗi không xác định'}
                </span>
              </div>
            }
            type="error"
            showIcon
            className="mb-4"
          />
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