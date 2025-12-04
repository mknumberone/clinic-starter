import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { InventoryModule } from '../inventory/inventory.module'; // <--- QUAN TRỌNG: Phải import để dùng được InventoryService
import { PrismaModule } from '../prisma/prisma.module'; // <--- THÊM DÒNG NÀY

@Module({
  imports: [
    PrismaModule,
    InventoryModule, // Import module Kho để trừ kho
  ],
  controllers: [PrescriptionsController], // Chỉ còn 1 Controller duy nhất
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule { }