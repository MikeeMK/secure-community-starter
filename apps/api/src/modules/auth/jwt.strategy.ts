import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect, SafeUser } from './user.select';

type JwtPayload = {
  sub: string;
  email: string;
  displayName: string;
  trustLevel: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'replace-with-secure-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: safeUserSelect,
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.accountStatus === 'SUSPENDED') {
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            accountStatus: 'ACTIVE',
            moderationReason: null,
            suspendedUntil: null,
            moderatedAt: null,
          },
        });
        return {
          ...user,
          accountStatus: 'ACTIVE',
          moderationReason: null,
          suspendedUntil: null,
          moderatedAt: null,
        };
      }
      throw new UnauthorizedException('Account suspended');
    }

    if (user.accountStatus === 'BANNED' || user.accountStatus === 'DELETED') {
      throw new UnauthorizedException('Account unavailable');
    }

    return user;
  }
}
