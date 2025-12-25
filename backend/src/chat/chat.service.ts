import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(conversationId: string, senderId: string, content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
        return this.prisma.message.create({
            data: {
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                type: type, // Lưu loại tin nhắn
                is_read: false,
            },
            include: {
                sender: { select: { id: true, full_name: true, avatar: true } },
            },
        });
    }

    async getMessages(conversationId: string) {
        return this.prisma.message.findMany({
            where: { conversation_id: conversationId },
            include: {
                sender: { select: { id: true, full_name: true, avatar: true } },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    async getOrCreateConversation(userA: string, userB: string) {
        const existing = await this.prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { user_id: userA } } },
                    { participants: { some: { user_id: userB } } },
                ],
            },
            include: { participants: { include: { user: true } } }
        });

        if (existing) return existing;

        const uniqueIds = Array.from(new Set([userA, userB]));
        return this.prisma.conversation.create({
            data: {
                participants: {
                    create: uniqueIds.map((id) => ({ user_id: id })),
                },
            },
            include: { participants: { include: { user: true } } }
        });
    }

    // --- CẬP NHẬT HÀM NÀY ---
    async getAllConversations(currentUserId: string, role: string) {

        // Logic lọc:
        // 1. Nếu là PATIENT (Bệnh nhân): Chỉ xem hội thoại của chính mình.
        // 2. Nếu là ADMIN, BRANCH_MANAGER, RECEPTIONIST: Xem ĐƯỢC TẤT CẢ hội thoại.

        const isAdminOrStaff = ['ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'].includes(role);

        const whereCondition = isAdminOrStaff
            ? {} // Nếu là nhân viên -> Không lọc (lấy hết)
            : { participants: { some: { user_id: currentUserId } } }; // Nếu là khách -> Lọc theo ID

        const conversations = await this.prisma.conversation.findMany({
            where: whereCondition,
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, full_name: true, avatar: true, role: true } }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: { created_at: 'desc' }
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                is_read: false,
                                sender_id: { not: currentUserId }
                            }
                        }
                    }
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        return conversations.map(c => ({
            ...c,
            unread_count: c._count.messages
        }));
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
}