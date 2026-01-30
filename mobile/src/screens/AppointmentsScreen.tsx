import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import dayjs from 'dayjs';

export default function AppointmentsScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: appointmentService.getMyAppointments,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4caf50';
      case 'PENDING':
        return '#ff9800';
      case 'CANCELLED':
        return '#f44336';
      case 'COMPLETED':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {!data?.data || data.data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Chưa có lịch khám nào
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {data.data.map((apt) => (
            <Card key={apt.id} style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                    {dayjs(apt.start_time).format('DD/MM/YYYY')}
                  </Text>
                  <Chip
                    style={{ backgroundColor: getStatusColor(apt.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(apt.status)}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Bác sĩ:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {apt.doctor?.user.full_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Chức danh:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {apt.doctor?.title}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Giờ khám:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {dayjs(apt.start_time).format('HH:mm')} -{' '}
                    {dayjs(apt.end_time).format('HH:mm')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Phòng:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {apt.room?.name} ({apt.room?.code})
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Loại khám:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {apt.appointment_type}
                  </Text>
                </View>

                {apt.notes && (
                  <View style={styles.notesContainer}>
                    <Text variant="bodySmall" style={styles.label}>
                      Ghi chú:
                    </Text>
                    <Text variant="bodyMedium" style={styles.notes}>
                      {apt.notes}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 100,
    opacity: 0.7,
  },
  value: {
    flex: 1,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 4,
  },
  notes: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    opacity: 0.5,
  },
});
