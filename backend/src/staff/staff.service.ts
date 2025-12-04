import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async createStaff(creatorId: string, dto: CreateStaffDto) {
        // 1. Lấy thông tin người tạo (để check quyền và chi nhánh)
        const creator = await this.prisma.user.findUnique({ where: { id: creatorId } });
        if (!creator) throw new ForbiddenException('Người tạo không tồn tại');

        let targetBranchId = dto.branch_id;

        // 2. Logic Phân quyền
        if (creator.role === UserRole.BRANCH_MANAGER) {
            // Nếu là Manager:
            // - Chỉ được tạo Doctor/Receptionist
            if (dto.role === UserRole.ADMIN || dto.role === UserRole.BRANCH_MANAGER) {
                throw new ForbiddenException('Quản lý chỉ được tạo Bác sĩ hoặc Lễ tân');
            }
            // - Bắt buộc nhân viên mới phải cùng chi nhánh với Manager
            targetBranchId = creator.branch_id;
        } else if (creator.role === UserRole.ADMIN) {
            // Nếu là Admin: Phải gửi kèm branch_id
            if (!targetBranchId) {
                throw new BadRequestException('Admin phải chọn chi nhánh cho nhân viên');
            }
        } else {
            throw new ForbiddenException('Bạn không có quyền tạo nhân viên');
        }

        // 3. Kiểm tra trùng lặp (Email/Phone)
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existingUser) throw new BadRequestException('Email hoặc Số điện thoại đã tồn tại');

        // 4. Hash mật khẩu
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 5. Tạo User và Profile tương ứng (Transaction)
        return await this.prisma.$transaction(async (tx) => {
            // Tạo User
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    phone: dto.phone,
                    password_hash: hashedPassword,
                    full_name: dto.full_name,
                    role: dto.role,
                    branch_id: targetBranchId,
                },
            });

            // Nếu role là Bác sĩ -> Tạo thêm record trong bảng Doctor
            if (dto.role === UserRole.DOCTOR) {
                // Tạo mã bác sĩ tự động (Ví dụ: BS + 4 số cuối điện thoại)
                const code = `BS${dto.phone.slice(-4)}`;
                await tx.doctor.create({
                    data: {
                        user_id: newUser.id,
                        code: code,
                        title: 'Bác sĩ', // Mặc định
                    },
                });
            }

            // Nếu role là Admin/Manager/Receptionist -> Có thể tạo thêm StaffProfile nếu cần
            // (Tùy schema của bạn, hiện tại bảng User đủ dùng cho Lễ tân)

            return newUser;
        });
    }

    // Lấy danh sách nhân viên (Filter theo chi nhánh của người gọi)
    async getStaffList(userId: string) {
        // 1. Lấy thông tin người đang gọi API
        const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) throw new ForbiddenException('User not found');

        const whereCondition: any = {};

        // 2. Nếu là Manager -> Chỉ lấy nhân viên cùng chi nhánh & Không lấy Admin
        if (currentUser.role === 'BRANCH_MANAGER') {
            whereCondition.branch_id = currentUser.branch_id;
            whereCondition.role = { in: ['DOCTOR', 'RECEPTIONIST'] }; // Chỉ xem Bác sĩ & Lễ tân
        }
        // Nếu là Admin -> Lấy tất cả (trừ Admin khác nếu muốn)
        else if (currentUser.role === 'ADMIN') {
            whereCondition.role = { not: 'ADMIN' };
        }

        return this.prisma.user.findMany({
            where: whereCondition,
            include: { branch: true, doctor: true },
            orderBy: { created_at: 'desc' },
        });
    }

    // Cập nhật thông tin nhân viên
    async updateStaff(id: string, data: any) {
        // (Có thể thêm logic check quyền ở đây nếu cần chặt chẽ)

        // Nếu có password mới thì hash, không thì bỏ qua
        if (data.password) {
            data.password_hash = await bcrypt.hash(data.password, 10);
            delete data.password;
        } else {
            delete data.password; // Xóa field password rỗng để không bị ghi đè
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                full_name: data.full_name,
                phone: data.phone,
                is_active: data.is_active, // Cập nhật trạng thái
                branch_id: data.branch_id, // Cho phép cập nhật chi nhánh
                // email và role thường hạn chế cho sửa để tránh lỗi logic
            },
        });
    }
}