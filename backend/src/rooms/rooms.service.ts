// File: src/rooms/rooms.service.ts

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    // Lấy tất cả phòng (Có hỗ trợ lọc theo chi nhánh)
    async findAll(branchId?: string) {
        const where: any = {};
        if (branchId) {
            where.branch_id = branchId;
        }

        return this.prisma.room.findMany({
            where,
            include: {
                specialization: true,
                branch: true,
                // Include thêm thông tin nếu cần thiết
            },
            orderBy: { name: 'asc' }
        });
    }

    // Lấy chi tiết 1 phòng
    async findOne(id: string) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                specialization: true,
                branch: true,
            },
        });
        if (!room) throw new NotFoundException('Không tìm thấy phòng khám');
        return room;
    }

    // Tạo phòng mới
    async create(dto: CreateRoomDto) {
        // 1. Check trùng mã phòng
        const existing = await this.prisma.room.findUnique({ where: { code: dto.code } });
        if (existing) throw new ConflictException('Mã phòng đã tồn tại');

        // 2. Check chi nhánh tồn tại
        const branch = await this.prisma.branch.findUnique({ where: { id: dto.branch_id } });
        if (!branch) throw new BadRequestException('Chi nhánh không tồn tại');

        // 3. Tạo mới
        return this.prisma.room.create({
            data: {
                name: dto.name,
                code: dto.code,
                branch_id: dto.branch_id,
                specialization_id: dto.specialization_id || null,
                floor: dto.floor,
                building: dto.building, // <--- LƯU TRƯỜNG TÒA NHÀ
                capacity: dto.capacity || 1,
            },
        });
    }

    // Cập nhật phòng
    async update(id: string, dto: UpdateRoomDto) {
        const room = await this.prisma.room.findUnique({ where: { id } });
        if (!room) throw new NotFoundException('Không tìm thấy phòng');

        // Nếu đổi mã phòng thì check trùng
        if (dto.code && dto.code !== room.code) {
            const existing = await this.prisma.room.findUnique({ where: { code: dto.code } });
            if (existing) throw new ConflictException('Mã phòng mới đã tồn tại');
        }

        return this.prisma.room.update({
            where: { id },
            data: {
                name: dto.name,
                code: dto.code,
                branch_id: dto.branch_id,
                specialization_id: dto.specialization_id,
                floor: dto.floor,
                building: dto.building, // <--- CẬP NHẬT TÒA NHÀ
                capacity: dto.capacity,
            },
        });
    }

    // Xóa phòng
    async remove(id: string) {
        try {
            return await this.prisma.room.delete({ where: { id } });
        } catch (error) {
            throw new BadRequestException('Không thể xóa phòng (có thể đang có lịch trực hoặc lịch hẹn)');
        }
    }
}