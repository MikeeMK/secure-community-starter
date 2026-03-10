import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { EmailService } from './email.service';
import { LoginAttemptService } from './login-attempt.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenModule } from '../tokens/token.module';

@Module({
  imports: [
    PrismaModule,
    TokenModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'replace-with-secure-secret',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService, EmailService, LoginAttemptService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
