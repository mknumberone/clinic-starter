import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Card, Text, Divider, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { prescriptionService } from '../services/prescription.service';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function InvoiceDetailScreen({ route }: any) {
    const { id } = route.params;
    const theme = useTheme();

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => prescriptionService.getInvoiceById(id),
    });

    if (isLoading) return <View style={styles.center}><ActivityIndicator /></View>;
    if (!invoice) return <View style={styles.center}><Text>Lỗi tải hóa đơn</Text></View>;

    // Tạo link QR VietQR
    const bankId = 'MB';
    const accountNo = '0988888888';
    const accountName = 'PHONG KHAM';
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${invoice.total_amount}&addInfo=TT ${invoice.id.slice(0, 8)}&accountName=${encodeURIComponent(accountName)}`;

    return (
        <ScrollView style={styles.container}>
            {/* TRẠNG THÁI */}
            <Card style={[styles.card, { borderLeftWidth: 5, borderLeftColor: invoice.status === 'PAID' ? 'green' : 'red' }]}>
                <Card.Content style={{ alignItems: 'center' }}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: invoice.status === 'PAID' ? 'green' : 'red' }}>
                        {Number(invoice.total_amount).toLocaleString()} ₫
                    </Text>
                    <Text style={{ marginTop: 4, color: '#666' }}>
                        {invoice.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                    </Text>
                </Card.Content>
            </Card>

            {/* MÃ QR (Chỉ hiện khi chưa thanh toán) */}
            {invoice.status === 'UNPAID' && (
                <Card style={styles.card}>
                    <Card.Title title="Quét mã để thanh toán" />
                    <Card.Content style={{ alignItems: 'center' }}>
                        <Image
                            source={{ uri: qrUrl }}
                            style={{ width: SCREEN_WIDTH - 100, height: SCREEN_WIDTH - 100 }}
                            resizeMode="contain"
                        />
                        <Text style={{ marginTop: 12, textAlign: 'center', color: '#666' }}>
                            Ngân hàng MB Bank{'\n'}STK: {accountNo}
                        </Text>
                    </Card.Content>
                </Card>
            )}

            {/* CHI TIẾT DỊCH VỤ */}
            <Card style={styles.card}>
                <Card.Title title="Chi tiết dịch vụ" />
                <Card.Content>
                    {invoice.items.map((item: any, index: number) => (
                        <View key={index}>
                            <View style={styles.itemRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{item.description}</Text>
                                    <Text style={{ fontSize: 12, color: '#666' }}>SL: {item.quantity}</Text>
                                </View>
                                <Text>{Number(item.amount).toLocaleString()} ₫</Text>
                            </View>
                            {index < invoice.items.length - 1 && <Divider style={{ marginVertical: 8 }} />}
                        </View>
                    ))}
                    <Divider style={{ marginVertical: 12, height: 2 }} />
                    <View style={styles.totalRow}>
                        <Text variant="titleMedium">Tổng cộng:</Text>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            {Number(invoice.total_amount).toLocaleString()} ₫
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { marginBottom: 16, backgroundColor: 'white', borderRadius: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});