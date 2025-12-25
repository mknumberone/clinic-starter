import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client'; // Import Prisma

type UserWithRelations = Prisma.UserGetPayload<{
  include: { patient: true; doctor: true };
}>;


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) { }

  // Normalize phone number to consistent format
  private normalizePhone(phone: string): string {
    // Convert +84 to 0
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    }
    return phone;
  }

  private normalizeRole(role?: string): string { // Đổi kiểu trả về thành string cho rộng
    const normalized = (role ?? 'PATIENT').toUpperCase();

    // Danh sách các role hợp lệ
    const validRoles = ['ADMIN', 'DOCTOR', 'BRANCH_MANAGER', 'RECEPTIONIST', 'PATIENT'];

    if (validRoles.includes(normalized)) {
      return normalized;
    }

    return 'PATIENT';
  }

  private buildUserResponse(user: UserWithRelations) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: this.normalizeRole(user.role),
      branch_id: user.branch_id,
      avatar: user.avatar,
      patient_id: user.patient ? user.patient.id : null,
      doctor_id: user.doctor ? user.doctor.id : null,
    };
  }

  // Generate OTP (in production, use SMS service)
  private generateOtp(): string {
    // Ưu tiên OTP cố định từ biến môi trường nếu được cấu hình
    const envOtp = this.configService.get<string>('DEFAULT_OTP');
    if (envOtp && envOtp.trim().length > 0) {
      return envOtp;
    }

    // Nếu chưa cấu hình, mặc định dùng OTP cố định ở môi trường dev/test
    const nodeEnv = (this.configService.get<string>('NODE_ENV') || 'development').toLowerCase();
    if (nodeEnv !== 'production') {
      return '123456';
    }

    // Môi trường production không cấu hình OTP => tạo ngẫu nhiên
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to phone
  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const otp = this.generateOtp();
    const otpKey = `otp:${phone}`;
    const expiresIn = parseInt(this.configService.get<string>('OTP_EXPIRES_IN') || '300');

    // Store OTP in Redis with expiration
    await this.redisService.set(otpKey, otp, expiresIn);

    // TODO: In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    return {
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      expiresIn,
      // Only return OTP in development
      ...(this.configService.get<string>('DEFAULT_OTP') && { otp }),
    };
  }

  // Verify OTP
  private async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone);
    const otpKey = `otp:${normalizedPhone}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    // Delete OTP after successful verification
    await this.redisService.del(otpKey);
    return true;
  }

  // Register new patient
  async register(dto: RegisterDto) {
    const phone = this.normalizePhone(dto.phone);

    // Verify OTP
    const isOtpValid = await this.verifyOtp(phone, dto.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('Số điện thoại đã được đăng ký');
    }

    // Create user and patient
    const user = (await this.prisma.user.create({
      data: {
        phone,
        email: dto.email,
        full_name: dto.full_name,
        role: 'PATIENT',
        password_hash: await bcrypt.hash(phone, 10), // dummy password
        patient: {
          create: {},
        },
      },
      include: {
        patient: true,
      },
    })) as UserWithRelations; // Ép kiểu để truy cập patients

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Đăng ký thành công',
      user: this.buildUserResponse(user),
      token,
    };
  }

  // Login with phone + OTP
  async login(dto: LoginDto) {
    const phone = this.normalizePhone(dto.phone);

    // Verify OTP
    const isOtpValid = await this.verifyOtp(phone, dto.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Find user
    const user = (await this.prisma.user.findFirst({
      where: { phone },
      include: {
        patient: true,
        doctor: true,
      },
    })) as UserWithRelations; // Ép kiểu để truy cập relations

    if (!user) {
      throw new UnauthorizedException('Số điện thoại chưa được đăng ký');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Đăng nhập thành công',
      user: this.buildUserResponse(user),
      token,
    };
  }

  // Generate JWT token
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: this.normalizeRole(user.role),
      branch_id: user.branch_id,
    };

    return this.jwtService.sign(payload);
  }

  // Validate user from JWT
  async validateUser(userId: string) {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true,
      },
    })) as UserWithRelations; // Ép kiểu để truy cập relations

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }

    // SỬA: Trả về đối tượng với các trường ID an toàn
    return this.buildUserResponse(user);
  }
}