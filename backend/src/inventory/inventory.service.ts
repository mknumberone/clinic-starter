import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ImportInventoryDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  /**
   * 1. Lấy danh sách tồn kho của chi nhánh
   */
  async getBranchInventory(branchId: string) {
    return this.prisma.branchInventory.findMany({
      where: { branch_id: branchId },
      include: { medication: true },
      orderBy: { medication: { name: 'asc' } },
    });
  }

  /**
   * 2. Kiểm tra xem tổng tồn kho có đủ không
   */
  async ensureStock(branchId: string, medicationId: string, quantity: number) {
    const inventories = await this.prisma.branchInventory.findMany({
      where: { branch_id: branchId, medication_id: medicationId },
    });

    const totalStock = inventories.reduce((sum, item) => sum + item.quantity, 0);

    if (totalStock < quantity) {
      throw new BadRequestException(`Thuốc không đủ số lượng. Tồn kho: ${totalStock}, Yêu cầu: ${quantity}`);
    }
    return true;
  }

  /**
   * 3. Trừ kho theo nguyên tắc FIFO (Hết hạn trước/Nhập trước -> Trừ trước)
   * Hàm này được gọi từ PrescriptionsService khi thanh toán
   */
  async deductStock(
    branchId: string,
    medicationId: string,
    quantityNeeded: number,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;

    // Lấy tất cả các lô hàng, ưu tiên lô sắp hết hạn
    const batches = await client.branchInventory.findMany({
      where: {
        branch_id: branchId,
        medication_id: medicationId,
        quantity: { gt: 0 }
      },
      orderBy: [
        { expiry_date: 'asc' }, // Ưu tiên lô sắp hết hạn
        { id: 'asc' }           // Nếu không có hạn, ưu tiên lô nhập trước
      ]
    });

    const totalStock = batches.reduce((acc, batch) => acc + batch.quantity, 0);
    if (totalStock < quantityNeeded) {
      throw new BadRequestException(`Không đủ tồn kho. Hiện có: ${totalStock}, Cần: ${quantityNeeded}`);
    }

    let remainingToDeduct = quantityNeeded;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);

      await client.branchInventory.update({
        where: { id: batch.id },
        data: { quantity: { decrement: deductFromBatch } }
      });

      remainingToDeduct -= deductFromBatch;
    }

    return true;
  }

  /**
   * 4. Nhập kho thông minh (Tự tính giá vốn & giá bán)
   */
  async importStock(dto: ImportInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of dto.items) {
        let medicationId = item.medication_id;

        // --- LOGIC MỚI: TẠO THUỐC NẾU CHƯA CÓ ---
        if (!medicationId && item.new_medication) {
          // Tính toán giá vốn đơn vị từ lô hàng nhập này để lưu vào Master Data
          const totalUnits = item.quantity_cartons * item.boxes_per_carton * item.blisters_per_box * item.pills_per_blister;
          const estimatedCostPrice = totalUnits > 0 ? (item.total_import_cost / totalUnits) : 0;

          // Tạo thuốc mới
          const newMed = await tx.medication.create({
            data: {
              code: item.new_medication.code, // Có thể để null cho DB tự sinh
              name: item.new_medication.name,
              base_unit: item.new_medication.base_unit,
              import_unit: item.new_medication.import_unit || 'Hộp',
              conversion_factor: item.new_medication.conversion_factor || 1,
              profit_margin: item.new_medication.profit_margin || 20,

              // Cập nhật giá vốn & giá bán ngay lập tức
              cost_price: estimatedCostPrice,
              sell_price: item.new_medication.sell_price || (estimatedCostPrice * 1.2)
            }
          });
          medicationId = newMed.id;
        }

        if (!medicationId) {
          throw new BadRequestException('Phải cung cấp ID thuốc hoặc thông tin thuốc mới');
        }

        // --- LOGIC CŨ: TÍNH TOÁN & NHẬP KHO ---
        const totalQuantity = item.quantity_cartons * item.boxes_per_carton * item.blisters_per_box * item.pills_per_blister;
        const costPerUnit = totalQuantity > 0 ? (item.total_import_cost / totalQuantity) : 0;

        // Upsert vào kho
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
            initial_quantity: { increment: totalQuantity },
            import_price: costPerUnit,
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
          }
        });

        // Cập nhật lại giá vốn mới nhất cho thuốc (dù là thuốc cũ hay mới)
        await tx.medication.update({
          where: { id: medicationId },
          data: { cost_price: costPerUnit }
        });

        results.push(inventory);
      }
      return { message: 'Nhập kho thành công', data: results };
    });
  }

  async reserveStock(branchId: string, medicationId: string, quantity: number, tx: any) {
    // Tìm lô hàng phù hợp (ưu tiên lô hết hạn trước - FEFO hoặc lô đầu tiên tìm thấy)
    // Ở đây demo đơn giản: Lấy tổng tồn kho để check
    const inventories = await tx.branchInventory.findMany({
      where: { branch_id: branchId, medication_id: medicationId },
      orderBy: { expiry_date: 'asc' } // Ưu tiên xuất lô cũ trước
    });

    let remainingToReserve = quantity;

    // Check tổng tồn kho khả dụng (Quantity - Pending)
    const totalAvailable = inventories.reduce((sum, item) => sum + (item.quantity - item.pending_quantity), 0);

    if (totalAvailable < quantity) {
      throw new Error(`Thuốc ID ${medicationId} không đủ hàng. Khả dụng: ${totalAvailable}, Yêu cầu: ${quantity}`);
    }

    // Cập nhật pending cho từng lô (Logic phân bổ lô)
    for (const inv of inventories) {
      if (remainingToReserve <= 0) break;

      // Số lượng CÓ THỂ giữ ở lô này = Thực tế - Đang giữ
      const availableInBatch = inv.quantity - inv.pending_quantity;

      if (availableInBatch > 0) {
        const take = Math.min(remainingToReserve, availableInBatch);

        await tx.branchInventory.update({
          where: { id: inv.id },
          data: { pending_quantity: { increment: take } }
        });

        remainingToReserve -= take;
      }
    }
  }

  /**
   * 2. XUẤT KHO THẬT (Gọi khi Thanh toán thành công)
   * Giảm pending_quantity VÀ Giảm quantity.
   */
  async confirmStockDeduction(branchId: string, medicationId: string, quantity: number, tx: any) {
    // Logic tương tự reserve, nhưng lần này là TRỪ THẬT
    const inventories = await tx.branchInventory.findMany({
      where: { branch_id: branchId, medication_id: medicationId, pending_quantity: { gt: 0 } }, // Chỉ tìm những lô đang giữ chỗ
      orderBy: { expiry_date: 'asc' }
    });

    let remainingToDeduct = quantity;

    for (const inv of inventories) {
      if (remainingToDeduct <= 0) break;

      // Trừ vào số lượng đang pending của lô này
      const take = Math.min(remainingToDeduct, inv.pending_quantity);

      await tx.branchInventory.update({
        where: { id: inv.id },
        data: {
          quantity: { decrement: take },         // Trừ kho thật
          pending_quantity: { decrement: take }, // Xóa giữ chỗ
          sold_quantity: { increment: take }     // Tăng đã bán
        }
      });

      remainingToDeduct -= take;
    }
  }

  /**
   * 3. HỦY GIỮ CHỖ (Gọi khi Hủy đơn thuốc / Hủy hóa đơn)
   * Giảm pending_quantity (trả hàng về trạng thái Available)
   */
  async releaseStock(branchId: string, medicationId: string, quantity: number, tx: any) {
    // Logic trả lại hàng vào kho (giảm pending)
    // Tìm các lô đang có pending > 0
    const inventories = await tx.branchInventory.findMany({
      where: { branch_id: branchId, medication_id: medicationId, pending_quantity: { gt: 0 } }
    });

    let remainingToRelease = quantity;

    for (const inv of inventories) {
      if (remainingToRelease <= 0) break;
      const release = Math.min(remainingToRelease, inv.pending_quantity);

      await tx.branchInventory.update({
        where: { id: inv.id },
        data: { pending_quantity: { decrement: release } }
      });
      remainingToRelease -= release;
    }
  }
}