import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ForumController, GroupsController],
  providers: [ForumService, GroupsService],
})
export class CommunityModule {}
