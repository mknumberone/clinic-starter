import { Module } from '@nestjs/common';
import { DoctorsController, SpecializationsController, ExaminationPackagesController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    DoctorsController,
    SpecializationsController,
    ExaminationPackagesController,
  ],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule { }