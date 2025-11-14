import { Controller, Post, Body, Get, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, RegisterDto, LoginDto } from './dto/auth.dto';
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
