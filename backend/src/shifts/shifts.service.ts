import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto'; // Cần tạo thêm DTO này hoặc dùng PartialType
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class ShiftsService {
    constructor(
        private prisma: PrismaService,
        private appointmentsService: AppointmentsService
    ) { }

    // ==========================================================
    // 1. CREATE: Tạo ca trực -> Tự động nhận lịch chờ
    // ==========================================================
    async create(user: any, data: CreateShiftDto) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

        // 1. Validate logic cơ bản
        if (start >= end) throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');

        const room = await this.prisma.room.findUnique({ where: { id: data.room_id } });
        if (!room) throw new BadRequestException('Phòng khám không tồn tại');

        // 2. Validate quyền
        if (user.role === 'BRANCH_MANAGER' && room.branch_id !== user.branch_id) {
            throw new ForbiddenException('Bạn không có quyền tạo lịch cho chi nhánh khác');
        }

        // 3. Check trùng lịch (Conflict)
        await this.checkConflict(data.doctor_id, data.room_id, start, end);

        // 4. Tạo Shift
        const newShift = await this.prisma.doctorShift.create({
            data: {
                doctor_id: data.doctor_id,
                room_id: data.room_id,
                start_time: start,
                end_time: end,
            },
        });

        // 5. [AUTO-SYNC] Quét lịch hẹn chờ để gán ngay
        // Dùng try-catch để không làm fail luồng chính
        try {
            await this.appointmentsService.syncPendingAppointments({
                branch_id: room.branch_id,
                doctor_id: data.doctor_id,
                start_time: start,
                end_time: end,
                room_id: data.room_id
            });
        } catch (error) {
            console.error('Lỗi auto-sync khi tạo ca trực:', error);
        }

        return newShift;
    }

    // ==========================================================
    // 2. UPDATE: Sửa giờ trực -> Quét lại lịch chờ
    // ==========================================================
    async update(user: any, id: string, data: UpdateShiftDto) {
        // 1. Lấy ca trực cũ
        const oldShift = await this.prisma.doctorShift.findUnique({
            where: { id },
            include: { room: true }
        });
        if (!oldShift) throw new NotFoundException('Ca trực không tồn tại');

        // 2. Validate quyền
        if (user.role === 'BRANCH_MANAGER' && oldShift.room.branch_id !== user.branch_id) {
            throw new ForbiddenException('Không có quyền sửa lịch chi nhánh khác');
        }

        const start = data.start_time ? new Date(data.start_time) : oldShift.start_time;
        const end = data.end_time ? new Date(data.end_time) : oldShift.end_time;

        if (start >= end) throw new BadRequestException('Thời gian không hợp lệ');

        // 3. Check trùng lịch (trừ chính nó ra)
        await this.checkConflict(
            data.doctor_id || oldShift.doctor_id,
            data.room_id || oldShift.room_id,
            start,
            end,
            id // Bỏ qua ID hiện tại
        );

        // 4. Cập nhật DB
        const updatedShift = await this.prisma.doctorShift.update({
            where: { id },
            data: {
                start_time: start,
                end_time: end,
                room_id: data.room_id,
                doctor_id: data.doctor_id
            }
        });

        // 5. [AUTO-SYNC] Nếu mở rộng khung giờ hoặc đổi bác sĩ, cần quét lại lịch chờ
        try {
            await this.appointmentsService.syncPendingAppointments({
                branch_id: oldShift.room.branch_id,
                doctor_id: updatedShift.doctor_id,
                start_time: start,
                end_time: end,
                room_id: updatedShift.room_id
            });
        } catch (error) {
            console.error('Lỗi auto-sync khi update ca trực:', error);
        }

        return updatedShift;
    }

    // ==========================================================
    // 3. REMOVE: Xóa ca trực -> Gỡ bỏ bác sĩ khỏi lịch hẹn
    // ==========================================================
    async remove(user: any, id: string) {
        const shift = await this.prisma.doctorShift.findUnique({
            where: { id },
            include: { room: true }
        });
        if (!shift) throw new NotFoundException('Ca trực không tồn tại');

        if (user.role === 'BRANCH_MANAGER' && shift.room.branch_id !== user.branch_id) {
            throw new ForbiddenException('Không có quyền xóa lịch chi nhánh khác');
        }

        // --- LOGIC QUAN TRỌNG: Xử lý các lịch hẹn đã gán vào ca trực này ---

        // Cách 1 (An toàn): Không cho xóa nếu đã có bệnh nhân đặt
        /*
        const hasAppointments = await this.prisma.appointment.count({
            where: {
                doctor_assigned_id: shift.doctor_id,
                start_time: { gte: shift.start_time },
                end_time: { lte: shift.end_time },
                status: { not: 'CANCELLED' }
            }
        });
        if (hasAppointments > 0) {
            throw new BadRequestException('Không thể xóa ca trực đã có bệnh nhân đặt lịch. Vui lòng hủy hoặc dời lịch hẹn trước.');
        }
        */

        // Cách 2 (Linh hoạt - Khuyên dùng cho đồ án): 
        // Gỡ bác sĩ ra (set null) để lịch hẹn quay về trạng thái "Chờ xếp lịch"
        // Admin sẽ thấy và xếp cho người khác.
        await this.prisma.appointment.updateMany({
            where: {
                doctor_assigned_id: shift.doctor_id,
                start_time: { gte: shift.start_time },
                end_time: { lte: shift.end_time },
                status: 'SCHEDULED' // Chỉ gỡ các lịch chưa khám
            },
            data: {
                doctor_assigned_id: null, // <--- Quay về trạng thái "Treo"
                notes: { set: 'Lịch trực bác sĩ bị hủy, đang chờ xếp lại' } // Cần logic nối chuỗi nếu muốn giữ note cũ, nhưng Prisma updateMany hạn chế. 
            }
        });

        return this.prisma.doctorShift.delete({ where: { id } });
    }

    // ==========================================================
    // 4. FIND ALL (Giữ nguyên)
    // ==========================================================
    async findAll(user: any, start?: string, end?: string) {
        const whereClause: any = {};
        if (user.role === 'BRANCH_MANAGER') {
            if (!user.branch_id) return [];
            whereClause.room = { branch_id: user.branch_id };
        }
        if (start && end) {
            whereClause.start_time = { gte: new Date(start), lte: new Date(end) };
        }
        return this.prisma.doctorShift.findMany({
            where: whereClause,
            include: { doctor: { include: { user: true, specialization: true } }, room: true },
            orderBy: { start_time: 'asc' },
        });
    }

    // ==========================================================
    // HELPERS: Tách hàm check conflict cho gọn
    // ==========================================================
    private async checkConflict(doctorId: string, roomId: string, start: Date, end: Date, excludeId?: string) {
        const doctorConflict = await this.prisma.doctorShift.findFirst({
            where: {
                doctor_id: doctorId,
                id: excludeId ? { not: excludeId } : undefined, // Trừ bản thân ra khi update
                OR: [{ start_time: { lt: end }, end_time: { gt: start } }],
            },
        });
        if (doctorConflict) throw new ConflictException('Bác sĩ này đã có lịch trực trong khung giờ này!');

        const roomConflict = await this.prisma.doctorShift.findFirst({
            where: {
                room_id: roomId,
                id: excludeId ? { not: excludeId } : undefined,
                OR: [{ start_time: { lt: end }, end_time: { gt: start } }],
            },
        });
        if (roomConflict) throw new ConflictException('Phòng khám này đã có người trực trong khung giờ này!');
    }
}