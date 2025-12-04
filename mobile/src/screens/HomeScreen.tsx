import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Avatar, useTheme, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Lấy chiều rộng màn hình để tính toán tỷ lệ banner/nút
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  // --- DỮ LIỆU GIẢ LẬP (MOCK DATA) ---
  // Vì trong authStore chưa có ngày sinh/giới tính, tôi để tạm giống ảnh mẫu.
  // Sau này bạn cần update Backend để trả về field này.
  const mockUserData = {
    dob: '18/12/2003',
    gender: 'Nam',
  };

  // Danh sách các nút chức năng
  const menuItems = [
    {
      id: 1,
      title: 'Chiều cao\nCân nặng',
      icon: 'chart-line-variant',
      screen: null, // Chưa có màn này
      color: '#2196F3',
    },
    {
      id: 2,
      title: 'Hồ sơ\nbệnh án',
      icon: 'file-document-outline',
      screen: 'MedicalRecords', // Link tạm sang Đơn thuốc
      color: '#1565C0',
    },
    {
      id: 3,
      title: 'Đặt lịch khám\ndịch vụ',
      icon: 'calendar-clock',
      screen: 'Booking', // Link sang Lịch khám
      color: '#0277BD',
    },
    {
      id: 4,
      title: 'Gia đình',
      icon: 'account-group-outline',
      screen: null, // Chưa có màn này
      color: '#00838F',
    },
  ];

  const handleNavigation = (screenName: string | null) => {
    if (screenName) {
      navigation.navigate(screenName);
    } else {
      console.log('Tính năng đang phát triển');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 1. HEADER LOGO & BRAND */}
        <View style={styles.headerBrand}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#1a237e' }}>DYM</Text>
            <View style={{ marginLeft: 8 }}>
              <Text variant="labelSmall" style={{ color: '#666' }}>Medical Center Vietnam</Text>
            </View>
          </View>
        </View>

        {/* 2. USER CARD INFO */}
        <View style={styles.userCard}>
          {/* Top Section: Avatar + Name */}
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

          {/* Bottom Section: DOB + Gender */}
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

        {/* 3. MENU GRID (4 BUTTONS) */}
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => handleNavigation(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={[styles.gridTitle, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. PROMOTION BANNER */}
        <View style={styles.bannerContainer}>
          {/* Dùng ảnh mẫu từ internet vì chưa có file local */}
          <Image
            source={{ uri: 'https://img.freepik.com/free-vector/flat-design-medical-webinar-template_23-2149630460.jpg' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

      </ScrollView>

      {/* 5. FLOATING CHAT BUTTON */}
      <FAB
        icon="message-text-outline"
        style={styles.fab}
        onPress={() => console.log('Open Chat')}
        color="white"
        theme={{ colors: { primary: theme.colors.primary } }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Nền trắng sạch
  },
  scrollContent: {
    paddingBottom: 80, // Để không bị nút FAB che mất nội dung cuối
  },

  // Header Brand
  headerBrand: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },

  // User Card (Blue Card)
  userCard: {
    backgroundColor: '#2196F3', // Màu xanh dương chủ đạo (giống ảnh)
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

  // Grid Menu
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  gridItem: {
    width: (width - 44) / 2, // Chia đôi màn hình trừ padding
    backgroundColor: '#E3F2FD', // Nền xanh nhạt
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

  // Banner
  bannerContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2', // Xanh đậm hơn chút cho nút chat
    borderRadius: 30,
  },
});