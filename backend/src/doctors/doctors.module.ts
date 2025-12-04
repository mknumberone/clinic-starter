import { Module } from '@nestjs/common';
import { DoctorsController, SpecializationsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    DoctorsController,
    SpecializationsController,
  ],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule { }