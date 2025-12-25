import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';

import { ChatController } from './chat.controller'; // <--- Import
@Module({
    imports: [
        PrismaModule,
        ConfigModule,
        JwtModule.registerAsync({

            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                // Lấy giá trị từ biến môi trường, mặc định là '7d'
                const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';

                return {
                    secret: configService.get<string>('JWT_SECRET'),
                    signOptions: {
                        // Fix lỗi TS2322: Ép kiểu as any hoặc đảm bảo nó là string | number
                        expiresIn: expiresIn as any,
                    },
                };
            },
        }),
    ],
    controllers: [ChatController], // <--- Thêm dòng này
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
})
export class ChatModule { }