import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper'; // Dùng theme MD3 cho đẹp
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from './src/stores/authStore';

// --- IMPORT CÁC MÀN HÌNH ---
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Màn hình mới (Đơn thuốc & Hóa đơn)
import PrescriptionsScreen from './src/screens/PrescriptionsScreen';
import PrescriptionDetailScreen from './src/screens/PrescriptionDetailScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import InvoiceDetailScreen from './src/screens/InvoiceDetailScreen';

import BookingScreen from './src/screens/BookingScreen';
import MedicalRecordsScreen from './src/screens/MedicalRecordsScreen';
import MedicalRecordDetailScreen from './src/screens/MedicalRecordDetailScreen';

import ChatScreen from './src/screens/ChatScreen'; // <--- IMPORT MỚI
import { useSocketStore } from './src/stores/socketStore'; // <--- IMPORT SOCKET STORE

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Cấu hình Theme (Tuỳ chọn màu sắc)
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3', // Màu xanh chủ đạo của App
    secondary: '#03A9F4',
  },
};

// --- CẤU HÌNH MENU DƯỚI (BOTTOM TABS) ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, // Hiện header tên màn hình
        headerStyle: { backgroundColor: '#2196F3' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        // Cấu hình icon cho từng Tab
        tabBarIcon: ({ color, size }) => {
          let iconName: any;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Appointments') iconName = 'calendar-clock';
          else if (route.name === 'Prescriptions') iconName = 'pill'; // Icon thuốc
          else if (route.name === 'Invoices') iconName = 'receipt'; // Icon hóa đơn
          else if (route.name === 'Profile') iconName = 'account';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ title: 'Lịch khám' }}
      />

      {/* ---> THÊM TAB ĐƠN THUỐC <--- */}
      <Tab.Screen
        name="Prescriptions"
        component={PrescriptionsScreen}
        options={{ title: 'Đơn thuốc' }}
      />

      {/* ---> THÊM TAB HÓA ĐƠN <--- */}
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ title: 'Hóa đơn' }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}

// --- CẤU HÌNH ĐIỀU HƯỚNG CHÍNH (STACK) ---
function AppNavigator() {
  const { isAuthenticated, isLoading, loadAuthData, token } = useAuthStore();
  const { connect, disconnect } = useSocketStore(); // <--- SOCKET HOOKS

  useEffect(() => {
    loadAuthData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
    } else {
      disconnect();
    }
  }, [isAuthenticated, token]);

  if (isLoading) {
    return null; // Hoặc thêm màn hình Splash/Loading
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!isAuthenticated ? (
          // Stack khi CHƯA đăng nhập
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Stack khi ĐÃ đăng nhập
          <>
            {/* Màn hình chính (Tabs) */}
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            {/* ---> CÁC MÀN HÌNH CHI TIẾT (Nằm đè lên Tabs) <--- */}

            <Stack.Screen
              name="PrescriptionDetail"
              component={PrescriptionDetailScreen}
              options={{ title: 'Chi tiết Đơn thuốc' }}
            />

            <Stack.Screen
              name="InvoiceDetail"
              component={InvoiceDetailScreen}
              options={{ title: 'Chi tiết Hóa đơn & Thanh toán' }}
            />

            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Hỗ trợ trực tuyến' }}
            />

            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ title: 'Đặt lịch khám bệnh' }}
            />
            <Stack.Screen
              name="MedicalRecords"
              component={MedicalRecordsScreen}
              options={{ title: 'Hồ sơ bệnh án' }}
            />

            <Stack.Screen
              name="MedicalRecordDetail"
              component={MedicalRecordDetailScreen}
              options={{ title: 'Chi tiết hồ sơ' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- APP ROOT ---
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </QueryClientProvider>
  );
}