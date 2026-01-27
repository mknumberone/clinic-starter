import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailerService } from '@nestjs-modules/mailer';
import {
  SendOtpDto,
  VerifyOtpDto,
  RegisterDto,
  LoginDto,
  RegisterEmailDto,
  LoginEmailDto,
  ResendVerificationDto
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
    private mailerService: MailerService, // Đã thêm để sửa lỗi Property 'mailerService' does not exist
  ) { }

  // --- HÀM HỖ TRỢ CHUẨN HÓA ---
  private normalizePhone(phone: string): string {
    if (phone.startsWith('+84')) return '0' + phone.slice(3);
    return phone;
  }

  private normalizeRole(role?: string): string {
    const normalized = (role ?? 'PATIENT').toUpperCase();
    const validRoles = ['ADMIN', 'DOCTOR', 'BRANCH_MANAGER', 'RECEPTIONIST', 'PATIENT'];
    return validRoles.includes(normalized) ? normalized : 'PATIENT';
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
      patient_id: user.patient?.id || null,
      doctor_id: user.doctor?.id || null,
    };
  }

  // --- LOGIC XÁC THỰC BẰNG EMAIL ---

  async registerWithEmail(dto: RegisterEmailDto) {
    try {
      const { email, password, full_name } = dto;

      // 1. Kiểm tra email tồn tại
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new ConflictException('Email này đã được đăng ký');

      // 2. Tạo mã xác thực và hash mật khẩu
      const verificationToken = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Sử dụng transaction để tạo user và patient profile cùng lúc
      const result = await this.prisma.$transaction(async (tx) => {
        // Tạo user (trạng thái chưa xác thực)
        const createdUser = await tx.user.create({
          data: {
            email,
            password_hash: hashedPassword,
            full_name,
            verification_token: verificationToken,
            is_verified: false,
            role: 'PATIENT',
          },
        });

        // Tạo patient profile tự động
        await tx.patient.create({
          data: {
            user_id: createdUser.id,
          },
        });

        return createdUser;
      });

      // 4. Gửi email xác thực (không block nếu lỗi gửi email)
      const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

      try {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Xác thực tài khoản của bạn',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Chào mừng bạn đến với Clinic!</h2>
              <p>Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
              <a href="${verificationUrl}" style="background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xác thực tài khoản</a>
              <p style="margin-top: 20px;">Hoặc copy đường dẫn này: ${verificationUrl}</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.error('Lỗi gửi mail (không ảnh hưởng đến đăng ký):', mailError);
        // Không throw error vì đăng ký đã thành công, chỉ là không gửi được email
      }

      return { message: 'Vui lòng kiểm tra email để xác thực tài khoản' };
    } catch (error: any) {
      console.error('Lỗi đăng ký email:', error);
      // Re-throw các exception đã được định nghĩa
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      // Các lỗi khác throw BadRequestException với message
      throw new BadRequestException(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  }

  async verifyEmail(token: string) {
    if (!token || token.trim() === '') {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    // Tìm user với token này
    const user = await this.prisma.user.findFirst({ 
      where: { verification_token: token.trim() } 
    });

    if (!user) {
      console.log(`[VERIFY EMAIL] Token không tìm thấy: ${token.substring(0, 10)}...`);
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra xem đã verify chưa
    if (user.is_verified) {
      return { success: true, message: 'Tài khoản đã được kích hoạt trước đó!' };
    }

    // Cập nhật trạng thái verify
    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true, verification_token: null },
    });

    console.log(`[VERIFY EMAIL] User ${user.email} đã được verify thành công`);
    return { success: true, message: 'Tài khoản đã được kích hoạt thành công!' };
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const { email } = dto;

    // Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return { message: 'Nếu email này đã được đăng ký, chúng tôi sẽ gửi email xác thực.' };
    }

    // Nếu đã verify rồi thì không cần gửi lại
    if (user.is_verified) {
      return { message: 'Tài khoản này đã được xác thực rồi. Bạn có thể đăng nhập ngay.' };
    }

    // Tạo token mới
    const verificationToken = uuidv4();

    // Cập nhật token mới
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verification_token: verificationToken },
    });

    // Gửi email xác thực
    const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác thực tài khoản của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Xác thực tài khoản Clinic</h2>
            <p>Bạn đã yêu cầu gửi lại email xác thực. Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản:</p>
            <a href="${verificationUrl}" style="background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Xác thực tài khoản</a>
            <p style="margin-top: 20px;">Hoặc copy đường dẫn này: ${verificationUrl}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Nếu bạn không yêu cầu email này, vui lòng bỏ qua.</p>
          </div>
        `,
      });

      console.log(`[RESEND VERIFICATION] Đã gửi email xác thực lại cho ${email}`);
      return { message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.' };
    } catch (mailError) {
      console.error('Lỗi gửi mail:', mailError);
      throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
    }
  }

  async loginWithEmail(dto: LoginEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { patient: true, doctor: true }
    }) as UserWithRelations;

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra mật khẩu trước
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra đã verify email chưa - PHẢI kiểm tra sau khi verify mật khẩu
    if (!user.is_verified) {
      console.log(`[LOGIN EMAIL] User ${user.email} chưa verify, từ chối đăng nhập`);
      throw new ForbiddenException('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.');
    }

    return this.generateToken(user);
  }

  // --- LOGIC XÁC THỰC BẰNG OTP (SĐT) ---

  async sendOtp(dto: SendOtpDto) {
    const phone = this.normalizePhone(dto.phone);
    const otp = this.configService.get('DEFAULT_OTP') || '123456';
    const otpKey = `otp:${phone}`;

    await this.redisService.set(otpKey, otp, 300); // Hết hạn sau 5 phút
    console.log(`[OTP DEBUG] Số: ${phone} - Mã: ${otp}`);

    return { message: 'Mã OTP đã được gửi', expiresIn: 300 };
  }

  async register(dto: RegisterDto) {
    try {
      const phone = this.normalizePhone(dto.phone);
      const otpKey = `otp:${phone}`;
      
      // Lấy OTP từ Redis hoặc dùng OTP mặc định nếu Redis không có
      const storedOtp = await this.redisService.get(otpKey);
      const defaultOtp = this.configService.get('DEFAULT_OTP') || '123456';
      
      // Cho phép dùng OTP mặc định nếu Redis không có OTP (cho development)
      const validOtp = storedOtp || defaultOtp;

      // Debug logging
      console.log(`[REGISTER DEBUG] Phone: ${phone}, Stored OTP: ${storedOtp}, Default OTP: ${defaultOtp}, Valid OTP: ${validOtp}, Input OTP: ${dto.otp}`);

      // 1. Kiểm tra OTP (chuyển sang string để đảm bảo so sánh đúng)
      const inputOtp = String(dto.otp).trim();
      const expectedOtp = String(validOtp).trim();
      
      if (expectedOtp !== inputOtp) {
        console.log(`[REGISTER DEBUG] OTP mismatch: Expected "${expectedOtp}" but got "${inputOtp}"`);
        throw new UnauthorizedException('Mã OTP không chính xác hoặc đã hết hạn');
      }

    // 2. Kiểm tra số điện thoại đã được đăng ký chưa
    const existingUser = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('Số điện thoại này đã được đăng ký');
    }

    // 3. Tạo user mới
    const createdUser = await this.prisma.user.create({
      data: {
        phone,
        full_name: dto.full_name,
        email: dto.email || null,
        role: 'PATIENT',
        is_verified: true, // OTP đã verify nên coi như đã xác thực
      },
    });

    // 4. Tạo patient profile
    await this.prisma.patient.create({
      data: {
        user_id: createdUser.id,
      },
    });

    // 5. Reload user với đầy đủ thông tin patient
    const newUser = await this.prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { patient: true, doctor: true },
    }) as UserWithRelations;

      // 6. Xóa OTP đã sử dụng (nếu có trong Redis)
      if (storedOtp) {
        await this.redisService.del(otpKey);
      }

      // 7. Tạo token và trả về
      return this.generateToken(newUser);
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      // Re-throw các exception đã được định nghĩa
      if (error instanceof UnauthorizedException || error instanceof ConflictException) {
        throw error;
      }
      // Các lỗi khác throw BadRequestException với message
      throw new BadRequestException(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  }

  async login(dto: LoginDto) {
    try {
      const phone = this.normalizePhone(dto.phone);
      const otpKey = `otp:${phone}`;
      
      // Lấy OTP từ Redis hoặc dùng OTP mặc định nếu Redis không có
      const storedOtp = await this.redisService.get(otpKey);
      const defaultOtp = this.configService.get('DEFAULT_OTP') || '123456';
      
      // Cho phép dùng OTP mặc định nếu Redis không có OTP (cho development)
      const validOtp = storedOtp || defaultOtp;
      
      // Debug logging
      console.log(`[LOGIN DEBUG] Phone: ${phone}, Stored OTP: ${storedOtp}, Default OTP: ${defaultOtp}, Valid OTP: ${validOtp}, Input OTP: ${dto.otp}`);
      
      // So sánh OTP (chuyển sang string để đảm bảo so sánh đúng)
      const inputOtp = String(dto.otp).trim();
      const expectedOtp = String(validOtp).trim();
      
      if (expectedOtp !== inputOtp) {
        console.log(`[LOGIN DEBUG] OTP mismatch: Expected "${expectedOtp}" but got "${inputOtp}"`);
        throw new UnauthorizedException('Mã OTP không chính xác hoặc đã hết hạn');
      }

      // Tìm user theo số điện thoại
      const user = await this.prisma.user.findFirst({
        where: { phone },
        include: { patient: true, doctor: true },
      }) as UserWithRelations | null;

      if (!user) {
        console.log(`[LOGIN DEBUG] User not found for phone: ${phone}`);
        throw new UnauthorizedException('Số điện thoại chưa được đăng ký');
      }

      console.log(`[LOGIN DEBUG] User found: ${user.full_name} (${user.id})`);

      // Xóa OTP đã sử dụng (nếu có trong Redis)
      if (storedOtp) {
        await this.redisService.del(otpKey);
      }

      // Tạo token và trả về
      return this.generateToken(user);
    } catch (error: any) {
      console.error('[LOGIN ERROR]', error);
      // Re-throw các exception đã được định nghĩa
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Các lỗi khác throw UnauthorizedException với message
      throw new UnauthorizedException(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  }

  // --- VALIDATE USER CHO JWT STRATEGY ---
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, doctor: true },
    }) as UserWithRelations | null;

    if (!user || !user.is_active) {
      return null;
    }

    return this.buildUserResponse(user);
  }

  // --- HÀM TẠO TOKEN CHUNG ---
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: this.normalizeRole(user.role)
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: this.buildUserResponse(user as UserWithRelations)
    };
  }
}