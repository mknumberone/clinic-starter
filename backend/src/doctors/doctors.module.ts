import { Module } from '@nestjs/common';
import { DoctorsController, SpecializationsController, RoomsController, DoctorShiftsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  controllers: [
    DoctorsController,
    SpecializationsController,
    RoomsController,
    DoctorShiftsController,
  ],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
