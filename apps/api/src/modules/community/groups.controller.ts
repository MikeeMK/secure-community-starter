import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';

@Controller('/community/groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  async listGroups() {
    return this.groups.listGroups();
  }

  @Get('/:id')
  async getGroup(@Param('id') id: string) {
    return this.groups.getGroup(id);
  }
}
