import BookingForm from '@/components/appointments/BookingForm';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function AdminBookAppointment() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Admin: Tạo lịch hẹn</h2>
        <BookingForm mode="ADMIN" />
      </div>
    </DashboardLayout>
  );
}