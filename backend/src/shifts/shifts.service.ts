// File: src/shifts/shifts.service.ts

import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class ShiftsService {
    constructor(
        private prisma: PrismaService,
        private appointmentsService: AppointmentsService
    ) { }

    // ==========================================================
    // 1. CREATE: Tạo ca trực (Hỗ trợ Bác sĩ & Lễ tân)
    // ==========================================================
    async create(user: any, data: CreateShiftDto) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

        // 1. Validate thời gian
        if (start >= end) throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');

        // 2. Validate phòng & Quyền chi nhánh
        const room = await this.prisma.room.findUnique({ where: { id: data.room_id } });
        if (!room) throw new BadRequestException('Phòng/Vị trí không tồn tại');

        if (user.role === 'BRANCH_MANAGER' && room.branch_id !== user.branch_id) {
            throw new ForbiddenException('Bạn không có quyền tạo lịch cho chi nhánh khác');
        }

        // 3. Xác định đối tượng (Bác sĩ hay Lễ tân)
        const targetId = data.doctor_id || data.staff_id;
        const isDoctor = !!data.doctor_id; // Cờ đánh dấu là bác sĩ

        if (!targetId) {
            throw new BadRequestException('Vui lòng chọn Bác sĩ hoặc Nhân viên');
        }

        // 4. Check trùng lịch (Conflict)
        await this.checkConflict(targetId, isDoctor, data.room_id, start, end);

        // 5. Tạo Shift (Lưu vào cột tương ứng)
        const newShift = await this.prisma.doctorShift.create({
            data: {
                doctor_id: isDoctor ? targetId : null,
                staff_id: !isDoctor ? targetId : null,
                room_id: data.room_id,
                start_time: start,
                end_time: end,
                recurrence: data.recurrence || null,
            },
        });

        // 6. [AUTO-SYNC] Chỉ chạy nếu là Bác sĩ (Để gán bệnh nhân chờ)
        if (isDoctor) {
            try {
                await this.appointmentsService.syncPendingAppointments({
                    branch_id: room.branch_id!,
                    doctor_id: targetId!,
                    start_time: start,
                    end_time: end,
                    room_id: data.room_id
                });
            } catch (error) {
                console.error('Lỗi auto-sync khi tạo ca trực:', error);
            }
        }

        return newShift;
    }

    // ==========================================================
    // 2. UPDATE: Sửa ca trực
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

        // 3. Chuẩn bị dữ liệu mới (hoặc giữ nguyên cũ)
        const start = data.start_time ? new Date(data.start_time) : oldShift.start_time;
        const end = data.end_time ? new Date(data.end_time) : oldShift.end_time;
        const roomId = data.room_id || oldShift.room_id;

        // Xác định người được update (có thể đổi người hoặc giữ nguyên)
        const newDoctorId = data.doctor_id !== undefined ? data.doctor_id : oldShift.doctor_id;
        const newStaffId = data.staff_id !== undefined ? data.staff_id : oldShift.staff_id;

        // Ưu tiên xác định ID người hiện tại
        const targetId = newDoctorId || newStaffId;
        const isDoctor = !!newDoctorId;

        if (start >= end) throw new BadRequestException('Thời gian không hợp lệ');

        // 4. Check trùng lịch (Trừ chính nó ra)
        if (targetId) {
            await this.checkConflict(targetId, isDoctor, roomId, start, end, id);
        }

        // 5. Cập nhật DB
        const updatedShift = await this.prisma.doctorShift.update({
            where: { id },
            data: {
                start_time: start,
                end_time: end,
                room_id: roomId,
                doctor_id: newDoctorId || null,
                staff_id: newStaffId || null,
                recurrence: data.recurrence
            }
        });

        // 6. [AUTO-SYNC] Chỉ chạy nếu là Bác sĩ và có thay đổi liên quan
        if (isDoctor && updatedShift.doctor_id) {
            try {
                await this.appointmentsService.syncPendingAppointments({
                    branch_id: oldShift.room.branch_id!,
                    doctor_id: updatedShift.doctor_id,
                    start_time: start,
                    end_time: end,
                    room_id: updatedShift.room_id
                });
            } catch (error) {
                console.error('Lỗi auto-sync khi update:', error);
            }
        }

        return updatedShift;
    }

    // ==========================================================
    // 3. REMOVE: Xóa ca trực
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

        // --- XỬ LÝ LỊCH HẸN (Chỉ áp dụng nếu là ca trực Bác sĩ) ---
        if (shift.doctor_id) {
            // Gỡ bác sĩ ra khỏi các lịch hẹn trong khung giờ này => Về trạng thái "Chờ xếp"
            await this.prisma.appointment.updateMany({
                where: {
                    doctor_assigned_id: shift.doctor_id,
                    start_time: { gte: shift.start_time },
                    end_time: { lte: shift.end_time },
                    status: 'SCHEDULED' // Chỉ gỡ các lịch chưa khám
                },
                data: {
                    doctor_assigned_id: null,
                    // Có thể thêm log hoặc note nếu cần
                }
            });
        }

        return this.prisma.doctorShift.delete({ where: { id } });
    }

    // ==========================================================
    // 4. FIND ALL: Lấy danh sách (Include cả Staff)
    // ==========================================================
    async findAll(user: any, start?: string, end?: string) {
        const whereClause: any = {};

        // 1. Lọc theo chi nhánh
        if (user.role === 'BRANCH_MANAGER') {
            if (!user.branch_id) return [];
            whereClause.room = { branch_id: user.branch_id };
        }

        // 2. Lọc theo thời gian
        if (start && end) {
            whereClause.start_time = { gte: new Date(start), lte: new Date(end) };
        }

        return this.prisma.doctorShift.findMany({
            where: whereClause,
            include: {
                // Lấy thông tin Bác sĩ
                doctor: {
                    include: {
                        user: {
                            select: { id: true, full_name: true, avatar: true, email: true, phone: true }
                        },
                        specialization: true
                    }
                },

                // [QUAN TRỌNG] Lấy thông tin Lễ tân (User)
                // Staff relation phải khớp với tên trong schema.prisma (VD: staff hoặc user)
                staff: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar: true,
                        email: true,
                        phone: true
                    }
                },

                room: true
            },
            orderBy: { start_time: 'asc' },
        });
    }

    // ==========================================================
    // HELPERS: Check Conflict Đa Năng
    // ==========================================================
    // ==========================================================
    // HELPERS: Check Conflict Đa Năng (Đã Nâng Cấp Capacity)
    // ==========================================================
    private async checkConflict(personId: string, isDoctor: boolean, roomId: string, start: Date, end: Date, excludeId?: string) {
        // 1. Check trùng lịch CÁ NHÂN (Người này có đang bận ở đâu không?)
        // Logic: Một người không thể phân thân, nên vẫn giữ nguyên check findFirst
        const personConflict = await this.prisma.doctorShift.findFirst({
            where: {
                // Logic động: Tìm theo doctor_id HOẶC staff_id
                ...(isDoctor ? { doctor_id: personId } : { staff_id: personId }),

                id: excludeId ? { not: excludeId } : undefined, // Bỏ qua chính nó khi update
                OR: [{ start_time: { lt: end }, end_time: { gt: start } }], // Giao nhau về thời gian
            },
        });

        if (personConflict) {
            throw new ConflictException('Nhân sự này đã có lịch trực trong khung giờ này!');
        }

        // 2. [CẬP NHẬT] Check sức chứa PHÒNG (Room Capacity)

        // Bước A: Lấy thông tin phòng để biết sức chứa (capacity)
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { id: true, name: true, capacity: true }
        });

        if (!room) throw new NotFoundException('Phòng/Vị trí không tồn tại');

        const maxCapacity = room.capacity || 1; // Mặc định là 1 nếu không set

        // Bước B: Đếm số lượng ca trực ĐANG TỒN TẠI trong khung giờ này tại phòng đó
        const currentOccupancy = await this.prisma.doctorShift.count({
            where: {
                room_id: roomId,
                id: excludeId ? { not: excludeId } : undefined, // Trừ bản thân ra nếu đang update
                OR: [{ start_time: { lt: end }, end_time: { gt: start } }], // Logic giao nhau thời gian
            },
        });

        // Bước C: So sánh (Nếu số người hiện tại >= sức chứa => Báo lỗi)
        if (currentOccupancy >= maxCapacity) {
            throw new ConflictException(
                `Phòng ${room.name} đã đầy (Sức chứa: ${maxCapacity}, Đã xếp: ${currentOccupancy}). Không thể thêm người!`
            );
        }
    }

    // File: src/shifts/shifts.service.ts

    async attendance(id: string, type: 'CHECK_IN' | 'CHECK_OUT') {
        const shift = await this.prisma.doctorShift.findUnique({ where: { id } });
        if (!shift) throw new NotFoundException('Ca trực không tồn tại');

        const now = new Date();

        if (type === 'CHECK_IN') {
            if (shift.actual_start_time) throw new BadRequestException('Bạn đã check-in rồi');
            return this.prisma.doctorShift.update({
                where: { id },
                data: { actual_start_time: now }
            });
        }

        if (type === 'CHECK_OUT') {
            if (!shift.actual_start_time) throw new BadRequestException('Bạn chưa check-in');
            return this.prisma.doctorShift.update({
                where: { id },
                data: { actual_end_time: now }
            });
        }
    }
}