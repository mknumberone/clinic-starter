import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Divider, DataTable, useTheme, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export default function MedicalRecordDetailScreen({ route }: any) {
    const { id } = route.params;
    const theme = useTheme();

    const { data: appointment, isLoading } = useQuery({
        queryKey: ['medicalRecordDetail', id],
        queryFn: () => appointmentService.getAppointmentById(id),
    });

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!appointment) return <View style={styles.center}><Text>Không tìm thấy dữ liệu</Text></View>;

    const record = appointment.medical_record;
    // Lấy đơn thuốc đầu tiên (nếu có)
    const prescriptionItems = appointment.prescriptions?.[0]?.items || [];

    return (
        <ScrollView style={styles.container}>

            {/* 1. THÔNG TIN CHUNG */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.headerRow}>
                        <MaterialCommunityIcons name="hospital-building" size={24} color={theme.colors.primary} />
                        <View style={{ marginLeft: 12 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{appointment.branch?.name}</Text>
                            <Text variant="bodySmall" style={{ color: '#666' }}>{appointment.branch?.address}</Text>
                        </View>
                    </View>
                    <Divider style={{ marginVertical: 12 }} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày khám:</Text>
                        <Text style={styles.value}>{dayjs(appointment.start_time).format('DD/MM/YYYY HH:mm')}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bác sĩ:</Text>
                        <Text style={styles.value}>{appointment.doctor?.user?.full_name}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* 2. CHỈ SỐ SINH TỒN (Giống Web) */}
            {record && (
                <View style={styles.vitalContainer}>
                    <Card style={styles.vitalCard}>
                        <Card.Content style={styles.vitalContent}>
                            <MaterialCommunityIcons name="heart-pulse" size={24} color="#e91e63" />
                            <Text style={styles.vitalValue}>{record.heart_rate || '--'}</Text>
                            <Text style={styles.vitalLabel}>Mạch (l/p)</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.vitalCard}>
                        <Card.Content style={styles.vitalContent}>
                            <MaterialCommunityIcons name="thermometer" size={24} color="#ff9800" />
                            <Text style={styles.vitalValue}>{record.temperature || '--'}°C</Text>
                            <Text style={styles.vitalLabel}>Nhiệt độ</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.vitalCard}>
                        <Card.Content style={styles.vitalContent}>
                            <MaterialCommunityIcons name="water-percent" size={24} color="#2196f3" />
                            <Text style={styles.vitalValue}>{record.blood_pressure || '--'}</Text>
                            <Text style={styles.vitalLabel}>Huyết áp</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.vitalCard}>
                        <Card.Content style={styles.vitalContent}>
                            <MaterialCommunityIcons name="scale-bathroom" size={24} color="#4caf50" />
                            <Text style={styles.vitalValue}>{record.weight || '--'} kg</Text>
                            <Text style={styles.vitalLabel}>Cân nặng</Text>
                        </Card.Content>
                    </Card>
                </View>
            )}

            {/* 3. CHẨN ĐOÁN & TRIỆU CHỨNG */}
            <Card style={styles.card}>
                <Card.Title title="Kết quả khám lâm sàng" titleStyle={styles.sectionTitle} />
                <Card.Content>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={styles.subLabel}>Triệu chứng / Lý do khám:</Text>
                        <Text style={styles.textData}>{record?.symptoms || appointment.notes || 'Không ghi nhận'}</Text>
                    </View>
                    <View>
                        <Text style={styles.subLabel}>Chẩn đoán của bác sĩ:</Text>
                        <Text style={[styles.textData, { fontWeight: 'bold', color: theme.colors.primary }]}>
                            {record?.diagnosis || 'Chưa có kết luận'}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            {/* 4. ĐƠN THUỐC */}
            {prescriptionItems.length > 0 && (
                <Card style={styles.card}>
                    <Card.Title title="Đơn thuốc & Chỉ định" titleStyle={styles.sectionTitle} />
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={{ flex: 2 }}>Tên thuốc</DataTable.Title>
                            <DataTable.Title numeric>SL</DataTable.Title>
                            <DataTable.Title style={{ flex: 2 }}>Cách dùng</DataTable.Title>
                        </DataTable.Header>

                        {prescriptionItems.map((item: any, index: number) => (
                            <DataTable.Row key={index}>
                                <DataTable.Cell style={{ flex: 2 }}>
                                    <View style={{ paddingVertical: 8 }}>
                                        <Text style={{ fontWeight: 'bold' }}>{item.medication?.name}</Text>
                                        <Text style={{ fontSize: 11, color: '#666' }}>{item.dosage}</Text>
                                    </View>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                                <DataTable.Cell style={{ flex: 2 }}>
                                    <Text style={{ fontSize: 12 }}>{item.frequency}</Text>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                </Card>
            )}

            {/* 5. LỜI DẶN */}
            {record?.note && (
                <Card style={styles.card}>
                    <Card.Title title="Lời dặn của bác sĩ" titleStyle={styles.sectionTitle} />
                    <Card.Content>
                        <Text style={{ fontStyle: 'italic', color: '#444' }}>{record.note}</Text>
                    </Card.Content>
                </Card>
            )}

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { marginBottom: 12, backgroundColor: 'white', borderRadius: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    row: { flexDirection: 'row', marginBottom: 6 },
    label: { width: 90, color: '#666' },
    value: { flex: 1, fontWeight: '500' },

    // Vital Signs Grid
    vitalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
    vitalCard: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    vitalContent: { alignItems: 'center', padding: 0 },
    vitalValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    vitalLabel: { fontSize: 10, color: '#666' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
    subLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    textData: { fontSize: 15, color: '#333' }
});