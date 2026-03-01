import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EsmsSendResult = {
  CodeResult?: string;
  CountRegenerate?: number;
  SMSID?: string;
  ErrorMessage?: string;
  [key: string]: any;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  private get isRealSmsEnabled(): boolean {
    return this.configService.get<string>('ENABLE_REAL_SMS') === 'true';
  }

  private get apiUrl(): string {
    return this.configService.get<string>('ESMS_API_URL') || '';
  }

  private get apiKey(): string {
    return this.configService.get<string>('ESMS_API_KEY') || '';
  }

  private get secretKey(): string {
    return this.configService.get<string>('ESMS_SECRET_KEY') || '';
  }

  /** 8 = gửi bằng đầu số ngẫu nhiên (khi chưa đăng ký Brandname). Có thể đổi 2 nếu 8 lỗi. */
  private get smsType(): number {
    const raw = this.configService.get<string>('ESMS_SMS_TYPE');
    const parsed = raw ? Number(raw) : 8;
    return Number.isFinite(parsed) ? parsed : 8;
  }

  /** Chuỗi rỗng bắt buộc khi không có Brandname (tránh lỗi 118 SmsType is not valid). */
  private get brandName(): string {
    const v = this.configService.get<string>('ESMS_BRANDNAME');
    return v && v.trim() !== '' ? v.trim() : '';
  }

  async sendSms(phone: string, content: string): Promise<EsmsSendResult> {
    // Công tắc an toàn: mặc định KHÔNG gửi SMS thật khi dev/test.
    // Bật bằng cách set ENABLE_REAL_SMS=true trong .env và restart backend.
    if (!this.isRealSmsEnabled) {
      this.logger.warn('[MOCK SMS] Đã chặn gửi tin nhắn thật (ENABLE_REAL_SMS=false).');
      this.logger.log(`[MOCK SMS] Nội dung gửi tới ${phone}: ${content}`);
      return { status: 'mocked', message: 'SMS sending is disabled via ENABLE_REAL_SMS', phone, content };
    }

    if (!this.apiUrl || !this.apiKey || !this.secretKey) {
      throw new Error(
        'Thiếu cấu hình eSMS. Vui lòng set ESMS_API_URL, ESMS_API_KEY, ESMS_SECRET_KEY trong .env',
      );
    }

    try {
      const params = new URLSearchParams({
        Phone: phone,
        Content: content,
        ApiKey: this.apiKey,
        SecretKey: this.secretKey,
        SmsType: String(this.smsType),
        Brandname: this.brandName, // Bắt buộc gửi (rỗng '' nếu không có Brandname)
      });

      const url = `${this.apiUrl}${this.apiUrl.includes('?') ? '&' : '?'}${params.toString()}`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`eSMS HTTP ${response.status}: ${text}`);
      }

      const data = (await response.json()) as EsmsSendResult;
      this.logger.log(`Gửi SMS tới ${phone} OK: ${JSON.stringify(data)}`);
      return data;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      this.logger.error(`Gửi SMS tới ${phone} FAILED: ${errMsg}`);
      throw error;
    }
  }
}
