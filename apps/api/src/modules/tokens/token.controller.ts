import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TokenService } from './token.service';

type AuthUser = { id: string };

@Controller('/tokens')
@UseGuards(JwtAuthGuard)
export class TokenController {
  constructor(private readonly tokens: TokenService) {}

  @Get('/balance')
  async getBalance(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.tokens.getBalance(user.id);
  }

  @Get('/transactions')
  async getTransactions(@Request() req: ExpressRequest) {
    const user = req.user as AuthUser;
    return this.tokens.getTransactions(user.id);
  }
}
