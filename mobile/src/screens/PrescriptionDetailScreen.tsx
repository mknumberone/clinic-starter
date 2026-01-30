import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Divider, DataTable, useTheme, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { prescriptionService } from '../services/prescription.service';
import dayjs from 'dayjs';

export default function PrescriptionDetailScreen({ route }: any) {
    const { id } = route.params;
    const theme = useTheme();

    const { data: prescription, isLoading } = useQuery({
        queryKey: ['prescription', id],
        queryFn: () => prescriptionService.getPrescriptionById(id),
    });

    if (isLoading) return <View style={styles.center}><ActivityIndicator /></View>;
    if (!prescription) return <View style={styles.center}><Text>Không tìm thấy đơn thuốc</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Thông tin chung" titleStyle={{ fontWeight: 'bold' }} />
                <Card.Content>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bác sĩ:</Text>
                        <Text style={styles.value}>{prescription.doctor?.user?.full_name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ngày kê:</Text>
                        <Text style={styles.value}>{dayjs(prescription.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lời dặn:</Text>
                        <Text style={styles.value}>{prescription.notes || 'Không có'}</Text>
                    </View>
                </Card.Content>
            </Card>

            <Text variant="titleLarge" style={styles.sectionTitle}>Danh sách thuốc</Text>

            {prescription.items?.map((item: any, index: number) => (
                <Card key={index} style={styles.medicineCard}>
                    <Card.Content>
                        <View style={styles.medHeader}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                {index + 1}. {item.name}
                            </Text>
                            {!item.medication_id && (
                                <Text style={{ color: 'orange', fontSize: 12, fontWeight: 'bold' }}>Tự mua</Text>
                            )}
                        </View>
                        <Divider style={{ marginVertical: 8 }} />
                        <View style={styles.medDetail}>
                            <Text>Số lượng: <Text style={{ fontWeight: 'bold' }}>{item.quantity}</Text></Text>
                            <Text>Liều dùng: {item.dosage}</Text>
                            <Text>Cách dùng: {item.frequency}</Text>
                        </View>
                    </Card.Content>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { marginBottom: 16, backgroundColor: 'white' },
    sectionTitle: { marginVertical: 12, fontWeight: 'bold', color: '#333' },
    medicineCard: { marginBottom: 12, backgroundColor: 'white' },
    row: { flexDirection: 'row', marginBottom: 8 },
    label: { width: 100, color: '#666' },
    value: { flex: 1, fontWeight: '500' },
    medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    medDetail: { gap: 4 },
});