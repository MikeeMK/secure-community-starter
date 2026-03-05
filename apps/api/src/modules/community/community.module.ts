import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { SidebarController } from './sidebar.controller';
import { SidebarService } from './sidebar.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ForumController, GroupsController, SidebarController],
  providers: [ForumService, GroupsService, SidebarService],
})
export class CommunityModule {}
