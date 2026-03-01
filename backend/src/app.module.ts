import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ServeStaticModule } from '@nestjs/serve-static'; // Cài đặt: npm i @nestjs/serve-static
import { join } from 'path';
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
import { UploadModule } from './upload/upload.module';

import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module'; // <--- Import này
import { MedicationsModule } from './medications/medications.module';
import { NewsModule } from './news/news.module';
import { SmsModule } from './sms/sms.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ContactsModule } from './contacts/contacts.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER || 'nonghainam433@gmail.com',
          pass: process.env.MAIL_PASS || 'fsci qiaj dvqk qktl',
        },
      },
      defaults: {
        from: '"Phòng khám Clinic" <nonghainam433@gmail.com>',
      },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PatientsModule,
    DashboardModule,
    DoctorsModule,
    AppointmentsModule,
    UsersModule,
    MedicationsModule,

    BranchesModule,
    InventoryModule,
    StaffModule, // <--- ĐĂNG KÝ VÀO ĐÂY
    ShiftsModule,
    RoomsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    UploadModule,
    ChatModule,
    NewsModule,
    SmsModule,
    FirebaseModule,
    ContactsModule,
    AnalyticsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Trỏ ra thư mục uploads ở gốc dự án
      serveRoot: '/uploads', // Đường dẫn truy cập: http://localhost:3000/uploads/ten-anh.jpg
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
