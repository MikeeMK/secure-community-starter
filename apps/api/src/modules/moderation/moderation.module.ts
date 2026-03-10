import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../tokens/token.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [PrismaModule, AuthModule, TokenModule],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
