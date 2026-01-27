// File: src/chat/chat.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // 1. Lưu tin nhắn & Cập nhật thời gian hội thoại (Dùng Transaction)
    async saveMessage(conversationId: string, senderId: string, content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
        return this.prisma.$transaction(async (tx) => {
            // A. Tạo tin nhắn mới
            const message = await tx.message.create({
                data: {
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content: content,
                    type: type,
                    is_read: false,
                },
                include: {
                    sender: { select: { id: true, full_name: true, avatar: true } },
                },
            });

            // B. [QUAN TRỌNG] Update 'updated_at' của Conversation để nó nhảy lên đầu danh sách
            await tx.conversation.update({
                where: { id: conversationId },
                data: { updated_at: new Date() }
            });

            return message;
        });
    }

    // 2. Lấy danh sách hội thoại (Có Tìm kiếm & Sắp xếp)
    async getAllConversations(currentUserId: string, role: string, search?: string) {
        // Phân quyền: Admin/Staff thấy hết, User thường chỉ thấy của mình
        const isAdminOrStaff = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BRANCH_MANAGER'].includes(role);

        let whereCondition: any = {};

        // Nếu không phải Admin/Staff, bắt buộc lọc theo user đang đăng nhập
        if (!isAdminOrStaff) {
            whereCondition = {
                participants: { some: { user_id: currentUserId } }
            };
        }

        // Logic Tìm kiếm: Lọc các hội thoại có thành viên tên chứa từ khóa (không phân biệt hoa thường)
        if (search && search.trim() !== '') {
            whereCondition = {
                ...whereCondition, // Giữ lại điều kiện phân quyền (nếu có)
                participants: {
                    some: {
                        user: {
                            full_name: { contains: search, mode: 'insensitive' },
                            // Có thể thêm điều kiện loại trừ chính mình nếu muốn:
                            // id: { not: currentUserId } 
                        }
                    }
                }
            };
        }

        // Query Database
        const conversations = await this.prisma.conversation.findMany({
            where: whereCondition,
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, full_name: true, avatar: true, role: true } }
                    }
                },
                messages: {
                    take: 1, // Chỉ lấy 1 tin nhắn cuối cùng để hiển thị preview
                    orderBy: { created_at: 'desc' }
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                is_read: false,
                                sender_id: { not: currentUserId } // Đếm tin chưa đọc từ người khác
                            }
                        }
                    }
                }
            },
            // [QUAN TRỌNG] Sắp xếp theo thời gian cập nhật mới nhất (tin nhắn mới nhất)
            orderBy: { updated_at: 'desc' }
        });

        // Map dữ liệu để Frontend dễ dùng
        return conversations.map(c => ({
            ...c,
            last_message: c.messages[0] || null, // Tin nhắn cuối
            unread_count: c._count.messages      // Số tin chưa đọc
        }));
    }

    // 3. Các hàm phụ trợ khác (Giữ nguyên hoặc tối ưu nhẹ)
    async getMessages(conversationId: string) {
        return this.prisma.message.findMany({
            where: { conversation_id: conversationId },
            include: {
                sender: { select: { id: true, full_name: true, avatar: true } },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    async markAsRead(conversationId: string, userId: string) {
        await this.prisma.message.updateMany({
            where: {
                conversation_id: conversationId,
                sender_id: { not: userId },
                is_read: false
            },
            data: { is_read: true }
        });
        return { success: true };
    }

    async getOrCreateConversation(userA: string, userB: string) {
        const existing = await this.prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { user_id: userA } } },
                    { participants: { some: { user_id: userB } } },
                ]
            }
        });

        if (existing) {
            // Nếu đã có, update lại thời gian để nó nổi lên đầu
            await this.prisma.conversation.update({
                where: { id: existing.id },
                data: { updated_at: new Date() }
            });
            return existing;
        }

        return this.prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { user_id: userA },
                        { user_id: userB }
                    ]
                }
            }
        });
    }
}