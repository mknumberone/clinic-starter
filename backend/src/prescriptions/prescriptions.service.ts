import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreatePrescriptionDto, 
  CreateMedicationDto, 
  UpdateMedicationDto,
  CreateInvoiceDto,
  UpdateInvoiceStatusDto,
  CreatePaymentDto
} from './dto/prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  // ============= PRESCRIPTIONS =============

  async createPrescription(dto: CreatePrescriptionDto) {
    // Validate patient
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patient_id },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    // Validate doctor
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctor_id },
    });
    if (!doctor) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }

    // Validate appointment if provided
    if (dto.appointment_id) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointment_id },
      });
      if (!appointment) {
        throw new NotFoundException('Không tìm thấy cuộc hẹn');
      }
    }

    // Create prescription with items
    const prescription = await this.prisma.prescription.create({
      data: {
        appointment_id: dto.appointment_id,
        patient_id: dto.patient_id,
        doctor_id: dto.doctor_id,
        notes: dto.notes,
        items: {
          create: dto.items,
        },
      },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Tạo đơn thuốc thành công',
      prescription,
    };
  }

  async getPrescriptionById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
        appointment: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Không tìm thấy đơn thuốc');
    }

    return prescription;
  }

  async getAllPrescriptions(filters?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
  }) {
    const where: any = {};

    if (filters?.patientId) {
      where.patient_id = filters.patientId;
    }

    if (filters?.doctorId) {
      where.doctor_id = filters.doctorId;
    }

    if (filters?.appointmentId) {
      where.appointment_id = filters.appointmentId;
    }

    return this.prisma.prescription.findMany({
      where,
      include: {
        items: {
          include: {
            medication: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // ============= MEDICATIONS =============

  async getAllMedications() {
    return this.prisma.medication.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getMedicationById(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Không tìm thấy thuốc');
    }

    return medication;
  }

  async createMedication(dto: CreateMedicationDto) {
    if (dto.code) {
      const existing = await this.prisma.medication.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Mã thuốc đã tồn tại');
      }
    }

    return this.prisma.medication.create({
      data: dto,
    });
  }

  async updateMedication(id: string, dto: UpdateMedicationDto) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Không tìm thấy thuốc');
    }

    if (dto.code && dto.code !== medication.code) {
      const existing = await this.prisma.medication.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Mã thuốc đã tồn tại');
      }
    }

    return this.prisma.medication.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMedication(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication) {
      throw new NotFoundException('Không tìm thấy thuốc');
    }

    await this.prisma.medication.delete({
      where: { id },
    });

    return { message: 'Xóa thuốc thành công' };
  }

  // ============= INVOICES =============

  async createInvoice(dto: CreateInvoiceDto) {
    // Validate patient
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patient_id },
    });
    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    // Validate appointment if provided
    if (dto.appointment_id) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointment_id },
      });
      if (!appointment) {
        throw new NotFoundException('Không tìm thấy cuộc hẹn');
      }
    }

    // Calculate total
    const totalAmount = dto.items.reduce((sum, item) => {
      return sum + (item.amount * (item.quantity || 1));
    }, 0);

    // Create invoice with items
    const invoice = await this.prisma.invoice.create({
      data: {
        appointment_id: dto.appointment_id,
        patient_id: dto.patient_id,
        total_amount: totalAmount,
        status: 'unpaid',
        items: {
          create: dto.items,
        },
      },
      include: {
        items: true,
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Tạo hóa đơn thành công',
      invoice,
    };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: {
          orderBy: {
            paid_at: 'desc',
          },
        },
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        appointment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    // Calculate paid amount
    const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      ...invoice,
      paid_amount: paidAmount,
      remaining_amount: invoice.total_amount - paidAmount,
    };
  }

  async getAllInvoices(filters?: {
    status?: string;
    patientId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.patientId) {
      where.patient_id = filters.patientId;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: true,
        patient: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async updateInvoiceStatus(id: string, dto: UpdateInvoiceStatusDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  // ============= PAYMENTS =============

  async createPayment(dto: CreatePaymentDto) {
    // Validate invoice
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoice_id },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    // Calculate paid amount
    const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = invoice.total_amount - paidAmount;

    if (dto.amount > remainingAmount) {
      throw new BadRequestException('Số tiền thanh toán vượt quá số tiền còn lại');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoice_id: dto.invoice_id,
        amount: dto.amount,
        method: dto.method || 'cash',
        transaction_id: dto.transaction_id,
      },
    });

    // Update invoice status
    const newPaidAmount = paidAmount + dto.amount;
    let newStatus = 'unpaid';

    if (newPaidAmount >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially-paid';
    }

    await this.prisma.invoice.update({
      where: { id: dto.invoice_id },
      data: {
        status: newStatus,
      },
    });

    return {
      message: 'Thanh toán thành công',
      payment,
      invoice: {
        total_amount: invoice.total_amount,
        paid_amount: newPaidAmount,
        remaining_amount: invoice.total_amount - newPaidAmount,
        status: newStatus,
      },
    };
  }

  async getPaymentsByInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    return this.prisma.payment.findMany({
      where: { invoice_id: invoiceId },
      orderBy: {
        paid_at: 'desc',
      },
    });
  }
}
