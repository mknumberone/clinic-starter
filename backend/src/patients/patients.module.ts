import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PrismaModule } from '../prisma/prisma.module'; // <--- QUAN TRỌNG: Thêm cái này

@Module({
  imports: [PrismaModule], // <--- Thêm vào đây
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule { }