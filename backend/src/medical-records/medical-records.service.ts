import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class MedicalRecordsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateMedicalRecordDto) {
        // Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu
        return this.prisma.$transaction(async (tx) => {
            // 1. Tạo bản ghi bệnh án
            const record = await tx.medicalRecord.create({
                data: {
                    appointment_id: dto.appointment_id,
                    patient_id: dto.patient_id,
                    doctor_id: dto.doctor_id,
                    diagnosis: dto.diagnosis,
                    symptoms: dto.symptoms,
                    clinical_data: dto.clinical_data || {},
                },
            });

            // 2. Cập nhật trạng thái Lịch hẹn -> Đã khám xong (hoặc Đang kê đơn)
            // Ở đây ta tạm để IN_PROGRESS để chuyển sang bước kê đơn
            await tx.appointment.update({
                where: { id: dto.appointment_id },
                data: { status: AppointmentStatus.IN_PROGRESS },
            });

            return record;
        });
    }

    async findAllByPatient(userId: string) {
        // 1. Tìm patient_id từ user_id
        const patient = await this.prisma.patient.findUnique({
            where: { user_id: userId }
        });

        if (!patient) return [];

        // 2. Lấy danh sách bệnh án
        return this.prisma.medicalRecord.findMany({
            where: { patient_id: patient.id },
            include: {
                doctor: { include: { user: true, specialization: true } },
                appointment: true, // Để lấy ngày khám
                prescriptions: true // Để đếm số thuốc (nếu cần)
            },
            orderBy: { created_at: 'desc' }
        });
    }
}