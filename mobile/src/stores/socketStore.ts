// src/stores/socketStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Lấy IP từ file axios.ts của bạn (cắt bỏ /api ở cuối)
const SOCKET_URL = 'http://192.168.100.248:3000';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (token: string) => {
        if (get().socket?.connected) return;

        console.log('🔌 Connecting to Socket:', SOCKET_URL);

        const newSocket = io(SOCKET_URL, {
            auth: { token: `Bearer ${token}` },
            transports: ['websocket'], // Quan trọng cho React Native
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket Connected:', newSocket.id);
            set({ isConnected: true });
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket Disconnected');
            set({ isConnected: false });
        });

        newSocket.on('connect_error', (err) => {
            console.error('⚠️ Socket Connection Error:', err);
        });

        set({ socket: newSocket });
    },

    disconnect: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },
}));