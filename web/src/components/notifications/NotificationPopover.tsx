import { useQuery } from '@tanstack/react-query';
import { List, Typography, Empty, Spin } from 'antd';
import {
  CalendarOutlined,
  MailOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '@/services/dashboard.service';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';

const { Text } = Typography;

const NOTIFICATION_QUERY_KEY = ['dashboard-notifications'];

const STAFF_ROLES = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BRANCH_MANAGER'];

export function useNotificationCount() {
  const { user } = useAuthStore();
  const isStaff = user && STAFF_ROLES.includes(user.role);
  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: () => dashboardService.getNotifications(),
    refetchInterval: 60000,
    enabled: !!isStaff,
  });
  const { newAppointmentNotifications } = useNotificationStore();

  const count =
    (data?.newContactsCount ?? 0) +
    (data?.unreadMessagesCount ?? 0) +
    (data?.expiringMedications?.length ?? 0) +
    (data?.lowStockMedications?.length ?? 0) +
    newAppointmentNotifications.length;

  return { count, data, isLoading };
}

interface NotificationPopoverContentProps {
  onClose?: () => void;
}

export default function NotificationPopoverContent({ onClose }: NotificationPopoverContentProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isStaff = user && STAFF_ROLES.includes(user.role);
  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: () => dashboardService.getNotifications(),
    refetchOnMount: true,
    enabled: !!isStaff,
  });
  const { newAppointmentNotifications } = useNotificationStore();

  const role = (user?.role || 'ADMIN').toLowerCase();
  const base = role === 'branch_manager' ? 'manager' : role;

  const handleClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  type Item = {
    key: string;
    type: 'appointment' | 'contact' | 'message' | 'medicine_expiry' | 'medicine_low';
    title: string;
    description: string;
    path: string;
    icon: React.ReactNode;
  };

  const items: Item[] = [];

  newAppointmentNotifications.forEach((n) => {
    items.push({
      key: `appt-${n.id}-${n.createdAt}`,
      type: 'appointment',
      title: 'Lịch hẹn mới',
      description: `${n.patientName} vừa đặt lịch${n.time ? ` lúc ${n.time}` : ''}.`,
      path: role === 'receptionist' ? '/receptionist/appointments' : '/admin/appointments',
      icon: <CalendarOutlined style={{ color: '#1890ff' }} />,
    });
  });

  if ((data?.newContactsCount ?? 0) > 0) {
    items.push({
      key: 'contacts',
      type: 'contact',
      title: 'Liên hệ mới',
      description: `Bạn có ${data.newContactsCount} liên hệ mới chưa xem.`,
      path: '/admin/contacts',
      icon: <MailOutlined style={{ color: '#fa8c16' }} />,
    });
  }

  if ((data?.unreadMessagesCount ?? 0) > 0) {
    items.push({
      key: 'messages',
      type: 'message',
      title: 'Tin nhắn chưa đọc',
      description: `${data!.unreadMessagesCount} tin nhắn chưa đọc.`,
      path: `/${base}/messages`,
      icon: <MessageOutlined style={{ color: '#722ed1' }} />,
    });
  }

  (data?.expiringMedications ?? []).forEach((med, i) => {
    items.push({
      key: `exp-${med.id}-${i}`,
      type: 'medicine_expiry',
      title: 'Thuốc sắp hết hạn',
      description: `${med.name} — Hết hạn: ${dayjs(med.expiry_date).format('DD/MM/YYYY')} (còn ${med.available_qty} đơn vị).`,
      path: role === 'branch_manager' ? '/manager/inventory' : '/admin/medications',
      icon: <WarningOutlined style={{ color: '#faad14' }} />,
    });
  });

  (data?.lowStockMedications ?? []).forEach((med, i) => {
    items.push({
      key: `low-${med.id}-${i}`,
      type: 'medicine_low',
      title: 'Thuốc sắp hết',
      description: `${med.name} — Còn ${med.available_qty} đơn vị trong kho.`,
      path: role === 'branch_manager' ? '/manager/inventory' : '/admin/medications',
      icon: <MedicineBoxOutlined style={{ color: '#ff4d4f' }} />,
    });
  });

  if (isLoading && items.length === 0) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[120px]">
        <Spin tip="Đang tải..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4" style={{ width: 320 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo mới" />
      </div>
    );
  }

  return (
    <div className="p-0" style={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <Text strong>Thông báo</Text>
      </div>
      <List
        size="small"
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            className="cursor-pointer hover:bg-gray-50 px-4 py-3"
            onClick={() => handleClick(item.path)}
          >
            <List.Item.Meta
              avatar={<span className="text-xl">{item.icon}</span>}
              title={<Text strong className="text-sm">{item.title}</Text>}
              description={<Text type="secondary" className="text-xs">{item.description}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
