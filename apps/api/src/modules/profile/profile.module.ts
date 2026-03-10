import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../tokens/token.module';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
