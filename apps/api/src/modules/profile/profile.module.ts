import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../tokens/token.module';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [PrismaModule, TokenModule, PlanModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
