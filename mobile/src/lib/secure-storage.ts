import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type StorageValue = string | null;

const isWeb = Platform.OS === 'web';
const hasLocalStorage = typeof window !== 'undefined' && !!window.localStorage;

const webStorage = {
    async getItemAsync(key: string): Promise<StorageValue> {
        if (!hasLocalStorage) return null;
        return window.localStorage.getItem(key);
    },
    async setItemAsync(key: string, value: string): Promise<void> {
        if (!hasLocalStorage) return;
        window.localStorage.setItem(key, value);
    },
    async deleteItemAsync(key: string): Promise<void> {
        if (!hasLocalStorage) return;
        window.localStorage.removeItem(key);
    },
};

export const secureStorage = {
    async getItem(key: string): Promise<StorageValue> {
        if (isWeb) {
            return webStorage.getItemAsync(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        if (isWeb) {
            return webStorage.setItemAsync(key, value);
        }
        return SecureStore.setItemAsync(key, value);
    },
    async deleteItem(key: string): Promise<void> {
        if (isWeb) {
            return webStorage.deleteItemAsync(key);
        }
        return SecureStore.deleteItemAsync(key);
    },
};

