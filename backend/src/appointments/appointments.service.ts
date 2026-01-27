import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  ChangeAppointmentStatusDto,
  GetAvailableSlotsDto,
  CreateRecurringAppointmentDto,
} from './dto/appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as isBetween from 'dayjs/plugin/isBetween';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { HttpException, HttpStatus } from '@nestjs/common'; // Thêm import này

// Kích hoạt các plugin của dayjs để so sánh thời gian
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) { }

  // ==================================================================
  // 1. LẤY KHUNG GIỜ TRỐNG (CÓ LOGIC HOẠCH ĐỊNH)
  // ==================================================================
  async getAvailableSlots(dto: GetAvailableSlotsDto) {
    const { date, branch_id, doctor_id, specialization_id } = dto;
    const targetDate = dayjs(date);
    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    // 1. Tìm các ca trực khớp điều kiện
    let shifts = await this.prisma.doctorShift.findMany({
      where: {
        room: { branch_id },
        start_time: { lte: endOfDay },
        end_time: { gte: startOfDay },
        ...(doctor_id ? { doctor_id } : {}),
        ...(specialization_id ? { doctor: { specialization_id: specialization_id } } : {}),
      },
      include: { doctor: true },
    });

    // 2. XỬ LÝ TRƯỜNG HỢP KHÔNG CÓ CA TRỰC
    if (shifts.length === 0) {
      // Tìm "Ca trực cuối cùng" đã được lên lịch của chi nhánh này để xác định biên quy hoạch
      const lastScheduledShift = await this.prisma.doctorShift.findFirst({
        where: {
          room: { branch_id },
          start_time: { gte: new Date() }
        },
        orderBy: { start_time: 'desc' }
      });

      const maxScheduledDate = lastScheduledShift
        ? dayjs(lastScheduledShift.start_time).endOf('day')
        : dayjs(); // Nếu chưa có lịch nào thì biên là hôm nay

      // LOGIC QUAN TRỌNG:
      // - Nếu ngày chọn > ngày xa nhất đã xếp lịch => Đây là TƯƠNG LAI CHƯA XẾP => Cho phép đặt (tạo slot ảo).
      // - Nếu ngày chọn <= ngày xa nhất => Đây là NGÀY NGHỈ (đã xếp lịch các ngày quanh đó nhưng chừa ngày này ra) => Chặn.

      if (targetDate.isAfter(maxScheduledDate)) {
        // ==> TẠO SLOT ẢO (Giờ hành chính 08:00 - 17:00)
        const defaultStart = targetDate.set('hour', 8).set('minute', 0).toDate();
        const defaultEnd = targetDate.set('hour', 17).set('minute', 0).toDate();

        shifts = [{
          id: 'virtual-shift',
          doctor_id: doctor_id || 'temp-id',
          start_time: defaultStart,
          end_time: defaultEnd,
          doctor: { average_time: 30 } as any
        } as any];
      } else {
        // ==> NGÀY NGHỈ / ĐÃ KÍN LỊCH HOẠCH ĐỊNH
        return []; // Trả về rỗng để App hiện thông báo "Không có lịch trống"
      }
    }

    if (!shifts.length) return [];

    // 3. Lọc bỏ các giờ đã có người đặt
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        branch_id,
        start_time: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
    });

    const uniqueSlots = new Set<string>();

    shifts.forEach((shift) => {
      const slotDuration = shift.doctor?.average_time || 30;
      let currentTime = dayjs(shift.start_time).isBefore(targetDate.startOf('day'))
        ? targetDate.startOf('day').add(8, 'hour')
        : dayjs(shift.start_time);

      if (shift.id === 'virtual-shift') currentTime = dayjs(shift.start_time); // Dùng giờ mặc định

      const shiftEnd = dayjs(shift.end_time);

      while (currentTime.add(slotDuration, 'minute').isSameOrBefore(shiftEnd)) {
        const slotTimeStr = currentTime.format('HH:mm');
        const slotStartISO = currentTime.toDate();
        const slotEndISO = currentTime.add(slotDuration, 'minute').toDate();

        // Check trùng lịch
        let isBusy = false;
        if (shift.id !== 'virtual-shift') {
          // Với ca thật, check trùng bác sĩ cụ thể
          isBusy = existingAppointments.some((appt) =>
            appt.doctor_assigned_id === shift.doctor_id &&
            (dayjs(appt.start_time).isBefore(slotEndISO) && dayjs(appt.end_time).isAfter(slotStartISO))
          );
        } else {
          // Với ca ảo (tương lai), tạm thời chưa check trùng gắt gao, 
          // hoặc chỉ check nếu khách chọn đích danh bác sĩ.
          if (doctor_id) {
            isBusy = existingAppointments.some(appt =>
              appt.doctor_assigned_id === doctor_id &&
              (dayjs(appt.start_time).isBefore(slotEndISO) && dayjs(appt.end_time).isAfter(slotStartISO))
            );
          }
        }

        if (!isBusy) {
          // Chỉ lấy giờ tương lai so với hiện tại
          if (dayjs(date).isSame(dayjs(), 'day')) {
            if (currentTime.isAfter(dayjs())) uniqueSlots.add(slotTimeStr);
          } else {
            uniqueSlots.add(slotTimeStr);
          }
        }
        currentTime = currentTime.add(slotDuration, 'minute');
      }
    });

    return Array.from(uniqueSlots).sort();
  }

  // ==================================================================
  // 2. TẠO LỊCH HẸN (XỬ LÝ ĐẶT TRƯỚC)
  // ==================================================================
  async createAppointment(dto: CreateAppointmentDto, createdBy: string) {
    if (!dto.branch_id) throw new BadRequestException('Vui lòng chọn chi nhánh');
    const startTime = new Date(dto.start_time);
    if (startTime < new Date()) throw new BadRequestException('Không thể đặt lịch trong quá khứ');

    // --- [THÊM ĐOẠN LOG NÀY ĐỂ DEBUG] ---
    console.log('--- DEBUG BOOKING ---');
    console.log('1. Booking Request:', {
      branch: dto.branch_id,
      doctor: dto.doctor_assigned_id,
      timeString: dto.start_time,
      parsedDate: startTime, // Kiểm tra xem giờ có bị trừ đi 7 tiếng (UTC) không?
      parsedLocal: startTime.toLocaleString()
    });
    // Tìm Patient (giữ nguyên logic cũ)
    let patient = await this.prisma.patient.findUnique({ where: { user_id: createdBy } });
    if (!patient) patient = await this.prisma.patient.findUnique({ where: { id: dto.patient_id } });
    if (!patient) throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');

    let finalDoctorId = dto.doctor_assigned_id || null;
    let finalRoomId = dto.room_id || null;
    let calculatedEndTime = new Date(dto.end_time);
    let successMessage = 'Đặt lịch thành công';

    // 1. TÌM CA TRỰC PHÙ HỢP
    const availableShifts = await this.prisma.doctorShift.findMany({
      where: {
        room: { branch_id: dto.branch_id },
        start_time: { lte: startTime },
        end_time: { gt: startTime },
        ...(finalDoctorId ? { doctor_id: finalDoctorId } : {})
      },
      include: { doctor: true }
    });

    // 2. XỬ LÝ KHI KHÔNG TÌM THẤY CA TRỰC (LOGIC MỚI Ở ĐÂY)
    console.log('2. Shift Query Result:', availableShifts.length, 'shifts found.');
    if (availableShifts.length === 0) {

      // Kiểm tra xem có phải tương lai xa không (Logic cũ)
      const lastShift = await this.prisma.doctorShift.findFirst({
        where: { room: { branch_id: dto.branch_id }, start_time: { gte: new Date() } },
        orderBy: { start_time: 'desc' }
      });
      const maxScheduledDate = lastShift ? dayjs(lastShift.start_time).endOf('day') : dayjs();
      const allShiftsInDay = await this.prisma.doctorShift.findMany({
        where: {
          doctor_id: finalDoctorId,
          start_time: { gte: dayjs(startTime).startOf('day').toDate() }
        }
      });
      console.log('Check Shift in DB (All day):', allShiftsInDay);
      if (dayjs(startTime).isAfter(maxScheduledDate)) {
        // ==> ĐÂY LÀ LỊCH TƯƠNG LAI CHƯA ĐƯỢC XẾP

        // --- [CASE 1]: KHÁCH CHỌN ĐÍCH DANH BÁC SĨ ---
        if (finalDoctorId) {
          // Nếu chưa có cờ xác nhận từ Frontend gửi lên -> Báo lỗi để hiện Popup
          if (!dto.confirm_booking) {
            throw new HttpException({
              status: HttpStatus.CONFLICT, // Mã 409
              code: 'DOCTOR_NOT_SCHEDULED', // Code riêng để Frontend bắt
              message: `Bác sĩ này chưa có lịch trực vào ngày ${dayjs(startTime).format('DD/MM/YYYY')}. Bạn có muốn tiếp tục đặt lịch chờ không?`
            }, HttpStatus.CONFLICT);
          }

          // Nếu đã có cờ confirm_booking = true -> Cho phép tạo (Ghi nhận chờ)
          successMessage = 'Đã ghi nhận yêu cầu đặt lịch chờ. Lịch sẽ được xác nhận khi bác sĩ có ca trực.';
          // Giữ nguyên finalDoctorId để lưu vào DB là ý muốn của khách
          // Mặc định thời gian khám là 30p vì chưa có thông tin bác sĩ thực tế
          calculatedEndTime = dayjs(startTime).add(30, 'minute').toDate();
        }

        // --- [CASE 2]: KHÔNG CHỌN BÁC SĨ (AUTO) ---
        else {
          // Vẫn ghi nhận bình thường, đợi sync sau
          successMessage = 'Yêu cầu đặt lịch đã được ghi nhận. Hệ thống sẽ tự động sắp xếp bác sĩ khi có lịch trực.';
          calculatedEndTime = dayjs(startTime).add(30, 'minute').toDate();
          // finalDoctorId vẫn là null -> SyncPendingAppointments sẽ xử lý cái này
        }

      } else {
        // Ngày nghỉ hoặc đã kín lịch
        throw new BadRequestException('Rất tiếc, khung giờ này hiện không có bác sĩ trực hoặc phòng khám nghỉ.');
      }

    } else {
      // 3. XỬ LÝ KHI CÓ CA TRỰC (Logic cũ giữ nguyên)
      let selectedShift = null;

      if (finalDoctorId) {
        selectedShift = availableShifts[0];
        const duration = selectedShift.doctor.average_time || 30;
        calculatedEndTime = dayjs(startTime).add(duration, 'minute').toDate();

        const conflict = await this.prisma.appointment.findFirst({
          where: {
            doctor_assigned_id: finalDoctorId,
            status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
            start_time: { lt: calculatedEndTime },
            end_time: { gt: startTime }
          }
        });
        if (conflict) throw new BadRequestException('Bác sĩ đã bận vào giờ này, vui lòng chọn giờ khác.');

      } else {
        // Auto-Assign
        for (const shift of availableShifts) {
          const duration = shift.doctor.average_time || 30;
          const endTime = dayjs(startTime).add(duration, 'minute').toDate();
          const isBusy = await this.prisma.appointment.findFirst({
            where: {
              doctor_assigned_id: shift.doctor_id,
              status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
              start_time: { lt: endTime },
              end_time: { gt: startTime }
            }
          });
          if (!isBusy) {
            selectedShift = shift;
            finalDoctorId = shift.doctor_id;
            calculatedEndTime = endTime;
            break;
          }
        }
        if (!selectedShift) throw new BadRequestException('Tất cả bác sĩ đều bận vào giờ này.');
        successMessage = `Đặt lịch thành công. Bác sĩ ${selectedShift.doctor.user?.full_name || ''} sẽ khám cho bạn.`;
      }
      if (selectedShift) finalRoomId = selectedShift.room_id;
    }

    // 4. LƯU VÀO DB (Logic cũ giữ nguyên)
    const appointment = await this.prisma.appointment.create({
      data: {
        patient_id: patient.id,
        branch_id: dto.branch_id,
        doctor_assigned_id: finalDoctorId,
        room_id: finalRoomId,
        appointment_type: dto.appointment_type,
        start_time: startTime,
        end_time: calculatedEndTime,
        source: dto.source || 'online',
        notes: dto.notes,
        status: AppointmentStatus.SCHEDULED,
        created_by: createdBy,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        room: true,
        branch: true,
      },
    });

    // Log status (Giữ nguyên)
    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: appointment.id,
        new_status: AppointmentStatus.SCHEDULED,
        changed_by: createdBy,
      },
    });

    return {
      message: successMessage,
      data: appointment
    };
  }

  // ==================================================================
  // CÁC HÀM KHÁC (CRUD & Utils - Giữ nguyên như cũ)
  // ==================================================================

  async getAppointmentById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialization: true } },
        room: true,
        branch: true,
        medical_record: true,
        status_logs: { orderBy: { created_at: 'desc' } },
        prescriptions: { include: { items: true } },
        invoices: true,
      },
    });
    if (!appointment) throw new NotFoundException('Không tìm thấy cuộc hẹn');
    return appointment;
  }

  // src/appointments/appointments.service.ts

  // File: src/appointments/appointments.service.ts (Backend)

  async getAllAppointments(filters: any) {
    const { userId, userRole, page = 1, limit = 10, ...otherFilters } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};

    // --- 1. PHÂN QUYỀN ---

    if (userRole === 'PATIENT') {
      // Logic riêng cho Bệnh nhân
      const patient = await this.prisma.patient.findUnique({ where: { user_id: userId } });
      if (!patient) return { data: [], pagination: { total: 0 } };

      where.patient_id = patient.id;

      // QUAN TRỌNG: Xóa branchId khỏi bộ lọc để bệnh nhân thấy lịch sử ở mọi cơ sở
      delete otherFilters.branchId;
    }
    else if (userRole === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({ where: { user_id: userId } });
      where.doctor_assigned_id = doctor ? doctor.id : 'invalid';
    }
    else if (userRole === 'BRANCH_MANAGER') {
      if (filters.userBranchId) where.branch_id = filters.userBranchId;
    }

    // --- 2. BỘ LỌC CHUNG ---

    // Lọc Status
    if (otherFilters.status && otherFilters.status !== 'all') {
      where.status = otherFilters.status;
    }

    // Lọc Branch (Chỉ áp dụng nếu không phải là Patient - do đã delete ở trên)
    if (otherFilters.branchId && otherFilters.branchId !== 'all' && otherFilters.branchId !== '') {
      where.branch_id = otherFilters.branchId;
    }

    // Lọc Ngày
    if (otherFilters.startDate && otherFilters.endDate) {
      const start = new Date(otherFilters.startDate);
      const end = new Date(otherFilters.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        where.start_time = { gte: start, lte: end };
      }
    }

    // Debug Log
    console.log('QUERY WHERE:', JSON.stringify(where, null, 2));

    try {
      const [data, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true, specialization: true } },
            room: true,
            branch: true,
          },
          skip,
          take: Number(limit),
          orderBy: { start_time: 'desc' },
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return {
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return { data: [], pagination: { total: 0 } };
    }
  }
  // ... (các phần dưới giữ nguyên)

  async updateAppointment(id: string, dto: UpdateAppointmentDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Không tìm thấy cuộc hẹn');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        start_time: dto.start_time ? new Date(dto.start_time) : undefined,
        end_time: dto.end_time ? new Date(dto.end_time) : undefined,
      }
    });
  }

  async changeAppointmentStatus(id: string, dto: ChangeAppointmentStatusDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Không tìm thấy cuộc hẹn');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status }
    });

    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: id,
        old_status: appointment.status,
        new_status: dto.status,
        changed_by: userId
      }
    });
    return updated;
  }

  async cancelAppointment(id: string, userId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Không tìm thấy cuộc hẹn');

    if (([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED] as any).includes(appointment.status)) {
      throw new BadRequestException('Không thể hủy cuộc hẹn này');
    }

    // Cập nhật DB -> Admin load lại trang sẽ thấy ngay
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        notes: reason ? (appointment.notes ? `${appointment.notes} | Hủy: ${reason}` : `Lý do hủy: ${reason}`) : appointment.notes
      }
    });

    // Log lịch sử
    await this.prisma.appointmentStatusLog.create({
      data: {
        appointment_id: id,
        old_status: appointment.status,
        new_status: AppointmentStatus.CANCELLED,
        changed_by: userId
      }
    });
    return updated;
  }

  async createRecurringAppointment(dto: CreateRecurringAppointmentDto, userId: string) {
    const results = [];
    let currentDate = dayjs(dto.start_time);
    let currentEndDate = dayjs(dto.end_time);

    for (let i = 0; i < dto.recurring_count; i++) {
      // Clone DTO để tạo lịch đơn lẻ
      const singleApptDto = {
        ...dto,
        start_time: currentDate.toISOString(),
        end_time: currentEndDate.toISOString(),
        notes: `${dto.notes || ''} (Lịch khám định kỳ lần ${i + 1}/${dto.recurring_count})`
      };

      try {
        // Tận dụng hàm createAppointment có sẵn để nó tự tính toán logic bác sĩ/slot
        // Lưu ý: Với các lịch tương lai xa chưa có ca trực, logic createAppointment
        // cần update một chút để chấp nhận "Auto Assign" vào một bác sĩ mặc định hoặc null
        // nếu chưa có lịch trực.

        const res = await this.createAppointment(singleApptDto, userId);
        results.push(res);
      } catch (error) {
        console.log(`Không thể tạo lịch lần ${i + 1}: ${error.message}`);
        // Có thể bỏ qua hoặc return lỗi tùy nghiệp vụ
      }

      // Tăng thời gian cho lần sau
      currentDate = currentDate.add(dto.interval_months, 'month');
      currentEndDate = currentEndDate.add(dto.interval_months, 'month');
    }

    return { message: `Đã tạo ${results.length} lịch hẹn định kỳ`, data: results };
  }

  async deleteAppointment(id: string) {
    return this.prisma.appointment.delete({ where: { id } });
  }

  async getAppointmentStatusHistory(id: string) {
    return this.prisma.appointmentStatusLog.findMany({
      where: { appointment_id: id },
      orderBy: { created_at: 'desc' }
    });
  }

  // ... (Các code cũ ở trên)

  // ==================================================================
  // 3. LOGIC TỰ ĐỘNG GÁN KHI CÓ CA TRỰC MỚI (Sync Logic)
  // ==================================================================

  /**
   * Hàm này cần được gọi bên phía DoctorShiftService sau khi tạo Shift thành công
   * @param shift thông tin ca trực vừa tạo
   */
  // Trong file appointments.service.ts

  async syncPendingAppointments(shift: {
    branch_id: string;
    doctor_id: string;
    start_time: Date;
    end_time: Date;
    room_id?: string
  }) {
    console.log(`Đang quét lịch hẹn chờ cho bác sĩ ${shift.doctor_id}...`);

    // Điều kiện chung: Cùng chi nhánh, thời gian nằm trong ca trực
    const timeCondition = {
      branch_id: shift.branch_id,
      status: AppointmentStatus.SCHEDULED,
      start_time: { gte: shift.start_time },
      end_time: { lte: shift.end_time },
    };

    // 1. Tìm các lịch hẹn AUTO (chưa có bác sĩ)
    const autoAppointments = await this.prisma.appointment.findMany({
      where: {
        ...timeCondition,
        doctor_assigned_id: null, // Chưa ai nhận
      }
    });

    // 2. Tìm các lịch hẹn ĐÍCH DANH (đã chọn bác sĩ này nhưng đang chờ lịch)
    // Lưu ý: Chỉ tìm đúng ID của bác sĩ trong ca trực này
    const specificAppointments = await this.prisma.appointment.findMany({
      where: {
        ...timeCondition,
        doctor_assigned_id: shift.doctor_id,
        // Có thể check thêm điều kiện room_id = null để biết là chưa được gán phòng chính thức
        // nhưng tạm thời cứ update lại cho chắc.
      }
    });

    const allPendingIds = [
      ...autoAppointments.map(a => a.id),
      ...specificAppointments.map(a => a.id)
    ];

    if (allPendingIds.length === 0) return;

    // 3. Cập nhật
    const updateResult = await this.prisma.appointment.updateMany({
      where: {
        id: { in: allPendingIds }
      },
      data: {
        doctor_assigned_id: shift.doctor_id, // Gán bác sĩ (với case Auto)
        ...(shift.room_id ? { room_id: shift.room_id } : {}) // Gán phòng chuẩn theo ca trực
      }
    });

    console.log(`Đã đồng bộ ${updateResult.count} lịch hẹn cho bác sĩ ID ${shift.doctor_id}`);
  }
}
