import { Module } from '@nestjs/common';
import { 
  PrescriptionsController, 
  MedicationsController, 
  InvoicesController, 
  PaymentsController 
} from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  controllers: [
    PrescriptionsController,
    MedicationsController,
    InvoicesController,
    PaymentsController,
  ],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
