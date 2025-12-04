import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller'; // <--- Import Controller

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController], // <--- Đăng ký Controller vào đây
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule { }