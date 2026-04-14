import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountService } from './account.service';

type AuthUser = { id: string; email: string; trustLevel: string };

@Controller('/account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get()
  async getAccount(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.account.getAccount(user.id);
  }

  @Patch('/display-name')
  async updateDisplayName(@Body() body: unknown, @Request() req: ExpressRequest) {
    const { displayName } = z.object({ displayName: z.string().min(2).max(32) }).parse(body);
    const user = req.user as AuthUser;
    return this.account.updateDisplayName(user.id, displayName);
  }

  @Patch('/avatar')
  async updateAvatar(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = z.object({
      avatarUrl: z
        .string()
        .max(5_000_000)
        .refine(
          (value) => value.startsWith('data:image/') || value.startsWith('https://') || value.startsWith('http://'),
          'Format d avatar invalide',
        )
        .nullable(),
    }).parse(body);
    const user = req.user as AuthUser;
    return this.account.updateAvatar(user.id, dto.avatarUrl);
  }

  @Patch('/password')
  async changePassword(@Body() body: unknown, @Request() req: ExpressRequest) {
    const { newPassword } = z.object({
      newPassword: z.string().min(8).max(128),
    }).parse(body);
    const user = req.user as AuthUser;
    return this.account.changePassword(user.id, newPassword);
  }

  @Get('/settings')
  async getSettings(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.account.getSettings(user.id);
  }

  @Patch('/settings')
  async updateSettings(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = z.object({
      allowChat: z.boolean().optional(),
      hideFromSuggestions: z.boolean().optional(),
      allowNotifLikes: z.boolean().optional(),
    }).parse(body);
    const user = req.user as AuthUser;
    return this.account.updateSettings(user.id, dto);
  }
}
