import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SendOtpDto, VerifyOtpDto, RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  // Normalize phone number to consistent format
  private normalizePhone(phone: string): string {
    // Convert +84 to 0
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    }
    return phone;
  }

  // Generate OTP (in production, use SMS service)
  private generateOtp(): string {
    // For development, use DEFAULT_OTP from env
    const defaultOtp = this.configService.get<string>('DEFAULT_OTP');
    if (defaultOtp) {
      return defaultOtp;
    }
    // In production, generate random 6-digit OTP
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
    const user = await this.prisma.user.create({
      data: {
        phone,
        email: dto.email,
        full_name: dto.full_name,
        role: 'patient',
        password_hash: await bcrypt.hash(phone, 10), // dummy password
        patients: {
          create: {},
        },
      },
      include: {
        patients: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        patient_id: user.patients?.id,
      },
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
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: {
        patients: true,
        doctors: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Số điện thoại chưa được đăng ký');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        patient_id: user.patients?.id,
        doctor_id: user.doctors?.id,
      },
      token,
    };
  }

  // Generate JWT token
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // Validate user from JWT
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patients: true,
        doctors: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      patient_id: user.patients?.id,
      doctor_id: user.doctors?.id,
    };
  }
}
