import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePrescriptionDto,
  CreateMedicationDto,
  UpdateMedicationDto,
  CreatePaymentDto
} from './dto/create-prescription.dto';
import { AppointmentStatus, InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) { }

  // =================================================================================================
  // 1. KÊ ĐƠN THUỐC (Create Prescription)
  // Logic:
  // - Kiểm tra/Sửa lỗi Branch ID
  // - Tính tổng tiền (chỉ thuốc kho)
  // - Giữ chỗ kho (Reserve Stock)
  // - Tạo Đơn thuốc + Hóa đơn (UNPAID)
  // =================================================================================================
  async createPrescription(dto: CreatePrescriptionDto, userBranchId?: string) {
    // 1. Lấy thông tin lịch hẹn
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointment_id },
      include: { doctor: { include: { user: true } } }
    });

    if (!appointment) throw new NotFoundException('Lịch hẹn không tồn tại');

    // --- LOGIC "AUTO-FIX" CHI NHÁNH (Quan trọng) ---
    // Ưu tiên dùng chi nhánh hiện tại của user đang đăng nhập (bác sĩ),
    // để đồng bộ với màn hình tồn kho/kê đơn.
    // Nếu không có thì fallback về branch của lịch hẹn / bác sĩ.
    let targetBranchId =
      userBranchId ||
      appointment.branch_id ||
      appointment.doctor?.user?.branch_id;

    // B2: Kiểm tra xem ID này có "sống" trong DB không
    let isValidBranch = false;
    if (targetBranchId) {
      const branchCheck = await this.prisma.branch.findUnique({ where: { id: targetBranchId } });
      if (branchCheck) isValidBranch = true;
    }

    // B3: Nếu không hợp lệ -> Lấy đại chi nhánh đầu tiên trong hệ thống để "cứu" đơn thuốc
    if (!isValidBranch) {
      const anyBranch = await this.prisma.branch.findFirst();
      if (!anyBranch) throw new BadRequestException("Hệ thống chưa có bất kỳ Chi nhánh nào! Vui lòng tạo chi nhánh trước.");

      console.warn(`⚠️ Cảnh báo: Branch ID cũ (${targetBranchId}) không hợp lệ. Hệ thống tự động chuyển sang Branch: ${anyBranch.name}`);
      targetBranchId = anyBranch.id;
    }
    // -----------------------------------------------

    const medicationIds = dto.items
      .map(i => i.medication_id)
      .filter(id => id) as string[];

    const medications = await this.prisma.medication.findMany({
      where: { id: { in: medicationIds } }
    });

    // Transaction: Đảm bảo tất cả thành công hoặc cùng thất bại
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const invoiceItemsData: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];

      for (const item of dto.items) {
        // Chỉ xử lý thuốc trong kho (có ID)
        if (item.medication_id) {
          const med = medications.find(m => m.id === item.medication_id);
          if (med) {
            const price = Number(med.sell_price);
            const amount = price * item.quantity;
            totalAmount += amount;

            // Thêm vào danh sách chi tiết hóa đơn
            invoiceItemsData.push({
              medication_id: med.id,
              description: med.name,
              quantity: item.quantity,
              amount: amount
            });

            // ---> GỌI INVENTORY SERVICE: GIỮ CHỖ KHO (PENDING) <---
            await this.inventoryService.reserveStock(
              targetBranchId,
              item.medication_id,
              item.quantity,
              tx // Truyền transaction xuống để đảm bảo tính toàn vẹn
            );
          }
        }
      }

      // 3. Tạo Đơn thuốc (Lưu cả thuốc kho và thuốc ngoài)
      const prescription = await tx.prescription.create({
        data: {
          appointment_id: dto.appointment_id,
          medical_record_id: dto.medical_record_id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_assigned_id || appointment.doctor?.id,
          branch_id: targetBranchId, // Dùng ID đã được fix
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              medication_id: item.medication_id || null,
              name: item.name || medications.find(m => m.id === item.medication_id)?.name || 'Thuốc ngoài',
              quantity: item.quantity,
              dosage: item.dosage,
              frequency: item.frequency
            }))
          }
        }
      });

      // 4. Tạo Hóa đơn (Chỉ chứa thuốc kho tính tiền)
      await tx.invoice.create({
        data: {
          branch_id: targetBranchId, // Dùng ID đã được fix
          appointment_id: dto.appointment_id,
          patient_id: appointment.patient_id,
          total_amount: totalAmount,
          status: InvoiceStatus.UNPAID,
          items: {
            create: invoiceItemsData
          }
        }
      });

      // 5. Cập nhật trạng thái Lịch hẹn -> COMPLETED
      await tx.appointment.update({
        where: { id: dto.appointment_id },
        data: {
          status: AppointmentStatus.COMPLETED,
          branch_id: targetBranchId // Cập nhật lại lịch hẹn cho đúng dữ liệu chuẩn
        }
      });

      return prescription;
    });
  }

  // =================================================================================================
  // 2. THANH TOÁN (Create Payment)
  // Logic:
  // - Tạo Payment record
  // - Update Invoice status (PAID/PARTIALLY_PAID)
  // - Nếu PAID -> Trừ kho thật (Confirm Deduction)
  // =================================================================================================
  async createPayment(dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoice_id },
        include: { items: true }
      });

      if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');
      if (invoice.status === InvoiceStatus.PAID) throw new BadRequestException('Hóa đơn đã được thanh toán');

      // 1. Tạo thanh toán
      await tx.payment.create({
        data: {
          invoice_id: dto.invoice_id,
          amount: dto.amount,
          method: dto.payment_method,
        }
      });

      // 2. Check trạng thái mới
      const isPaidFull = Number(dto.amount) >= Number(invoice.total_amount);
      const newStatus = isPaidFull ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await tx.invoice.update({
        where: { id: dto.invoice_id },
        data: { status: newStatus }
      });

      // 3. NẾU THANH TOÁN XONG -> TRỪ KHO THẬT (CHUYỂN TỪ PENDING SANG SOLD)
      if (newStatus === InvoiceStatus.PAID) {
        for (const item of invoice.items) {
          if (!item.medication_id) continue; // Bỏ qua nếu không phải thuốc kho

          await this.inventoryService.confirmStockDeduction(
            invoice.branch_id,
            item.medication_id,
            item.quantity,
            tx
          );
        }
      }
      return { message: 'Thanh toán thành công', status: newStatus };
    });
  }

  // =================================================================================================
  // 3. MASTER DATA THUỐC (Kèm thông tin tồn kho chi tiết)
  // =================================================================================================
  async getMedicationsList(branchId?: string) {
    const medications = await this.prisma.medication.findMany({
      include: {
        inventories: {
          where: branchId ? { branch_id: branchId } : undefined,
          select: {
            quantity: true,
            pending_quantity: true, // Lấy số lượng đang giữ chỗ
            sold_quantity: true,
            expiry_date: true,
            is_expired: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return medications.map(med => {
      let totalStock = 0;   // Tồn kho vật lý
      let totalPending = 0; // Đang kê đơn (chưa bán)
      let totalSold = 0;
      let totalExpired = 0;
      const now = new Date();

      med.inventories.forEach(item => {
        totalStock += item.quantity;
        totalPending += item.pending_quantity; // Cộng dồn pending
        totalSold += item.sold_quantity;

        const isExpired = item.is_expired || (item.expiry_date && new Date(item.expiry_date) < now);
        if (isExpired) {
          totalExpired += item.quantity;
        }
      });

      const { inventories, ...medInfo } = med;
      return {
        ...medInfo,
        inventory_qty: totalStock, // Tổng trong kho
        pending_qty: totalPending, // Frontend sẽ dùng số này để hiện Tag cam
        sold_qty: totalSold,
        expired_qty: totalExpired
      };
    });
  }

  // ... (Các hàm CRUD cơ bản giữ nguyên)

  async createMedication(dto: CreateMedicationDto) {
    return this.prisma.medication.create({
      data: {
        code: dto.code,
        name: dto.name,
        form: dto.form,
        base_unit: dto.base_unit || 'Viên',
        import_unit: dto.import_unit || 'Hộp',
        conversion_factor: dto.conversion_factor || 1,
        cost_price: dto.cost_price || 0,
        sell_price: dto.sell_price || 0,
        profit_margin: dto.profit_margin || 20,
      }
    });
  }

  async updateMedication(id: string, dto: UpdateMedicationDto) {
    const exists = await this.prisma.medication.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Thuốc không tồn tại');
    return this.prisma.medication.update({ where: { id }, data: dto });
  }

  async deleteMedication(id: string) {
    return this.prisma.medication.delete({ where: { id } });
  }

  // ============= INVOICE GETTERS =============

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        patient: { include: { user: true } },
        payments: true
      }
    });
  }

  async getAllInvoices(params: { status?: string, patientId?: string }) {
    const where: any = {};
    if (params.status && params.status !== 'all') where.status = params.status;
    if (params.patientId) where.patient_id = params.patientId;

    return this.prisma.invoice.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        items: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAllPrescriptions(params: {
    page?: number,
    limit?: number,
    patientId?: string,
    doctorId?: string
  }) {
    const { page = 1, limit = 20, patientId, doctorId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patient_id = patientId;
    if (doctorId) where.doctor_id = doctorId;

    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          items: true,
          appointment: true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.prescription.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPrescriptionById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        items: {
          include: {
            medication: true
          }
        },
        appointment: true,
        medical_record: true
      }
    });

    if (!prescription) {
      throw new NotFoundException('Đơn thuốc không tồn tại');
    }

    return prescription;
  }
}