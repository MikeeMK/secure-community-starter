import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { z } from 'zod';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const RegisterDto = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(32),
  password: z.string().min(8).max(128),
  // Optional: enforced by captcha.service when CLOUDFLARE_TURNSTILE_SECRET is set
  turnstileToken: z.string().optional(),
});

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  turnstileToken: z.string().optional(),
});

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle(5, 60)
  @Post('/register')
  async register(@Body() body: unknown, @Request() req: ExpressRequest) {
    const result = RegisterDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    const { email, displayName, password, turnstileToken } = result.data;
    return this.auth.register(email, displayName, password, turnstileToken, req.ip);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle(10, 60)
  @Post('/login')
  async login(@Body() body: unknown, @Request() req: ExpressRequest) {
    const result = LoginDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    const { email, password, turnstileToken } = result.data;
    return this.auth.login(email, password, turnstileToken, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  me(@Request() req: ExpressRequest) {
    // req.user is populated by JwtStrategy.validate() after DB lookup
    return { user: req.user };
  }
}
