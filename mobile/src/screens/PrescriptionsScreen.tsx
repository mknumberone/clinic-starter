import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { prescriptionService } from '../services/prescription.service';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';

export default function PrescriptionsScreen() {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myPrescriptions', user?.patient_id],
        queryFn: () => prescriptionService.getMyPrescriptions(user?.patient_id || ''),
        enabled: !!user?.patient_id,
    });

    if (isLoading && !data) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
            {!data || data.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text variant="bodyLarge">Bạn chưa có đơn thuốc nào.</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {data.map((prescription: any) => (
                        <TouchableOpacity
                            key={prescription.id}
                            onPress={() => navigation.navigate('PrescriptionDetail', { id: prescription.id })}
                        >
                            <Card style={styles.card}>
                                <Card.Content>
                                    <View style={styles.header}>
                                        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                            Đơn thuốc ngày {dayjs(prescription.created_at).format('DD/MM/YYYY')}
                                        </Text>
                                        <Chip icon="doctor" compact>{prescription.doctor?.user?.full_name}</Chip>
                                    </View>

                                    <View style={styles.content}>
                                        <Text numberOfLines={2} variant="bodyMedium" style={{ color: '#666' }}>
                                            {prescription.notes || 'Không có ghi chú'}
                                        </Text>
                                    </View>
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
    emptyContainer: { padding: 32, alignItems: 'center' },
    list: { padding: 16 },
    card: { marginBottom: 12, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    content: { marginTop: 4 },
});