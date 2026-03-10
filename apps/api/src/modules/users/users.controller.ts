import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from './users.service';

const UpdateRoleDto = z.object({
  trustLevel: z.enum(['new', 'member', 'moderator', 'super_admin']),
});

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

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
  async updateRole(@Param('id') id: string, @Body() body: unknown) {
    const { trustLevel } = UpdateRoleDto.parse(body);
    return this.users.updateRole(id, trustLevel);
  }

  /** Delete a user — super_admin only */
  @Delete('/:id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: string) {
    return this.users.deleteUser(id);
  }
}
