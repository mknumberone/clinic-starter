// src/staff/staff.module.ts
import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Module({
    imports: [PrismaModule], // Nhớ import PrismaModule
    controllers: [StaffController],
    providers: [StaffService],
    exports: [StaffService],
})
export class StaffModule { }