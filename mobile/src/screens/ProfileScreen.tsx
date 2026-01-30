import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Avatar, Button, Divider } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.avatarContainer}>
            <Avatar.Icon size={80} icon="account" />
            <Text variant="headlineSmall" style={styles.name}>
              {user?.full_name}
            </Text>
            <Text variant="bodyMedium" style={styles.role}>
              Bệnh nhân
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Số điện thoại:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {user?.phone}
              </Text>
            </View>

            {user?.email && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Email:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {user.email}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Vai trò:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {user?.role}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Đăng xuất
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  name: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  role: {
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '500',
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
});
