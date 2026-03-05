import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommunityModule } from './community/community.module';
import { ModerationModule } from './moderation/moderation.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({ ttl: 60, limit: 30 }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CommunityModule,
    ModerationModule,
    UsersModule,
  ],
})
export class AppModule {}
