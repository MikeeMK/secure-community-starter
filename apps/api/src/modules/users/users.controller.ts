import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from './users.service';

const UpdateRoleDto = z.object({
  trustLevel: z.enum(['new', 'member', 'moderator', 'super_admin']),
});

const SanctionUserDto = z.object({
  action: z.enum([
    'ACTIVATE',
    'SUSPEND_7D',
    'SUSPEND_30D',
    'BAN_30D',
    'BAN_PERMANENT',
    'MUTE_CHAT_7D',
    'BLOCK_PUBLISH_30D',
    'BLOCK_REPLY_30D',
    'CLEAR_RESTRICTIONS',
  ]),
  reason: z.string().min(3).max(500),
});

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('/admin/:id')
  @UseGuards(AdminGuard)
  async getAdminUser(@Param('id') id: string) {
    return this.users.getAdminUser(id);
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.users.getUser(id);
  }

  /** List all users — super_admin only */
  @Get('/')
  @UseGuards(AdminGuard)
  async listUsers() {
    return this.users.listUsers();
  }

  /** Update a user's role — super_admin only */
  @Patch('/:id/role')
  @UseGuards(AdminGuard)
  async updateRole(@Param('id') id: string, @Body() body: unknown, @Request() req: { user: { id: string } }) {
    const { trustLevel } = UpdateRoleDto.parse(body);
    return this.users.updateRole(id, trustLevel, req.user.id);
  }

  @Post('/:id/sanction')
  @UseGuards(AdminGuard)
  async sanctionUser(@Param('id') id: string, @Body() body: unknown, @Request() req: { user: { id: string } }) {
    const dto = SanctionUserDto.parse(body);
    return this.users.sanctionUser(id, req.user.id, dto);
  }

  /** Delete a user — super_admin only */
  @Delete('/:id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.users.deleteUser(id, req.user.id);
  }
}
