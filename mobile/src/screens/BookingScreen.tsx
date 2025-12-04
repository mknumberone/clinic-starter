import React, { useState, useEffect, createElement } from 'react';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, useTheme, Menu, TouchableRipple, ActivityIndicator, Banner, ProgressBar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';

import { appointmentService } from '../services/appointment.service';
import { patientService } from '../services/patient.service';
import { useAuthStore } from '../stores/authStore';

export default function BookingScreen() {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // --- 1. DATA FETCHING ---
    const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: appointmentService.getBranches });
    const { data: specialties = [] } = useQuery({ queryKey: ['specialties'], queryFn: appointmentService.getSpecialties });

    // Tìm hồ sơ bệnh nhân
    const { data: myPatientProfile, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
        queryKey: ['my-patient-profile', user?.id],
        queryFn: async () => {
            if ((user as any)?.patient?.id) return (user as any).patient;
            const res = await patientService.getPatients({ limit: 1000 });
            const found = res.data?.find((p: any) => p.user_id === user?.id || p.user?.id === user?.id);
            if (!found) throw new Error('NOT_FOUND');
            return found;
        },
        enabled: !!user?.id,
        retry: 1
    });

    // --- 2. FORM STATE ---
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
    const [notes, setNotes] = useState('');

    const [visibleMenu, setVisibleMenu] = useState({ branch: false, specialty: false, doctor: false });

    // Lấy bác sĩ
    const { data: doctors = [] } = useQuery({
        queryKey: ['doctors', selectedBranch, selectedSpecialty],
        queryFn: () => appointmentService.getDoctors(selectedBranch, selectedSpecialty),
        enabled: !!selectedSpecialty,
    });

    // Lấy Slot (Giờ khám)
    const formattedDate = dayjs(date).format('YYYY-MM-DD');

    // FIX LỖI SLOT ERROR TẠI ĐÂY
    const {
        data: availableSlots = [],
        isFetching: loadingSlots,
        error: slotError
    } = useQuery({
        queryKey: ['slots', selectedBranch, selectedSpecialty, selectedDoctor, formattedDate],
        queryFn: () => appointmentService.getAvailableSlots(selectedBranch, selectedSpecialty, formattedDate, selectedDoctor),
        enabled: !!selectedBranch && !!selectedSpecialty,
        retry: false
    });

    // Reset logic khi đổi lựa chọn
    useEffect(() => { setSelectedSpecialty(''); setSelectedDoctor(''); setSelectedTimeSlot(''); }, [selectedBranch]);
    useEffect(() => { setSelectedDoctor(''); setSelectedTimeSlot(''); }, [selectedSpecialty]);
    useEffect(() => { setSelectedTimeSlot(''); }, [selectedDoctor, formattedDate]);

    // --- 3. HELPER: SHOW ALERT (FIX TRIỆT ĐỂ LỖI WEB) ---
    const showAlert = (title: string, message: string, onOk?: () => void) => {
        if (Platform.OS === 'web') {
            // Sử dụng setTimeout để không block UI render
            setTimeout(() => {
                // FIX: Ép kiểu (window as any) để TypeScript không báo lỗi 'alert'
                (window as any).alert(`${title}: ${message}`);
                if (onOk) onOk();
            }, 100);
        } else {
            // Trên Mobile dùng Alert Native
            Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
        }
    };

    // --- 4. SUBMIT ---
    const createMutation = useMutation({
        mutationFn: appointmentService.createAppointment,
        onSuccess: (response: any) => {
            const message = response?.message || 'Đặt lịch thành công!';

            showAlert('Thông báo', message, () => {
                queryClient.invalidateQueries(['myAppointments']);
                navigation.navigate('Appointments');
            });
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
            showAlert('Lỗi', Array.isArray(msg) ? msg[0] : msg);
        },
    });

    const handleSubmit = () => {
        if (!selectedBranch) return showAlert('Thiếu thông tin', 'Vui lòng chọn Cơ sở');
        if (!selectedSpecialty) return showAlert('Thiếu thông tin', 'Vui lòng chọn Chuyên khoa');
        if (!selectedTimeSlot) return showAlert('Thiếu thông tin', 'Vui lòng chọn Giờ khám');
        if (!notes.trim()) return showAlert('Thiếu thông tin', 'Vui lòng nhập Triệu chứng/Lý do khám');

        // Xử lý ngày giờ
        const [h, m] = selectedTimeSlot.split(':');
        const startDateTime = dayjs(date).hour(Number(h)).minute(Number(m)).second(0);
        const endDateTime = startDateTime.add(30, 'minute');

        createMutation.mutate({
            patient_id: myPatientProfile.id,
            branch_id: selectedBranch,
            doctor_assigned_id: selectedDoctor || undefined,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: notes,
            appointment_type: 'checkup',
            source: 'mobile_app'
        });
    };

    // Helper hiển thị tên
    const getBranchName = () => Array.isArray(branches) ? branches.find(b => b.id === selectedBranch)?.name || 'Chọn cơ sở' : 'Chọn cơ sở';
    const getSpecialtyName = () => Array.isArray(specialties) ? specialties.find(s => s.id === selectedSpecialty)?.name || 'Tất cả chuyên khoa' : 'Tất cả chuyên khoa';
    const getDoctorName = () => Array.isArray(doctors) ? doctors.find(d => d.id === selectedDoctor)?.user?.full_name || 'Bác sĩ bất kỳ' : 'Bác sĩ bất kỳ';

    if (isLoadingProfile) return <View style={styles.center}><ActivityIndicator animating size="large" /></View>;
    if (isProfileError || !myPatientProfile) return (
        <View style={{ padding: 16 }}><Banner visible actions={[{ label: 'Cập nhật', onPress: () => navigation.navigate('Profile') }]}>Chưa có hồ sơ bệnh nhân.</Banner></View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header */}
                <View style={styles.header}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                        Đặt lịch: {myPatientProfile.user?.full_name}
                    </Text>
                    <ProgressBar progress={selectedTimeSlot ? 1 : 0.6} color={theme.colors.primary} style={{ marginTop: 8, height: 4, borderRadius: 2 }} />
                </View>

                <View style={styles.formContainer}>

                    {/* 1. CƠ SỞ */}
                    <View style={styles.group}>
                        <Text style={styles.label}>Cơ sở khám <Text style={{ color: 'red' }}>*</Text></Text>
                        <Menu
                            visible={visibleMenu.branch}
                            onDismiss={() => setVisibleMenu({ ...visibleMenu, branch: false })}
                            anchor={
                                <TouchableRipple onPress={() => setVisibleMenu({ ...visibleMenu, branch: true })} style={styles.dropdown}>
                                    <View style={styles.row}>
                                        <Text>{getBranchName()}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color="#777" />
                                    </View>
                                </TouchableRipple>
                            }
                        >
                            {Array.isArray(branches) && branches.map(b => (
                                <Menu.Item key={b.id} onPress={() => { setSelectedBranch(b.id); setVisibleMenu({ ...visibleMenu, branch: false }); }} title={b.name} />
                            ))}
                        </Menu>
                    </View>

                    {/* 2. CHUYÊN KHOA */}
                    <View style={styles.group}>
                        <Text style={styles.label}>Chuyên khoa <Text style={{ color: 'red' }}>*</Text></Text>
                        <Menu
                            visible={visibleMenu.specialty}
                            onDismiss={() => setVisibleMenu({ ...visibleMenu, specialty: false })}
                            anchor={
                                <TouchableRipple
                                    onPress={() => !selectedBranch ? showAlert('Lưu ý', 'Vui lòng chọn cơ sở trước') : setVisibleMenu({ ...visibleMenu, specialty: true })}
                                    style={[styles.dropdown, !selectedBranch && styles.disabled]}
                                >
                                    <View style={styles.row}>
                                        <Text>{getSpecialtyName()}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color="#777" />
                                    </View>
                                </TouchableRipple>
                            }
                        >
                            {Array.isArray(specialties) && specialties.map(s => (
                                <Menu.Item key={s.id} onPress={() => { setSelectedSpecialty(s.id); setVisibleMenu({ ...visibleMenu, specialty: false }); }} title={s.name} />
                            ))}
                        </Menu>
                    </View>

                    {/* 3. BÁC SĨ */}
                    <View style={styles.group}>
                        <Text style={styles.label}>Bác sĩ khám</Text>
                        <Menu
                            visible={visibleMenu.doctor}
                            onDismiss={() => setVisibleMenu({ ...visibleMenu, doctor: false })}
                            anchor={
                                <TouchableRipple
                                    onPress={() => !selectedSpecialty ? showAlert('Lưu ý', 'Vui lòng chọn chuyên khoa trước') : setVisibleMenu({ ...visibleMenu, doctor: true })}
                                    style={[styles.dropdown, !selectedSpecialty && styles.disabled]}
                                >
                                    <View style={styles.row}>
                                        <Text>{getDoctorName()}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={24} color="#777" />
                                    </View>
                                </TouchableRipple>
                            }
                        >
                            <Menu.Item onPress={() => { setSelectedDoctor(''); setVisibleMenu({ ...visibleMenu, doctor: false }); }} title="Chọn bác sĩ trong khoa này (Bất kỳ)" />
                            {Array.isArray(doctors) && doctors.map(d => (
                                <Menu.Item key={d.id} onPress={() => { setSelectedDoctor(d.id); setVisibleMenu({ ...visibleMenu, doctor: false }); }} title={d.user?.full_name} />
                            ))}
                        </Menu>
                    </View>

                    {/* 4. NGÀY KHÁM */}
                    <View style={styles.group}>
                        <Text style={styles.label}>Ngày khám <Text style={{ color: 'red' }}>*</Text></Text>
                        {Platform.OS === 'web' ? (
                            <View style={styles.dropdown}>
                                {createElement('input', {
                                    type: 'date',
                                    value: dayjs(date).format('YYYY-MM-DD'),
                                    style: { border: 'none', outline: 'none', width: '100%', fontSize: 16, backgroundColor: 'transparent', fontFamily: 'System' },
                                    onChange: (e: any) => setDate(new Date(e.target.value))
                                })}
                            </View>
                        ) : (
                            <>
                                <TouchableRipple onPress={() => setShowDatePicker(true)} style={styles.dropdown}>
                                    <View style={styles.row}>
                                        <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
                                        <MaterialCommunityIcons name="calendar" size={24} color="#777" />
                                    </View>
                                </TouchableRipple>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setDate(d); }}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {/* 5. GIỜ KHÁM (SLOTS) */}
                    {selectedBranch && selectedSpecialty && (
                        <View style={styles.group}>
                            <Text style={styles.label}>Chọn giờ khám <Text style={{ color: 'red' }}>*</Text></Text>

                            {loadingSlots ? (
                                <View style={{ padding: 20 }}><ActivityIndicator /></View>
                            ) : (slotError || !availableSlots || availableSlots.length === 0) ? (
                                <Text style={{ color: 'orange', fontStyle: 'italic' }}>
                                    Không tìm thấy lịch trống hoặc ngày này phòng khám nghỉ.
                                </Text>
                            ) : (
                                <View style={styles.slotGrid}>
                                    {availableSlots.map((slot: string) => (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[
                                                styles.slotItem,
                                                selectedTimeSlot === slot && styles.slotSelected
                                            ]}
                                            onPress={() => setSelectedTimeSlot(slot)}
                                        >
                                            <Text style={[
                                                styles.slotText,
                                                selectedTimeSlot === slot && { color: 'white', fontWeight: 'bold' }
                                            ]}>
                                                {slot}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* 6. TRIỆU CHỨNG */}
                    <View style={styles.group}>
                        <Text style={styles.label}>Triệu chứng / Lý do <Text style={{ color: 'red' }}>*</Text></Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Nhập triệu chứng..."
                            multiline numberOfLines={3}
                            value={notes} onChangeText={setNotes}
                            style={{ backgroundColor: 'white' }}
                        />
                    </View>

                    {/* SUBMIT BUTTON */}
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={createMutation.isPending}
                        style={{ marginTop: 12 }}
                        contentStyle={{ height: 48 }}
                        disabled={!selectedTimeSlot} // Chỉ cho phép bấm khi đã chọn giờ
                    >
                        Tiếp tục
                    </Button>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 16, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#eee' },
    formContainer: { padding: 16 },
    group: { marginBottom: 16 },
    label: { marginBottom: 6, fontWeight: '500', color: '#444' },
    dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, backgroundColor: 'white' },
    disabled: { backgroundColor: '#f2f2f2', borderColor: '#e0e0e0' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotItem: {
        width: '23%',
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    slotSelected: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    slotText: {
        color: '#333',
        fontSize: 14,
    }
});