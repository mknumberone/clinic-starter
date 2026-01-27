// File: src/chat/chat.controller.ts

import { Controller, Get, Post, Put, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('start-support')
    async startSupportConversation(@Request() req) {
        const userId = req.user.id;
        // Logic chat support: userId vs supportId (hoặc chính mình để test)
        const supportId = userId;
        return this.chatService.getOrCreateConversation(userId, supportId);
    }

    @Get('messages')
    async getMessages(@Query('conversationId') conversationId: string) {
        return this.chatService.getMessages(conversationId);
    }

    // --- [CẬP NHẬT] Thêm Query Search ---
    @Get('conversations')
    async getAllConversations(
        @Request() req,
        @Query('search') search?: string // Nhận từ khóa tìm kiếm
    ) {
        // Truyền search vào service
        return this.chatService.getAllConversations(req.user.id, req.user.role, search);
    }

    @Put('read/:conversationId')
    async markAsRead(@Request() req, @Param('conversationId') conversationId: string) {
        return this.chatService.markAsRead(conversationId, req.user.id);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/chat',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/chat/${file.filename}`,
            name: file.originalname,
            type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE'
        };
    }
}