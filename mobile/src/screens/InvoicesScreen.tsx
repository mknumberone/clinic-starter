import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { prescriptionService } from '../services/prescription.service';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';

export default function InvoicesScreen() {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['myInvoices', user?.patient_id || ''],
        queryFn: () => prescriptionService.getMyInvoices(user?.patient_id || ''),
        enabled: !!user?.patient_id,
    });

    const getStatusColor = (status: string) => {
        return status === 'PAID' ? '#4caf50' : status === 'UNPAID' ? '#f44336' : '#ff9800';
    };

    const getStatusText = (status: string) => {
        return status === 'PAID' ? 'Đã thanh toán' : status === 'UNPAID' ? 'Chưa thanh toán' : 'Một phần';
    };

    if (isLoading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
            <View style={styles.list}>
                {data?.map((invoice: any) => (
                    <TouchableOpacity
                        key={invoice.id}
                        onPress={() => navigation.navigate('InvoiceDetail', { id: invoice.id })}
                    >
                        <Card style={styles.card}>
                            <Card.Content>
                                <View style={styles.header}>
                                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                                        Hóa đơn #{invoice.id.slice(0, 8).toUpperCase()}
                                    </Text>
                                    <Chip
                                        textStyle={{ color: 'white', fontSize: 12 }}
                                        style={{ backgroundColor: getStatusColor(invoice.status), height: 28 }}
                                    >
                                        {getStatusText(invoice.status)}
                                    </Chip>
                                </View>
                                <View style={{ marginTop: 8 }}>
                                    <Text>Ngày: {dayjs(invoice.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                                    <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: 'bold', marginTop: 4 }}>
                                        {Number(invoice.total_amount).toLocaleString()} ₫
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { marginBottom: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});