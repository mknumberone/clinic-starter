import { useQuery } from '@tanstack/react-query';
import { Spin, Alert, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import BookingForm from '@/components/appointments/BookingForm';
import { useAuthStore } from '@/stores/authStore';
import { patientService } from '@/services/patient.service';

export default function BookAppointmentPatient() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // --- LOGIC MỚI: TÌM HỒ SƠ BỆNH NHÂN CỦA USER ĐANG ĐĂNG NHẬP ---
    const { data: myPatientProfile, isLoading, error } = useQuery({
        queryKey: ['my-patient-profile', user?.id],
        queryFn: async () => {
            // Trường hợp 1: Nếu lúc login backend đã trả về thông tin patient (lý tưởng)
            if ((user as any)?.patient?.id) {
                return (user as any).patient;
            }

            // Trường hợp 2: Nếu chưa có, ta gọi API lấy danh sách và tìm chính mình
            // (Cách này hơi thủ công nhưng đảm bảo chạy được với Backend hiện tại của bạn)
            const res = await patientService.getPatients({ limit: 1000 });

            // Tìm hồ sơ nào có user_id trùng với id của người đang đăng nhập
            const found = res.data.find((p: any) => p.user_id === user?.id || p.user?.id === user?.id);

            if (!found) throw new Error('NOT_FOUND');
            return found;
        },
        enabled: !!user?.id, // Chỉ chạy khi đã có user
        retry: 1
    });

    // --- RENDER GIAO DIỆN ---

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" tip="Đang tải hồ sơ bệnh nhân..." />
            </div>
        );
    }

    // Trường hợp User này chưa có hồ sơ bệnh nhân (mới đăng ký account nhưng chưa update profile)
    if (error || !myPatientProfile) {
        return (
            <div>
                    <Alert
                        message="Chưa có hồ sơ bệnh nhân"
                        description="Tài khoản của bạn chưa có hồ sơ y tế. Vui lòng cập nhật thông tin cá nhân trước khi đặt lịch."
                        type="warning"
                        showIcon
                        action={
                            <Button type="primary" onClick={() => navigate('/patient/profile')}>
                                Cập nhật ngay
                            </Button>
                        }
                    />
            </div>
        );
    }

    return (
        <div>
                <h2 className="text-2xl font-bold mb-4 text-indigo-700">Đặt lịch khám bệnh</h2>
                {/* Truyền ID bệnh nhân tìm được vào Form */}
                <BookingForm
                    mode="PATIENT"
                    fixedPatientId={myPatientProfile.id}
                />
        </div>
    );
}