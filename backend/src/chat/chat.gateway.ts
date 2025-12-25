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
        // Client tham gia phòng có tên "conversation_ID"
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

            // Lưu tin nhắn vào DB
            const message = await this.chatService.saveMessage(
                payload.conversationId,
                senderId,
                payload.content,
                payload.type || 'TEXT'
            );

            // --- SỬA LẠI DÒNG NÀY (QUAN TRỌNG NHẤT) ---
            // Phải thêm tiền tố 'conversation_' để khớp với lúc joinRoom
            this.server.to(`conversation_${payload.conversationId}`).emit('newMessage', message);

        } catch (error) {
            console.error("Lỗi gửi tin nhắn (Socket):", error);
            client.emit('error', { message: 'Gửi tin nhắn thất bại' });
        }
    }
}