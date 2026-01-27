import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryScheduler } from './inventory.scheduler'; // <--- Import mới
import { ScheduleModule } from '@nestjs/schedule'; // <--- Import NestJS Schedule

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot() // <--- Kích hoạt Cron Job
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryScheduler], // <--- Đăng ký Scheduler
  exports: [InventoryService],
})
export class InventoryModule { }