import { Controller, Post, Body, Get, UseGuards, Request, ValidationPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, RegisterDto, LoginDto, RegisterEmailDto, LoginEmailDto, ResendVerificationDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Gửi mã OTP đến số điện thoại' })
  @ApiResponse({ status: 200, description: 'OTP đã được gửi thành công' })
  @ApiResponse({ status: 400, description: 'Số điện thoại không hợp lệ' })
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body(ValidationPipe) dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới với SĐT + OTP' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'OTP không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã được đăng ký' })
  @ApiBody({ type: RegisterDto })
  async register(@Body(ValidationPipe) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập bằng SĐT + OTP' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'OTP không hợp lệ hoặc số điện thoại chưa đăng ký' })
  @ApiBody({ type: LoginDto })
  async login(@Body(ValidationPipe) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register-email')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới với Email + Password' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã được đăng ký' })
  @ApiBody({ type: RegisterEmailDto })
  async registerWithEmail(@Body(ValidationPipe) dto: RegisterEmailDto) {
    return this.authService.registerWithEmail(dto);
  }

  @Post('login-email')
  @ApiOperation({ summary: 'Đăng nhập bằng Email + Password' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({ status: 403, description: 'Tài khoản chưa được kích hoạt' })
  @ApiBody({ type: LoginEmailDto })
  async loginWithEmail(@Body(ValidationPipe) dto: LoginEmailDto) {
    return this.authService.loginWithEmail(dto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Xác thực tài khoản qua email token' })
  @ApiResponse({ status: 200, description: 'Xác thực thành công' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiQuery({ name: 'token', required: true, description: 'Token xác thực từ email' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Gửi lại email xác thực' })
  @ApiResponse({ status: 200, description: 'Email xác thực đã được gửi lại' })
  @ApiResponse({ status: 400, description: 'Email không hợp lệ hoặc không thể gửi email' })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(@Body(ValidationPipe) dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async getProfile(@Request() req) {
    return req.user;
  }
}
