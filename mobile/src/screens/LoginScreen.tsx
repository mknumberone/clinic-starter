import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import { testConnection } from '../lib/api-test';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Test connection khi component mount
  useEffect(() => {
    console.log('🚀 LoginScreen mounted');
    testConnection().then((success) => {
      if (success) {
        console.log('✅ Backend connection OK');
      } else {
        console.log('❌ Backend connection FAILED');
      }
    });
  }, []);

  const sendOtpMutation = useMutation({
    mutationFn: authService.sendOtp,
    onSuccess: () => {
      setOtpSent(true);
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      await login(data.token, data.user as any);
    },
  });

  const handleSendOtp = () => {
    if (!phone.trim()) return;
    sendOtpMutation.mutate({ phone: phone.trim() });
  };

  const handleLogin = () => {
    if (!phone.trim() || !otp.trim()) return;
    loginMutation.mutate({ phone: phone.trim(), otp: otp.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.card} elevation={4}>
          <Text variant="headlineMedium" style={styles.title}>
            Đăng nhập
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Nhập số điện thoại để nhận mã OTP
          </Text>

          <TextInput
            label="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            disabled={otpSent}
            style={styles.input}
            mode="outlined"
          />

          {otpSent && (
            <TextInput
              label="Mã OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              mode="outlined"
            />
          )}

          {sendOtpMutation.error && (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {(sendOtpMutation.error as any)?.response?.data?.message || 'Gửi OTP thất bại'}
            </Text>
          )}

          {loginMutation.error && (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {(loginMutation.error as any)?.response?.data?.message || 'Đăng nhập thất bại'}
            </Text>
          )}

          {!otpSent ? (
            <Button
              mode="contained"
              onPress={handleSendOtp}
              loading={sendOtpMutation.isPending}
              disabled={sendOtpMutation.isPending || !phone.trim()}
              style={styles.button}
            >
              Gửi mã OTP
            </Button>
          ) : (
            <View>
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending || !otp.trim()}
                style={styles.button}
              >
                Đăng nhập
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                style={styles.backButton}
              >
                Quay lại
              </Button>
            </View>
          )}
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 24,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
  error: {
    marginBottom: 12,
    textAlign: 'center',
  },
});
