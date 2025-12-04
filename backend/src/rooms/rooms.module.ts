import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RoomsController],
    providers: [RoomsService],
    exports: [RoomsService] // Export để module khác (như Shift) dùng được nếu cần
})
export class RoomsModule { }