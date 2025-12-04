import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { appointmentService } from '../services/appointment.service';
import dayjs from 'dayjs';

export default function MedicalRecordsScreen() {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['medicalRecords'],
        queryFn: appointmentService.getMyAppointments,
    });

    // Chỉ lấy các lịch đã hoàn thành (có kết quả khám)
    const completedRecords = data?.data?.filter((apt: any) => apt.status === 'COMPLETED') || [];

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
            {completedRecords.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={{ opacity: 0.5 }}>Chưa có hồ sơ bệnh án nào.</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {completedRecords.map((record: any) => (
                        <TouchableOpacity
                            key={record.id}
                            onPress={() => navigation.navigate('MedicalRecordDetail', { id: record.id })}
                        >
                            <Card style={styles.card}>
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.dateBox}>
                                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                            {dayjs(record.start_time).format('DD')}
                                        </Text>
                                        <Text variant="bodySmall">{dayjs(record.start_time).format('MM/YYYY')}</Text>
                                    </View>

                                    <View style={styles.infoBox}>
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Khám: {record.appointment_type || 'Tổng quát'}</Text>
                                        <Text variant="bodyMedium" style={{ color: '#666' }}>BS. {record.doctor?.user?.full_name}</Text>
                                        <Text variant="bodySmall" style={{ color: '#888', marginTop: 4 }} numberOfLines={1}>
                                            {record.branch?.name}
                                        </Text>
                                    </View>

                                    <Avatar.Icon size={32} icon="chevron-right" style={{ backgroundColor: 'transparent' }} color="#ccc" />
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { marginBottom: 12, backgroundColor: 'white' },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    dateBox: { alignItems: 'center', paddingRight: 16, borderRightWidth: 1, borderRightColor: '#eee' },
    infoBox: { flex: 1, paddingLeft: 16 },
    emptyContainer: { padding: 40, alignItems: 'center' }
});