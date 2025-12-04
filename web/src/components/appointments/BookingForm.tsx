import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Card, Form, Select, DatePicker, Input, Button, Space, Typography,
    message, Steps, Row, Col, Alert, Radio, InputNumber, Checkbox
} from 'antd';
import {
    UserOutlined, CalendarOutlined, MedicineBoxOutlined, SaveOutlined,
    PlusOutlined, SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { patientService } from '@/services/patient.service';
import { doctorService } from '@/services/doctor.service';
import { appointmentService } from '@/services/appointment.service';
import { branchesService } from '@/services/branches.service';
import { specializationService } from '@/services/specialization.service';

const { Text } = Typography;
const { TextArea } = Input;

interface BookingFormProps {
    mode: 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';
    fixedBranchId?: string;
    fixedPatientId?: string;
}

export default function BookingForm({ mode, fixedBranchId, fixedPatientId }: BookingFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    const initialStep = mode === 'PATIENT' ? 1 : 0;
    const [currentStep, setCurrentStep] = useState(initialStep);

    const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isRecurring, setIsRecurring] = useState(false);

    // --- FORM WATCHER ---
    const watchedBranchId = Form.useWatch('branch_id', form) || fixedBranchId;
    const watchedSpecId = Form.useWatch('specialization_id', form);
    const watchedDoctorId = Form.useWatch('doctor_assigned_id', form);
    const watchedDate = Form.useWatch('appointment_date', form);
    const watchedStartTime = Form.useWatch('start_time', form);

    // --- 1. QUERIES ---

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: branchesService.getBranches,
        enabled: mode === 'ADMIN' || mode === 'PATIENT',
    });

    const { data: specializations } = useQuery({
        queryKey: ['specializations'],
        queryFn: specializationService.getSpecializations,
    });

    const { data: patients } = useQuery({
        queryKey: ['patients-search'],
        queryFn: () => patientService.getPatients({ limit: 100 }),
        enabled: mode !== 'PATIENT' && patientMode === 'existing',
    });

    const { data: doctors } = useQuery({
        queryKey: ['doctors', watchedBranchId, watchedSpecId],
        queryFn: () => doctorService.getDoctors({
            branchId: watchedBranchId,
            specializationId: watchedSpecId,
            limit: 100
        }),
        enabled: !!watchedBranchId || !!fixedBranchId,
    });

    const filteredDoctors = useMemo(() => {
        if (!doctors?.data) return [];
        if (!watchedSpecId) return doctors.data;
        return doctors.data.filter((d: any) => d.specialization?.id === watchedSpecId);
    }, [doctors, watchedSpecId]);

    // --- 2. EFFECTS ---

    useEffect(() => {
        if (fixedBranchId) form.setFieldValue('branch_id', fixedBranchId);
        if (fixedPatientId && mode === 'PATIENT') {
            form.setFieldValue('patient_id', fixedPatientId);
        }
    }, [fixedBranchId, fixedPatientId, mode, form]);

    useEffect(() => {
        const fetchSlots = async () => {
            const branchId = fixedBranchId || watchedBranchId;
            if (branchId && watchedDate) {
                try {
                    setAvailableSlots([]);
                    const slots = await appointmentService.getAvailableSlots({
                        branch_id: branchId,
                        doctor_id: watchedDoctorId,
                        specialization_id: watchedSpecId,
                        date: dayjs(watchedDate).format('YYYY-MM-DD')
                    });
                    setAvailableSlots(slots);
                } catch (error) {
                    console.error("Lỗi lấy slot:", error);
                    setAvailableSlots([]);
                }
            }
        };
        fetchSlots();
    }, [watchedBranchId, watchedDoctorId, watchedSpecId, watchedDate, fixedBranchId]);

    // --- 3. MUTATIONS ---

    const createPatientMutation = useMutation({
        mutationFn: (data: any) => patientService.createPatient(data),
        onSuccess: (newPatient) => {
            message.success(`Đã tạo hồ sơ: ${newPatient.user.full_name}`);
            setSelectedPatient(newPatient);
            setCurrentStep(1);
        },
        onError: (err: any) => {
            // Hiển thị lỗi chi tiết từ backend nếu có
            message.error(err.response?.data?.message || 'Lỗi tạo bệnh nhân. Email hoặc SĐT có thể đã tồn tại.');
        },
    });

    // ... (Phần trên giữ nguyên)

    const createAppointmentMutation = useMutation({
        mutationFn: (data: any) => appointmentService.createAppointment(data),

        // --- SỬA ĐOẠN NÀY ---
        onSuccess: (response: any) => {
            // Lấy thông báo từ Backend (quan trọng cho trường hợp đặt lịch chờ)
            const successMsg = response?.message || 'Đặt lịch thành công!';

            // Hiển thị thông báo (Dùng message của Antd)
            message.success({
                content: successMsg,
                duration: 5, // Hiện lâu hơn chút để khách đọc kịp nếu thông báo dài
            });

            queryClient.invalidateQueries({ queryKey: ['appointments'] });

            // Điều hướng
            if (mode === 'PATIENT') navigate('/patient/appointments');
            else navigate(`/${mode === 'MANAGER' ? 'manager' : mode.toLowerCase()}/appointments`);
        },
        onError: (err: any) => {
            // Hiển thị lỗi
            const errorMsg = err.response?.data?.message;
            message.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg || 'Có lỗi xảy ra');
        },
    });

    // ... (Phần dưới giữ nguyên)

    // --- 4. HANDLERS ---

    const handleNextStep = async () => {
        if (currentStep === 0 && mode !== 'PATIENT') {
            if (patientMode === 'new') {
                try {
                    // ---> CẬP NHẬT 1: Thêm new_email vào danh sách validate
                    const values = await form.validateFields(['new_full_name', 'new_email', 'new_phone', 'new_gender', 'new_dob', 'new_address']);

                    createPatientMutation.mutate({
                        full_name: values.new_full_name,
                        email: values.new_email, // ---> CẬP NHẬT 2: Gửi email lên server
                        phone: values.new_phone,
                        gender: values.new_gender,
                        date_of_birth: dayjs(values.new_dob).toISOString(),
                        address: values.new_address,
                        password: 'Password@123'
                    });
                    return;
                } catch (e) { return; }
            } else {
                if (!selectedPatient) {
                    message.error('Vui lòng chọn bệnh nhân');
                    return;
                }
            }
        }

        if (currentStep === 1) {
            try {
                await form.validateFields(['branch_id', 'start_time', 'appointment_date', 'appointment_type']);
            } catch (e) {
                console.error("Validation Error:", e);
                message.error('Vui lòng điền đủ: Cơ sở, Ngày, Giờ và Lý do khám');
                return;
            }
        }

        setCurrentStep(prev => prev + 1);
    };

    const handleSubmit = () => {
        const values = form.getFieldsValue(true);

        const dateStr = dayjs(values.appointment_date).format('YYYY-MM-DD');
        const startTimeStr = values.start_time;

        if (!startTimeStr) {
            message.error("Lỗi: Chưa chọn giờ khám!");
            return;
        }

        const [h, m] = startTimeStr.split(':').map(Number);
        const startObj = dayjs(dateStr).hour(h).minute(m);
        const endObj = startObj.add(30, 'minute');

        const payload = {
            branch_id: fixedBranchId || values.branch_id,
            patient_id: fixedPatientId || selectedPatient?.id,
            doctor_assigned_id: values.doctor_assigned_id,
            room_id: values.room_id,
            start_time: startObj.toISOString(),
            end_time: endObj.toISOString(),
            appointment_type: values.appointment_type,
            notes: values.notes,
            ...(isRecurring && {
                is_recurring: true,
                recurring_count: values.recurring_count,
                interval_months: values.interval_months
            })
        };

        createAppointmentMutation.mutate(payload);
    };

    const getSpecName = () => {
        const specId = watchedSpecId || form.getFieldValue('specialization_id');
        if (!specId || !specializations) return 'Chưa chọn';
        const spec = specializations.find((s: any) => s.id === specId);
        return spec ? spec.name : 'Không xác định';
    };

    return (
        <div className="booking-form-container">
            <Card className="mb-4">
                <Steps
                    current={mode === 'PATIENT' ? currentStep - 1 : currentStep}
                    items={[
                        { title: 'Thông tin Bệnh nhân', icon: <UserOutlined /> },
                        { title: 'Thông tin Khám', icon: <CalendarOutlined /> },
                        { title: 'Xác nhận', icon: <MedicineBoxOutlined /> },
                    ].slice(mode === 'PATIENT' ? 1 : 0)}
                />
            </Card>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ appointment_type: 'Khám tổng quát', new_gender: 'MALE' }}
                    preserve={true}
                >

                    {/* === STEP 0: BỆNH NHÂN === */}
                    {currentStep === 0 && mode !== 'PATIENT' && (
                        <div className="fade-in">
                            <Radio.Group value={patientMode} onChange={e => setPatientMode(e.target.value)} buttonStyle="solid" className="mb-6">
                                <Radio.Button value="existing"><SearchOutlined /> Tìm hồ sơ có sẵn</Radio.Button>
                                <Radio.Button value="new"><PlusOutlined /> Tạo bệnh nhân mới</Radio.Button>
                            </Radio.Group>

                            {patientMode === 'existing' ? (
                                <Form.Item label="Tìm kiếm bệnh nhân (Tên hoặc SĐT)">
                                    <Select
                                        showSearch
                                        placeholder="Nhập tên hoặc số điện thoại..."
                                        filterOption={(input, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                        options={patients?.data?.map((p: any) => ({
                                            value: p.id,
                                            label: `${p.user.full_name} - ${p.user.phone}`
                                        })) || []}
                                        onChange={(val) => {
                                            const p = patients?.data.find((x: any) => x.id === val);
                                            setSelectedPatient(p);
                                        }}
                                    />
                                </Form.Item>
                            ) : (
                                // --- CẬP NHẬT 3: Form nhập thông tin đầy đủ ---
                                <div className="bg-blue-50 p-6 rounded border border-blue-100">
                                    <Text strong className="block mb-4 text-blue-700">Thông tin bệnh nhân mới</Text>

                                    {/* Hàng 1: Tên & SĐT */}
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="new_full_name" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                                                <Input placeholder="Ví dụ: Nguyễn Văn A" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="new_phone" label="Số điện thoại" rules={[{ required: true, pattern: /^[0-9]{10}$/, message: 'SĐT không hợp lệ' }]}>
                                                <Input placeholder="0912..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Hàng 2: Email & Địa chỉ */}
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="new_email" label="Email (Bắt buộc)" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                                                <Input placeholder="email@example.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="new_address" label="Địa chỉ">
                                                <Input placeholder="Nhập địa chỉ..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Hàng 3: Giới tính & Ngày sinh */}
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="new_gender" label="Giới tính" rules={[{ required: true }]}>
                                                <Select options={[{ label: 'Nam', value: 'MALE' }, { label: 'Nữ', value: 'FEMALE' }]} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="new_dob" label="Ngày sinh" rules={[{ required: true, message: 'Chọn ngày sinh' }]}>
                                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Text type="secondary" italic className="block mt-2">
                                        * Hệ thống sẽ tự động tạo tài khoản đăng nhập cho bệnh nhân (Mật khẩu mặc định: Password@123).
                                    </Text>
                                </div>
                            )}

                            <Button type="primary" onClick={handleNextStep} loading={createPatientMutation.isPending} className="mt-4">
                                {patientMode === 'new' ? 'Tạo hồ sơ & Tiếp tục' : 'Tiếp tục'}
                            </Button>
                        </div>
                    )}

                    {/* ... (Các phần Step 1 và Step 2 giữ nguyên như code trước) ... */}

                    {currentStep === 1 && (
                        <div className="fade-in">
                            <Row gutter={16}>
                                {(mode === 'ADMIN' || mode === 'PATIENT') && (
                                    <Col span={12}>
                                        <Form.Item name="branch_id" label="Cơ sở khám" rules={[{ required: true, message: 'Chọn cơ sở' }]}>
                                            <Select
                                                placeholder="Chọn chi nhánh"
                                                options={branches?.map((b: any) => ({ label: b.name, value: b.id }))}
                                                onChange={() => form.setFieldsValue({ doctor_assigned_id: null })}
                                            />
                                        </Form.Item>
                                    </Col>
                                )}
                                <Col span={12}>
                                    <Form.Item name="specialization_id" label="Chuyên khoa (Lọc bác sĩ)">
                                        <Select
                                            allowClear
                                            placeholder="Tất cả chuyên khoa"
                                            options={specializations?.map((s: any) => ({ label: s.name, value: s.id }))}
                                            onChange={() => form.setFieldsValue({ doctor_assigned_id: null })}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="doctor_assigned_id" label="Bác sĩ khám">
                                        <Select
                                            allowClear
                                            placeholder={watchedSpecId ? "Chọn bác sĩ trong khoa này" : "Chọn bác sĩ (hoặc để trống)"}
                                            options={filteredDoctors.map((d: any) => ({
                                                label: `${d.title} ${d.user.full_name} (${d.specialization?.name || 'Đa khoa'})`,
                                                value: d.id
                                            }))}
                                            onChange={(val) => {
                                                const d = filteredDoctors.find((doc: any) => doc.id === val);
                                                setSelectedDoctor(d);
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="appointment_date" label="Ngày khám" rules={[{ required: true, message: 'Chọn ngày khám' }]}>
                                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(c) => c && c < dayjs().startOf('day')} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {availableSlots.length > 0 ? (
                                <div className="mb-6">
                                    <div className="ant-col ant-form-item-label mb-2">
                                        <label className="ant-form-item-required">Chọn giờ khám</label>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
                                        {availableSlots.map((slot) => {
                                            const isSelected = watchedStartTime === slot;
                                            return (
                                                <div
                                                    key={slot}
                                                    onClick={() => {
                                                        form.setFieldValue('start_time', slot);
                                                        form.validateFields(['start_time']);
                                                    }}
                                                    className={`
                                            cursor-pointer text-center py-2 px-1 rounded border transition-all font-medium
                                            ${isSelected
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-500'}
                                        `}
                                                >
                                                    {slot}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Form.Item name="start_time" rules={[{ required: true, message: 'Vui lòng chọn giờ khám' }]} style={{ height: 0, margin: 0, opacity: 0 }}>
                                        <Input />
                                    </Form.Item>
                                </div>
                            ) : (
                                watchedDate && (
                                    <Alert message="Không tìm thấy lịch trống." type="warning" showIcon className="mb-4" />
                                )
                            )}

                            <Form.Item name="appointment_type" label="Triệu chứng / Lý do" rules={[{ required: true, message: 'Nhập lý do khám' }]}>
                                <TextArea rows={2} />
                            </Form.Item>

                            <Space className="w-full justify-between">
                                <Button onClick={() => setCurrentStep(prev => prev - 1)} disabled={mode === 'PATIENT' && currentStep === 1}>Quay lại</Button>
                                <Button type="primary" onClick={handleNextStep}>Tiếp tục</Button>
                            </Space>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="fade-in">
                            <Alert
                                message="Xác nhận thông tin đặt lịch"
                                type="info"
                                showIcon
                                description={
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li><b>Bệnh nhân:</b> {mode === 'PATIENT' ? 'Tôi' : (selectedPatient?.user?.full_name || form.getFieldValue('new_full_name'))}</li>
                                        <li><b>Chuyên khoa:</b> {getSpecName()}</li>
                                        <li><b>Bác sĩ:</b> {selectedDoctor ? `${selectedDoctor.title} ${selectedDoctor.user.full_name}` : 'Tự động sắp xếp'}</li>
                                        <li><b>Thời gian:</b> {dayjs(watchedDate).format('DD/MM/YYYY')} lúc <span className="text-blue-600 font-bold text-lg">{watchedStartTime}</span></li>
                                        <li><b>Triệu chứng:</b> {form.getFieldValue('appointment_type')}</li>
                                    </ul>
                                }
                            />
                            <Space className="mt-6 w-full justify-end">
                                <Button onClick={() => setCurrentStep(1)}>Sửa lại</Button>
                                <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={createAppointmentMutation.isPending}>
                                    Xác nhận & Gửi
                                </Button>
                            </Space>
                        </div>
                    )}
                </Form>
            </Card>
        </div>
    );
}