import { Body, Controller, Post, Request, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';

const RegisterDto = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(32),
  password: z.string().min(8).max(128),
  turnstileToken: z.string().min(1),
});

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  turnstileToken: z.string().min(1).optional(),
});

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle(6, 60)
  @Post('/register')
  async register(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = RegisterDto.safeParse(body);
    if (!dto.success) {
      throw new BadRequestException(dto.error.message);
    }
    const result = await this.auth.register(dto.data.email, dto.data.displayName, dto.data.password, dto.data.turnstileToken, req.ip);
    return result;
  }

  @UseGuards(ThrottlerGuard)
  @Throttle(6, 60)
  @Post('/login')
  async login(@Body() body: unknown, @Request() req: ExpressRequest) {
    const dto = LoginDto.parse(body);
    return this.auth.login(dto.email, dto.password, dto.turnstileToken, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async me(@Request() req: ExpressRequest) {
    return { user: req.user };
  }
}
