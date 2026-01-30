import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Space, Typography, Select, message, Badge } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentService } from '@/services/appointment.service';
import { doctorService } from '@/services/doctor.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function AppointmentCalendar() {
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-simple'],
    queryFn: () => doctorService.getDoctors({ limit: 100 }),
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments-calendar', selectedDoctor, dateRange],
    queryFn: () =>
      appointmentService.getAppointments({
        doctorId: selectedDoctor,
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 1000,
      }),
  });

  const statusColors: Record<string, string> = {
    scheduled: '#1890ff',
    confirmed: '#13c2c2',
    completed: '#52c41a',
    cancelled: '#ff4d4f',
    no_show: '#fa8c16',
  };

  const events =
    appointments?.data.map((apt) => ({
      id: apt.id,
      title: `${apt.patient?.user.full_name || 'N/A'} - ${apt.doctor?.user.full_name || 'N/A'}`,
      start: apt.start_time,
      end: apt.end_time,
      backgroundColor: statusColors[apt.status] || '#1890ff',
      borderColor: statusColors[apt.status] || '#1890ff',
      extendedProps: {
        appointment: apt,
      },
    })) || [];

  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id;
    navigate(`/admin/appointments/${appointmentId}`);
  };

  const handleDateClick = (info: any) => {
    navigate(`/admin/appointments/new?date=${info.dateStr}`);
  };

  const handleDatesSet = (info: any) => {
    setDateRange({
      start: dayjs(info.start).format('YYYY-MM-DD'),
      end: dayjs(info.end).format('YYYY-MM-DD'),
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Lịch hẹn
            </Title>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/appointments/new')}
          >
            Đặt lịch mới
          </Button>
        </div>

        <Card className="mb-4">
          <Space>
            <Select
              placeholder="Tất cả bác sĩ"
              value={selectedDoctor}
              onChange={setSelectedDoctor}
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: 300 }}
            >
              {doctors?.data.map((doctor) => (
                <Select.Option key={doctor.id} value={doctor.id}>
                  {doctor.title} {doctor.user.full_name} ({doctor.code})
                </Select.Option>
              ))}
            </Select>
            <Space style={{ marginLeft: 20 }}>
              <Badge color="#1890ff" text="Đã đặt" />
              <Badge color="#13c2c2" text="Đã xác nhận" />
              <Badge color="#52c41a" text="Hoàn thành" />
              <Badge color="#ff4d4f" text="Đã hủy" />
              <Badge color="#fa8c16" text="Vắng mặt" />
            </Space>
          </Space>
        </Card>

        <Card>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale="vi"
            buttonText={{
              today: 'Hôm nay',
              month: 'Tháng',
              week: 'Tuần',
              day: 'Ngày',
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            nowIndicator={true}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
