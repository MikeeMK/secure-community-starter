import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

type AuthUser = { id: string; email: string; trustLevel: string };

/**
 * Must be used AFTER JwtAuthGuard so req.user is already populated.
 *
 * Grants access to users whose trustLevel is 'trusted' OR whose email
 * matches the ADMIN_EMAIL env variable.
 *
 * TODO: replace with a proper roles/permissions system when the platform grows.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;

    if (!user) throw new ForbiddenException('Authentication required');

    const adminEmail = process.env.ADMIN_EMAIL ?? '';
    const isAdmin = user.trustLevel === 'trusted' || (adminEmail && user.email === adminEmail);

    if (!isAdmin) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
