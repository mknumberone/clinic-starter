import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ChatModule } from '../chat/chat.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [ChatModule, InventoryModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
