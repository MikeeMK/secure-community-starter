import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

type AuthUser = { id: string };

const UpdateProfileDto = z.object({
  age: z.number().int().min(18).max(99).optional(),
  city: z.string().max(100).optional(),
  gender: z.string().max(50).optional(),
  orientation: z.string().max(50).optional(),
  relationshipStatus: z.string().max(50).optional(),
  lookingFor: z.array(z.string()).max(5).optional(),
  interactionType: z.array(z.string()).max(5).optional(),
  ageMin: z.number().int().min(18).max(99).optional(),
  ageMax: z.number().int().min(18).max(99).optional(),
  interests: z.array(z.string()).max(10).optional(),
  // Legacy bios can be longer in DB; the service only blocks over-limit values when edited.
  bio: z.string().optional(),
});

@Controller('/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/me')
  async getMe(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.profileService.getMyProfile(user.id);
  }

  @Patch('/me')
  async updateMe(@Body() body: unknown, @Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    const data = UpdateProfileDto.parse(body);
    return this.profileService.upsertProfile(user.id, data);
  }

  @Get('/members')
  async listMembers(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.profileService.listMembers(user.id);
  }
}
