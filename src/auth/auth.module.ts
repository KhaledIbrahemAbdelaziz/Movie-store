import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategies } from './strategies/jwt.strategy';
import { MailModule } from 'src/mail/mail.module';
import { IdempotencyModule } from 'src/idempotency/idempotency.module';
import { IdempotencyInterceptor } from 'src/common/Interceptors/idempotency.interceptor';
import { Throttle, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES'),
        },
      }),
      global: true,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    UsersModule,
    MailModule,
    IdempotencyModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategies, IdempotencyInterceptor],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
