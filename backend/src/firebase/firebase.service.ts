import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

export interface FirebaseDecodedToken {
  uid: string;
  phone_number?: string;
  email?: string;
  [key: string]: any;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      this.app = admin.app();
    } catch {
      // Chưa có app
    }
    if (this.app) return;

    const accountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    const accountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

    if (accountPath) {
      const resolved = path.resolve(process.cwd(), accountPath);
      try {
        this.app = admin.initializeApp({ credential: admin.credential.cert(resolved) });
        this.logger.log(`Firebase Admin initialized from file: ${resolved}`);
      } catch (e: any) {
        this.logger.error(`Firebase init failed: ${e?.message || e}`);
      }
    } else if (accountJson) {
      try {
        const parsed = JSON.parse(accountJson);
        this.app = admin.initializeApp({ credential: admin.credential.cert(parsed) });
        this.logger.log('Firebase Admin initialized from env JSON');
      } catch (e: any) {
        this.logger.error(`Firebase init from JSON failed: ${e?.message || e}`);
      }
    } else {
      this.logger.warn('Firebase Admin: chưa cấu hình FIREBASE_SERVICE_ACCOUNT_PATH hoặc FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }

  isReady(): boolean {
    return this.app != null;
  }

  async verifyIdToken(idToken: string): Promise<FirebaseDecodedToken> {
    if (!this.app) {
      throw new Error('Firebase Admin chưa được cấu hình. Vui lòng set FIREBASE_SERVICE_ACCOUNT_PATH trong .env');
    }
    const decoded = await admin.auth(this.app).verifyIdToken(idToken);
    return decoded as FirebaseDecodedToken;
  }
}
