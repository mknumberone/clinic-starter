import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Input, Button, message, Row, Col, Card, Spin } from 'antd';
import { UserOutlined, EnvironmentOutlined, MedicineBoxOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { appointmentService } from '@/services/appointment.service';
import { useAuthStore } from '@/stores/authStore';
import { useBookingModalStore } from '@/stores/bookingModalStore';

const { Option } = Select;
const { TextArea } = Input;

export default function BookingModal() {
    const { isOpen, closeBooking } = useBookingModalStore();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    // --- State ---
    const [selectedBranch, setSelectedBranch] = useState<string>();
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>();
    const [selectedDoctor, setSelectedDoctor] = useState<string>();
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>();
    const [selectedSlot, setSelectedSlot] = useState<string>();

    // --- Data Fetching ---
    // 1. Lấy Chi nhánh
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: appointmentService.getBranches
    });

    // 2. Lấy Chuyên khoa
    const { data: specialties = [] } = useQuery({
        queryKey: ['specialties'],
        queryFn: appointmentService.getSpecialties
    });

    // 3. Lấy Bác sĩ (Phụ thuộc Branch & Specialty)
    const { data: doctors = [], isFetching: loadingDoctors } = useQuery({
        queryKey: ['doctors', selectedBranch, selectedSpecialty],
        queryFn: () => appointmentService.getDoctors(selectedBranch, selectedSpecialty),
        enabled: !!selectedBranch || !!selectedSpecialty,
    });

    // 4. Lấy Slot khám (Phụ thuộc Date, Branch, Specialty, Doctor)
    const { data: slots = [], isFetching: loadingSlots } = useQuery({
        queryKey: ['slots', selectedBranch, selectedSpecialty, selectedDoctor, selectedDate?.format('YYYY-MM-DD')],
        queryFn: () => appointmentService.getAvailableSlots(
            selectedBranch!,
            selectedSpecialty!,
            selectedDate!.format('YYYY-MM-DD'),
            selectedDoctor
        ),
        enabled: !!selectedBranch && !!selectedSpecialty && !!selectedDate,
    });

    // --- Mutation: Đặt lịch ---
    const createMutation = useMutation({
        mutationFn: appointmentService.createAppointment,
        onSuccess: () => {
            message.success('Đặt lịch thành công! Vui lòng kiểm tra lịch hẹn.');
            closeBooking();
            form.resetFields();
            resetStates();
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] }); // Refresh lại list nếu đang ở trang list
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Đặt lịch thất bại');
        },
    });

    const resetStates = () => {
        setSelectedSlot(undefined);
        // Không reset branch/specialty để tiện cho user đặt tiếp nếu muốn
    };

    const handleFinish = (values: any) => {
        if (!user) return message.error('Vui lòng đăng nhập lại');

        // Tính toán thời gian start/end từ slot
        // Giả sử slot dạng "08:00"
        const [hour, minute] = selectedSlot!.split(':');
        const startTime = selectedDate!.hour(parseInt(hour)).minute(parseInt(minute)).second(0);
        const endTime = startTime.add(30, 'minute'); // Giả sử mỗi ca 30p

        const payload = {
            patient_id: user.patient_id || user.id, // Fallback nếu chưa map patient_id
            branch_id: values.branch_id,
            doctor_assigned_id: values.doctor_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            notes: values.notes,
            appointment_type: 'checkup',
            source: 'web_booking'
        };

        createMutation.mutate(payload);
    };

    return (
        <Modal
            open={isOpen}
            onCancel={closeBooking}
            footer={null}
            width={700}
            centered
            title={
                <div className="text-center pb-4 border-b border-gray-100">
                    <h3 className="text-[#003553] font-bold text-xl uppercase">Đặt lịch khám bệnh</h3>
                    <p className="text-gray-500 text-sm font-normal">Vui lòng điền thông tin bên dưới</p>
                </div>
            }
            maskStyle={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 53, 83, 0.6)' }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                className="pt-4"
            >
                <Row gutter={16}>
                    {/* Cột 1: Thông tin chung */}
                    <Col span={12}>
                        <Form.Item
                            name="branch_id"
                            label="Cơ sở khám"
                            rules={[{ required: true, message: 'Vui lòng chọn cơ sở' }]}
                        >
                            <Select
                                placeholder="Chọn chi nhánh"
                                onChange={(val) => { setSelectedBranch(val); form.setFieldValue('doctor_id', undefined); }}
                                suffixIcon={<EnvironmentOutlined />}
                            >
                                {branches.map((b: any) => (
                                    <Option key={b.id} value={b.id}>{b.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="specialty_id"
                            label="Chuyên khoa"
                            rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa' }]}
                        >
                            <Select
                                placeholder="Chọn chuyên khoa"
                                onChange={(val) => { setSelectedSpecialty(val); form.setFieldValue('doctor_id', undefined); }}
                                suffixIcon={<MedicineBoxOutlined />}
                            >
                                {specialties.map((s: any) => (
                                    <Option key={s.id} value={s.id}>{s.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="doctor_id" label="Bác sĩ (Tùy chọn)">
                            <Select
                                placeholder="Chọn bác sĩ"
                                onChange={(val) => setSelectedDoctor(val)}
                                loading={loadingDoctors}
                                allowClear
                                suffixIcon={<UserOutlined />}
                            >
                                {doctors.map((d: any) => (
                                    <Option key={d.id} value={d.id}>{d.user.full_name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="date"
                            label="Ngày khám"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabledDate={(current) => current && current < dayjs().endOf('day')}
                                onChange={(date) => setSelectedDate(date)}
                                suffixIcon={<CalendarOutlined />}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Chọn giờ khám (Slots) */}
                <div className="mb-6">
                    <p className="mb-2 font-medium text-gray-700">Giờ khám khả dụng: <span className="text-red-500">*</span></p>

                    {!selectedBranch || !selectedSpecialty || !selectedDate ? (
                        <div className="p-4 bg-gray-50 text-center text-gray-400 rounded-lg border border-dashed">
                            Vui lòng chọn Cơ sở, Chuyên khoa và Ngày để xem lịch trống
                        </div>
                    ) : loadingSlots ? (
                        <div className="text-center py-4"><Spin /></div>
                    ) : slots.length === 0 ? (
                        <div className="p-4 bg-orange-50 text-orange-600 text-center rounded-lg">
                            Không có lịch trống vào ngày này. Vui lòng chọn ngày khác.
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto pr-1">
                            {slots.map((slot: string) => (
                                <div
                                    key={slot}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`
                                        cursor-pointer text-center py-2 rounded border transition-all
                                        ${selectedSlot === slot
                                            ? 'bg-[#009CAA] text-white border-[#009CAA] shadow-md font-bold'
                                            : 'bg-white border-gray-200 hover:border-[#009CAA] text-gray-600'}
                                    `}
                                >
                                    {slot}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Form.Item
                    name="notes"
                    label="Triệu chứng / Lý do khám"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do khám' }]}
                >
                    <TextArea rows={3} placeholder="Ví dụ: Đau đầu, sốt cao..." />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={createMutation.isPending}
                    disabled={!selectedSlot} // Chỉ cho bấm khi đã chọn giờ
                    className="bg-[#009CAA] hover:!bg-[#0086b3] h-12 font-bold text-lg rounded-lg shadow-lg mt-2"
                >
                    XÁC NHẬN ĐẶT LỊCH
                </Button>
            </Form>
        </Modal>
    );
}