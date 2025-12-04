// src/branches/branches.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) { }

  // Lấy tất cả (Bao gồm cả Active và Inactive để Admin quản lý)
  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Tạo mới
  async create(data: any) {
    const existing = await this.prisma.branch.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Tên chi nhánh đã tồn tại');

    return this.prisma.branch.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        is_active: true, // Mặc định khi tạo là Active
      },
    });
  }

  // Cập nhật (Cho phép sửa cả is_active)
  async update(id: string, data: any) {
    await this.findById(id);
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        is_active: data.is_active, // <--- QUAN TRỌNG: Cập nhật trạng thái từ Form
      },
    });
  }

  // Xóa mềm (Chuyển is_active về false)
  async remove(id: string) {
    await this.findById(id);
    return this.prisma.branch.update({
      where: { id },
      data: { is_active: false }, // <--- Không delete, chỉ set false
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh');
    return branch;
  }
}