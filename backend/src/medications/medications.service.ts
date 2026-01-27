import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';

@Injectable()
export class MedicationsService {
    constructor(private prisma: PrismaService) { }

    // 1. Tạo thuốc mới
    async create(data: CreateMedicationDto) {
        return this.prisma.medication.create({ data });
    }

    // 2. Lấy danh sách (Có thể thêm lọc theo branch nếu cần)
    async findAll() {
        return this.prisma.medication.findMany({
            orderBy: { created_at: 'desc' }
        });
    }

    // 3. Lấy chi tiết 1 thuốc
    async findOne(id: string) {
        return this.prisma.medication.findUnique({ where: { id } });
    }

    // 4. Cập nhật thuốc
    async update(id: string, data: UpdateMedicationDto) {
        // Tự động tính giá bán nếu thiếu (Optional logic)
        if (data.cost_price && data.profit_margin && !data.sell_price) {
            const cost = Number(data.cost_price);
            const margin = Number(data.profit_margin);
            data.sell_price = cost + (cost * margin / 100);
        }

        return this.prisma.medication.update({
            where: { id },
            data: data,
        });
    }

    // 5. Xóa thuốc (Cẩn thận: Chỉ xóa nếu chưa dùng, hoặc dùng soft delete)
    async remove(id: string) {
        return this.prisma.medication.delete({ where: { id } });
    }
}