import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module'; // <--- IMPORT

@Module({
    imports: [
        PrismaModule,
        AppointmentsModule // <--- THÊM VÀO ĐÂY
    ],
    controllers: [ShiftsController],
    providers: [ShiftsService],
})
export class ShiftsModule { }