import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';

import { BranchesModule } from './branches/branches.module';
import { InventoryModule } from './inventory/inventory.module';
import { StaffModule } from './staff/staff.module'; // <--- IMPORT VÀO ĐÂY
import { ShiftsModule } from './shifts/shifts.module'; // <--- 1. IMPORT FILE NÀY
import { RoomsModule } from './rooms/rooms.module'; // <--- 1. IMPORT FILE NÀY

import { MedicalRecordsModule } from './medical-records/medical-records.module'; // <--- IMPORT NÀY
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PatientsModule,
    DashboardModule,
    DoctorsModule,
    AppointmentsModule,

    BranchesModule,
    InventoryModule,
    StaffModule, // <--- ĐĂNG KÝ VÀO ĐÂY
    ShiftsModule,
    RoomsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
