import { Controller, Get, Post, Put, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path'; // <--- THÊM DÒNG NÀY (Quan trọng)

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('start-support')
    async startSupportConversation(@Request() req) {
        const userId = req.user.id;
        // Tạm thời vẫn để chat với chính mình để test luồng gửi tin
        // Nhưng Admin sẽ nhìn thấy được nhờ sửa đổi ở dưới
        const supportId = userId;
        return this.chatService.getOrCreateConversation(userId, supportId);
    }

    @Get('messages')
    async getMessages(@Query('conversationId') conversationId: string) {
        return this.chatService.getMessages(conversationId);
    }

    // --- CẬP NHẬT API NÀY ---
    @Get('conversations')
    async getAllConversations(@Request() req) {
        // Truyền cả ID và ROLE vào service
        return this.chatService.getAllConversations(req.user.id, req.user.role);
    }

    @Put('read/:conversationId')
    async markAsRead(@Request() req, @Param('conversationId') conversationId: string) {
        return this.chatService.markAsRead(conversationId, req.user.id);
    }

    // --- API UPLOAD SỬA LẠI ---
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/chat', // Đảm bảo bạn đã tạo thư mục này ở thư mục gốc của backend
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                // Sử dụng extname được import từ 'path'
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('File upload failed');
        }
        // Trả về filename để Frontend lưu vào DB
        return { filename: file.filename, originalName: file.originalname };
    }
}


