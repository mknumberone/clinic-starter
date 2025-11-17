import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, useTheme, Avatar, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myAppointments'],
    queryFn: appointmentService.getMyAppointments,
  });

  const upcomingAppointments = data?.data
    ?.filter((apt) => dayjs(apt.start_time).isAfter(dayjs()))
    .sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)))
    .slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeContent}>
            <Avatar.Icon size={56} icon="account" />
            <View style={styles.welcomeText}>
              <Text variant="titleLarge">Xin chào!</Text>
              <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                {user?.full_name}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {data?.pagination?.total || 0}
            </Text>
            <Text variant="bodySmall">Tổng lượt khám</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>
              {upcomingAppointments?.length || 0}
            </Text>
            <Text variant="bodySmall">Lịch sắp tới</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Upcoming Appointments */}
      <Card style={styles.card}>
        <Card.Title title="Lịch khám sắp tới" titleVariant="titleLarge" />
        <Card.Content>
          {!upcomingAppointments || upcomingAppointments.length === 0 ? (
            <Text style={styles.emptyText}>Không có lịch khám sắp tới</Text>
          ) : (
            upcomingAppointments.map((apt, index) => (
              <View key={apt.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.appointmentItem}>
                  <View style={styles.appointmentDate}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                      {dayjs(apt.start_time).format('DD')}
                    </Text>
                    <Text variant="bodySmall">{dayjs(apt.start_time).format('MMM')}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {apt.doctor?.user.full_name}
                    </Text>
                    <Text variant="bodyMedium">{apt.doctor?.title}</Text>
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      {dayjs(apt.start_time).format('HH:mm')} - {dayjs(apt.end_time).format('HH:mm')}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      Phòng: {apt.room?.name}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  welcomeText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    paddingVertical: 24,
  },
  appointmentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 16,
  },
  appointmentDate: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  appointmentInfo: {
    flex: 1,
    gap: 4,
  },
  divider: {
    marginVertical: 8,
  },
});
