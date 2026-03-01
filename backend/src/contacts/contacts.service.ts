import { Injectable, NotFoundException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/contact.dto';
import { ContactStatus } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async create(dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        branch_id: dto.branch_id || null,
        patient_id: dto.patient_id || null,
      },
    });
  }

  async findAll(params?: { status?: string; branchId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) {
      where.status = params.status as ContactStatus;
    }
    if (params?.branchId) {
      where.branch_id = params.branchId;
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, address: true, phone: true, email: true } },
          patient: { include: { user: { select: { full_name: true, phone: true, email: true } } } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        branch: true,
        patient: { include: { user: { select: { full_name: true, phone: true, email: true } } } },
      },
    });
    if (!contact) throw new NotFoundException('Không tìm thấy liên hệ');
    return contact;
  }

  async update(id: string, dto: { status?: string; admin_reply?: string }) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Không tìm thấy liên hệ');

    const data: any = {};
    if (dto.status) data.status = dto.status as ContactStatus;
    if (dto.admin_reply !== undefined) data.admin_reply = dto.admin_reply;

    const updated = await this.prisma.contact.update({
      where: { id },
      data,
      include: {
        branch: true,
        patient: { include: { user: { select: { full_name: true, phone: true, email: true } } } },
      },
    });

    if (dto.admin_reply && contact.email) {
      try {
        await this.mailerService.sendMail({
          to: contact.email,
          subject: 'Phản hồi từ Phòng khám - ' + (contact.subject || 'Liên hệ'),
          html: `
            <p>Xin chào <strong>${contact.name}</strong>,</p>
            <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi từ đội ngũ hỗ trợ:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">${dto.admin_reply.replace(/\n/g, '<br>')}</div>
            <p>Nếu cần hỗ trợ thêm, vui lòng liên hệ lại với chúng tôi.</p>
            <p>Trân trọng,<br/><strong>Phòng khám Clinic</strong></p>
          `,
        });
      } catch (e) {
        console.error('Gửi email phản hồi thất bại:', e);
      }
    }

    return updated;
  }
}
