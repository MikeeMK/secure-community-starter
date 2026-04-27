import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommunityModule } from './community/community.module';
import { ModerationModule } from './moderation/moderation.module';
import { UsersModule } from './users/users.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NewsModule } from './news/news.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { ChatModule } from './chat/chat.module';
import { AccountModule } from './account/account.module';
import { TokenModule } from './tokens/token.module';
import { FaqModule } from './faq/faq.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({ ttl: 60, limit: 30 }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CommunityModule,
    ModerationModule,
    UsersModule,
    FeedbackModule,
    NewsModule,
    NotificationsModule,
    ProfileModule,
    ChatModule,
    AccountModule,
    TokenModule,
    FaqModule,
    PlanModule,
  ],
})
export class AppModule {}
