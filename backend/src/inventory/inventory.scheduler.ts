// File: src/inventory/inventory.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryScheduler {
    private readonly logger = new Logger(InventoryScheduler.name);

    constructor(private prisma: PrismaService) { }

    // Chạy lúc 00:00 mỗi ngày
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpireCheck() {
        this.logger.debug('Running automated expiration check...');
        const now = new Date();

        // Cập nhật tất cả các lô thuốc có hạn sử dụng < hiện tại
        // mà chưa được đánh dấu is_expired
        const result = await this.prisma.branchInventory.updateMany({
            where: {
                expiry_date: { lt: now }, // Nhỏ hơn thời điểm hiện tại
                is_expired: false,
            },
            data: {
                is_expired: true,
            },
        });

        if (result.count > 0) {
            this.logger.warn(`Đã đánh dấu hết hạn cho ${result.count} lô thuốc.`);
        }
    }
}