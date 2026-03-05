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
    return user;
  }
}
