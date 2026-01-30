import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Avatar, useTheme, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  // Dữ liệu giả lập
  const mockUserData = {
    dob: '18/12/2003',
    gender: 'Nam',
  };

  // --- CẤU HÌNH MENU ---
  const menuItems = [
    {
      id: 1,
      title: 'Chiều cao\nCân nặng',
      icon: 'chart-line-variant',
      screen: null, // Chưa có -> Sẽ hiện Alert
      color: '#2196F3',
    },
    {
      id: 2,
      title: 'Hồ sơ\nbệnh án',
      icon: 'file-document-outline',
      screen: 'MedicalRecords', // Link sang màn Hồ sơ
      color: '#1565C0',
    },
    {
      id: 3,
      title: 'Đặt lịch khám\ndịch vụ',
      icon: 'calendar-clock',
      screen: 'Booking', // Link sang màn Đặt lịch
      color: '#0277BD',
    },
    {
      id: 4,
      title: 'Gia đình',
      icon: 'account-group-outline',
      screen: null, // Chưa có -> Sẽ hiện Alert
      color: '#00838F',
    },
  ];

  // --- XỬ LÝ KHI BẤM MENU ---
  const handleMenuPress = (screenName: string | null, title: string) => {
    if (screenName) {
      // Nếu có tên màn hình -> Chuyển hướng
      navigation.navigate(screenName);
    } else {
      // Nếu chưa có -> Hiện thông báo
      Alert.alert("Thông báo", `Chức năng "${title.replace('\n', ' ')}" đang được phát triển.`);
    }
  };

  // --- XỬ LÝ KHI BẤM LIVE CHAT ---
  const handleOpenChat = () => {
    // Chuyển hướng sang màn hình Chat đã tạo
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 1. HEADER BRAND */}
        <View style={styles.headerBrand}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#1a237e' }}>DYM</Text>
            <View style={{ marginLeft: 8 }}>
              <Text variant="labelSmall" style={{ color: '#666' }}>Medical Center Vietnam</Text>
            </View>
          </View>
        </View>

        {/* 2. USER CARD */}
        <View style={styles.userCard}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarWrapper}>
              <Avatar.Icon size={50} icon="account" style={{ backgroundColor: '#cfd8dc' }} color="#455a64" />
            </View>
            <View style={styles.userTextView}>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text variant="titleLarge" style={styles.userNameText}>
                {user?.full_name || 'Khách'}
              </Text>
            </View>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.userDetailRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color="white" />
              <Text style={styles.detailText}>{mockUserData.dob}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-outline" size={20} color="white" />
              <Text style={styles.detailText}>{mockUserData.gender}</Text>
            </View>
          </View>
        </View>

        {/* 3. MENU GRID (SỬA LẠI ONPRESS Ở ĐÂY) */}
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => handleMenuPress(item.screen, item.title)} // Gọi hàm xử lý menu
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={[styles.gridTitle, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. BANNER */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/flat-design-medical-webinar-template_23-2149630460.jpg' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

      </ScrollView>

      {/* 5. NÚT LIVE CHAT (SỬA LẠI ONPRESS Ở ĐÂY) */}
      <FAB
        icon="message-text-outline"
        label="Hỗ trợ"
        style={styles.fab}
        onPress={handleOpenChat} // Gọi hàm mở chat riêng
        color="white"
        theme={{ colors: { primary: theme.colors.primary } }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 100, // Tăng padding bottom để không bị nút Chat che
  },
  headerBrand: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userCard: {
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
  },
  userTextView: {
    marginLeft: 16,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  userNameText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  userDetailRow: {
    flexDirection: 'row',
    gap: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  gridItem: {
    width: (width - 44) / 2,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    height: 100,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2',
    borderRadius: 30,
  },
});