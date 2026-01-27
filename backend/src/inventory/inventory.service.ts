// File: src/inventory/inventory.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ImportInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  /**
   * 1. Lấy danh sách tồn kho của chi nhánh (Đã tính toán số liệu chi tiết)
   * Thay vì trả về list lô thô sơ, ta trả về list thuốc kèm tổng số lượng
   */
  async getBranchInventory(branchId: string) {
    // Lấy danh sách thuốc có trong kho của chi nhánh này
    const medications = await this.prisma.medication.findMany({
      where: {
        inventories: { some: { branch_id: branchId } }
      },
      include: {
        inventories: {
          where: { branch_id: branchId },
          orderBy: { expiry_date: 'asc' } // Sắp xếp lô để frontend dễ nhìn
        }
      },
      orderBy: { name: 'asc' }
    });

    // Map lại dữ liệu để tính toán các chỉ số quan trọng
    return medications.map(med => {
      const allBatches = med.inventories;
      const now = new Date();

      // 1. Tổng tồn kho vật lý (Tính cả hàng hỏng/hết hạn đang nằm trong kho)
      const totalQty = allBatches.reduce((sum, b) => sum + b.quantity, 0);

      // 2. Hàng hết hạn (Đã đánh dấu expired HOẶC ngày hết hạn < hiện tại)
      const expiredBatches = allBatches.filter(b => b.is_expired || new Date(b.expiry_date) < now);
      const expiredQty = expiredBatches.reduce((sum, b) => sum + b.quantity, 0);

      // 3. Đang giữ chỗ (Kê đơn nhưng chưa thanh toán)
      const pendingQty = allBatches.reduce((sum, b) => sum + b.pending_quantity, 0);

      // 4. Đã bán (Lịch sử)
      const soldQty = allBatches.reduce((sum, b) => sum + b.sold_quantity, 0);

      // 5. Khả dụng thực tế = Tổng - Hết hạn - Đang giữ
      // (Lưu ý: pendingQty thường nằm trong các lô chưa hết hạn, nên công thức này mang tính ước lượng an toàn)
      // Để chính xác tuyệt đối: Tính tổng các lô (available - pending) mà chưa hết hạn.
      const validBatches = allBatches.filter(b => !b.is_expired && new Date(b.expiry_date) >= now);
      const availableQty = validBatches.reduce((sum, b) => sum + (b.quantity - b.pending_quantity), 0);

      return {
        ...med,
        inventory_qty: totalQty,      // Tổng tồn kho (hiển thị quản lý)
        expired_qty: expiredQty,      // Số lượng cần tiêu hủy
        pending_qty: pendingQty,      // Đang nằm trong đơn chờ
        available_qty: availableQty,  // Có thể kê đơn ngay
        sold_qty: soldQty,
        inventories: allBatches       // Trả về chi tiết lô để xem nếu cần
      };
    });
  }

  /**
   * HELPERS: Tìm các lô phù hợp để trừ kho (FEFO Logic)
   * Chỉ chọn lô CHƯA HẾT HẠN và CÒN HÀNG
   */
  private async findBatchesForDeduction(
    tx: Prisma.TransactionClient,
    branchId: string,
    medicationId: string,
    quantity: number
  ) {
    const now = new Date();

    const batches = await tx.branchInventory.findMany({
      where: {
        branch_id: branchId,
        medication_id: medicationId,
        quantity: { gt: 0 },       // Còn hàng
        is_expired: false,         // Chưa bị đánh dấu hỏng
        expiry_date: { gt: now }   // [QUAN TRỌNG] Ngày hết hạn phải còn hiệu lực
      },
      orderBy: [
        { expiry_date: 'asc' },    // Ưu tiên lô date gần nhất (FEFO)
        { id: 'asc' }
      ]
    });

    // Kiểm tra tổng khả dụng
    const totalAvailable = batches.reduce((acc, b) => acc + (b.quantity - b.pending_quantity), 0);

    if (totalAvailable < quantity) {
      // Lấy thêm tên thuốc để báo lỗi rõ ràng hơn (Optional)
      throw new BadRequestException(`Không đủ thuốc khả dụng (Chưa hết hạn). Còn: ${totalAvailable}, Cần: ${quantity}`);
    }

    return batches;
  }

  /**
   * 2. GIỮ CHỖ (Reserve) - Gọi khi Bác sĩ kê đơn
   * Tăng pending_quantity, chưa trừ kho thật.
   */
  async reserveStock(branchId: string, medicationId: string, quantity: number, tx: Prisma.TransactionClient) {
    // 1. Tìm các lô phù hợp theo nguyên tắc FEFO
    const batches = await this.findBatchesForDeduction(tx, branchId, medicationId, quantity);

    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      // Chỉ giữ chỗ trên số lượng "rảnh" của lô này
      const availableInBatch = batch.quantity - batch.pending_quantity;

      if (availableInBatch > 0) {
        const take = Math.min(remaining, availableInBatch);

        await tx.branchInventory.update({
          where: { id: batch.id },
          data: { pending_quantity: { increment: take } }
        });
        remaining -= take;
      }
    }

    // Double check (lý thuyết không bao giờ vào đây nếu findBatches đã check)
    if (remaining > 0) {
      throw new BadRequestException(`Lỗi hệ thống: Không thể phân bổ đủ số lượng giữ chỗ.`);
    }
  }

  /**
   * 3. XUẤT KHO THẬT (Confirm) - Gọi khi Thanh toán thành công
   * Trừ quantity, trừ pending_quantity, tăng sold_quantity.
   */
  async confirmStockDeduction(branchId: string, medicationId: string, quantity: number, tx: Prisma.TransactionClient) {
    // Lấy các lô đang có pending > 0 (Ưu tiên lô date gần nhất để trừ trước)
    // Lưu ý: Lúc này không cần check hạn nữa vì đã check lúc reserve, 
    // nhưng để an toàn vẫn nên order by expiry.
    const batches = await tx.branchInventory.findMany({
      where: {
        branch_id: branchId,
        medication_id: medicationId,
        pending_quantity: { gt: 0 }
      },
      orderBy: { expiry_date: 'asc' }
    });

    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      // Trừ ưu tiên vào số lượng đang pending
      const take = Math.min(remaining, batch.pending_quantity);

      await tx.branchInventory.update({
        where: { id: batch.id },
        data: {
          quantity: { decrement: take },
          pending_quantity: { decrement: take },
          sold_quantity: { increment: take }
        }
      });
      remaining -= take;
    }

    // Nếu vẫn còn thiếu (remaining > 0), nghĩa là có sự lệch pha (ví dụ admin sửa kho tay).
    // Có thể thêm logic trừ thẳng vào quantity non-pending tại đây nếu muốn support case đó.
  }

  /**
   * 4. HỦY GIỮ CHỖ (Release) - Gọi khi Hủy đơn
   * Trả hàng về kho (Giảm pending)
   */
  async releaseStock(branchId: string, medicationId: string, quantity: number, tx: Prisma.TransactionClient) {
    const batches = await tx.branchInventory.findMany({
      where: { branch_id: branchId, medication_id: medicationId, pending_quantity: { gt: 0 } },
      orderBy: { expiry_date: 'asc' } // Trả lại lô date gần trước (hoặc sau tùy chính sách, ở đây trả lô cũ cho logic nhất quán)
    });

    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const release = Math.min(remaining, batch.pending_quantity);

      await tx.branchInventory.update({
        where: { id: batch.id },
        data: { pending_quantity: { decrement: release } }
      });
      remaining -= release;
    }
  }

  /**
   * 5. TRỪ KHO TRỰC TIẾP (Deduct Stock - FIFO/FEFO)
   * Dùng cho trường hợp bán lẻ không qua quy trình Kê đơn -> Thanh toán
   */
  async deductStock(branchId: string, medicationId: string, quantityNeeded: number, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    // Tái sử dụng logic tìm lô an toàn
    const batches = await this.findBatchesForDeduction(client, branchId, medicationId, quantityNeeded);

    let remaining = quantityNeeded;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const take = Math.min(batch.quantity, remaining);

      await client.branchInventory.update({
        where: { id: batch.id },
        data: {
          quantity: { decrement: take },
          sold_quantity: { increment: take }
        }
      });

      remaining -= take;
    }

    return true;
  }

  /**
   * 6. NHẬP KHO (Import) - Hỗ trợ tạo thuốc mới & Upsert tồn kho
   */
  async importStock(dto: ImportInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of dto.items) {
        let medicationId = item.medication_id;

        // A. TẠO THUỐC MỚI (Nếu chưa có ID)
        if (!medicationId && item.new_medication) {
          // Tính giá vốn ước tính
          const totalUnits = item.quantity_cartons * item.boxes_per_carton * item.blisters_per_box * item.pills_per_blister;
          const estimatedCostPrice = totalUnits > 0 ? (item.total_import_cost / totalUnits) : 0;

          const newMed = await tx.medication.create({
            data: {
              code: item.new_medication.code,
              name: item.new_medication.name,
              base_unit: item.new_medication.base_unit,
              import_unit: item.new_medication.import_unit || 'Hộp',
              conversion_factor: item.new_medication.conversion_factor || 1,
              profit_margin: item.new_medication.profit_margin || 20,
              cost_price: estimatedCostPrice,
              sell_price: item.new_medication.sell_price || (estimatedCostPrice * 1.2)
            }
          });
          medicationId = newMed.id;
        }

        if (!medicationId) {
          throw new BadRequestException('Thiếu thông tin: Phải cung cấp ID thuốc hoặc thông tin thuốc mới');
        }

        // B. TÍNH TOÁN SỐ LƯỢNG
        const totalQuantity = item.quantity_cartons * item.boxes_per_carton * item.blisters_per_box * item.pills_per_blister;
        const costPerUnit = totalQuantity > 0 ? (item.total_import_cost / totalQuantity) : 0;

        // C. UPSERT KHO (Cộng dồn nếu trùng Batch, Tạo mới nếu khác)
        // Lưu ý: Prisma upsert cần @unique([branch_id, medication_id, batch_number]) trong schema
        const inventory = await tx.branchInventory.upsert({
          where: {
            branch_id_medication_id_batch_number: {
              branch_id: dto.branch_id,
              medication_id: medicationId,
              batch_number: item.batch_number
            }
          },
          update: {
            quantity: { increment: totalQuantity },
            initial_quantity: { increment: totalQuantity }, // Cập nhật lại tổng nhập ban đầu
            import_price: costPerUnit, // Cập nhật giá nhập mới nhất
            is_expired: false // Reset lại trạng thái nếu nhập thêm vào lô cũ
          },
          create: {
            branch_id: dto.branch_id,
            medication_id: medicationId,
            batch_number: item.batch_number,
            mfg_date: new Date(item.mfg_date),
            expiry_date: new Date(item.expiry_date),
            initial_quantity: totalQuantity,
            quantity: totalQuantity,
            import_price: costPerUnit,
            is_expired: false
          }
        });

        // D. CẬP NHẬT GIÁ VỐN CHO MASTER DATA (Luôn lấy giá nhập gần nhất)
        await tx.medication.update({
          where: { id: medicationId },
          data: { cost_price: costPerUnit }
        });

        // E. LƯU LỊCH SỬ GIAO DỊCH (Optional nhưng nên có)
        await tx.inventoryTransaction.create({
          data: {
            branch_id: dto.branch_id,
            medication_id: medicationId,
            type: 'IMPORT',
            quantity: totalQuantity,
            price: costPerUnit,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            note: `Nhập kho: ${item.quantity_cartons} thùng`
          }
        });

        results.push(inventory);
      }
      return { message: 'Nhập kho thành công', data: results };
    });
  }

  // Cập nhật thông tin lô (Sửa hạn dùng, số lượng, số lô)
  async updateInventoryItem(id: string, data: any) {
    return this.prisma.branchInventory.update({
      where: { id },
      data: {
        batch_number: data.batch_number,
        expiry_date: data.expiry_date,
        quantity: data.quantity // Cho phép sửa số lượng tồn thực tế (Điều chỉnh kho)
      }
    });
  }

  // Xóa lô hàng (Chỉ cho phép xóa nếu chưa bán hoặc chấp nhận xóa cascade tùy nghiệp vụ)
  async deleteInventoryItem(id: string) {
    return this.prisma.branchInventory.delete({
      where: { id }
    });
  }

  // Helper đơn giản để check tồn kho (ít dùng vì đã có check trong reserve)
  async ensureStock(branchId: string, medicationId: string, quantity: number) {
    const inventories = await this.prisma.branchInventory.findMany({
      where: {
        branch_id: branchId,
        medication_id: medicationId,
        is_expired: false,
        expiry_date: { gt: new Date() }
      },
    });

    const totalStock = inventories.reduce((sum, item) => sum + (item.quantity - item.pending_quantity), 0);

    if (totalStock < quantity) {
      throw new BadRequestException(`Thuốc không đủ số lượng khả dụng. Tồn: ${totalStock}, Yêu cầu: ${quantity}`);
    }
    return true;
  }
}