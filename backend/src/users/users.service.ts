import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: { role?: UserRole; branch_id?: string }) {
        const { role, branch_id } = params;

        return this.prisma.user.findMany({
            where: {
                role: role,          // Lọc theo vai trò (VD: RECEPTIONIST)
                branch_id: branch_id, // Lọc theo chi nhánh (nếu có)
                is_active: true,     // Chỉ lấy nhân viên đang hoạt động
            },
            // QUAN TRỌNG: Chỉ chọn các trường cần thiết, KHÔNG trả về password
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                branch_id: true,
            },
        });
    }
}