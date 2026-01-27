// File: src/chat/chat.gateway.ts

import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) throw new Error('No token');

            const cleanToken = token.replace('Bearer ', '');
            const payload = this.jwtService.verify(cleanToken, { secret: process.env.JWT_SECRET });

            client.data.user = payload;

            // Join vào phòng riêng của User (để nhận noti cá nhân nếu cần)
            client.join(`user_${payload.sub}`);
            console.log(`User connected: ${payload.sub}`);
        } catch (e) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        // Join vào phòng của cuộc hội thoại cụ thể
        client.join(`conversation_${conversationId}`);
        console.log(`User joined room conversation_${conversationId}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@MessageBody() payload: { conversationId: string, content: string, type?: 'TEXT' | 'IMAGE' | 'FILE' }, @ConnectedSocket() client: Socket) {
        try {
            const senderId = client.data.user.sub || client.data.user.id;

            if (!senderId) {
                throw new Error("User ID not found in socket connection");
            }

            // 1. Lưu tin nhắn vào DB (Service đã tự động update 'updated_at' cho Conversation)
            const message = await this.chatService.saveMessage(
                payload.conversationId,
                senderId,
                payload.content,
                payload.type || 'TEXT'
            );

            // 2. Gửi sự kiện 'newMessage' cho các client đang mở khung chat này (để hiện tin nhắn)
            this.server.to(`conversation_${payload.conversationId}`).emit('newMessage', message);

            // 3. [MỚI] Gửi sự kiện 'conversationUpdated' để client cập nhật danh sách hội thoại bên ngoài (sidebar)
            // Sự kiện này chứa info tin nhắn cuối để frontend update UI realtime mà không cần gọi lại API list
            this.server.to(`conversation_${payload.conversationId}`).emit('conversationUpdated', {
                conversationId: payload.conversationId,
                lastMessage: message,
                updatedAt: new Date()
            });

        } catch (error) {
            console.error("Lỗi gửi tin nhắn (Socket):", error);
            client.emit('error', { message: 'Không thể gửi tin nhắn' });
        }
    }
}