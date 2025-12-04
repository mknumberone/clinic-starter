import BookingForm from '@/components/appointments/BookingForm';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/authStore';

export default function ManagerBookAppointment() {
    const { user } = useAuthStore();

    // Lấy branch_id của user hiện tại
    const myBranchId = user?.branch_id;

    if (!myBranchId) return <div>Lỗi: Tài khoản chưa được gán chi nhánh.</div>;

    return (
        <DashboardLayout>
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Đặt lịch khám (Tại chi nhánh)</h2>
                {/* Lễ tân cũng dùng mode MANAGER hoặc RECEPTIONIST tùy bạn define, ở đây dùng chung logic khóa branch */}
                <BookingForm mode="MANAGER" fixedBranchId={myBranchId} />
            </div>
        </DashboardLayout>
    );
}