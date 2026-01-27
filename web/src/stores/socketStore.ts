import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
}

// Nếu backend chạy port khác 3000 thì sửa lại ở đây
const SOCKET_URL = 'http://localhost:3000';

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (token: string) => {
        // Nếu đã có socket và đang connect rồi với cùng token thì thôi
        const currentSocket = get().socket;
        if (currentSocket?.connected) {
            console.log('Socket already connected, skipping...');
            return;
        }

        // Disconnect socket cũ nếu có (nhưng chưa connected)
        if (currentSocket && !currentSocket.connected) {
            console.log('Disconnecting old socket that was not connected');
            currentSocket.disconnect();
        }

        console.log('🔌 Connecting to socket:', SOCKET_URL, 'with token:', token ? 'Token exists' : 'No token');
        
        // Backend có thể nhận token từ auth.token hoặc headers.authorization
        // Thử cả 2 cách để đảm bảo tương thích
        const newSocket = io(SOCKET_URL, {
            auth: { 
                token: token, // Gửi token thô (backend sẽ tự xử lý "Bearer " prefix)
            },
            extraHeaders: token ? {
                Authorization: `Bearer ${token}` // Cũng gửi qua header để đảm bảo
            } : {},
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnection: true,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            set({ socket: newSocket, isConnected: true });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            set({ isConnected: false });
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ Socket connection error:', error);
            set({ isConnected: false });
        });

        // Set socket vào store ngay lập tức (trước khi connect)
        // Điều này đảm bảo ChatWidget có thể thấy socket ngay
        set({ socket: newSocket, isConnected: false });
    },

    disconnect: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
        }
        set({ socket: null, isConnected: false });
    },
}));