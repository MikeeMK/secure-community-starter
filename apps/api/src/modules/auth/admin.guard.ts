import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

type AuthUser = { id: string; email: string; trustLevel: string };

/**
 * Must be used AFTER JwtAuthGuard so req.user is already populated.
 * Grants access only to super_admin users.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;

    if (!user) throw new ForbiddenException('Authentication required');

    if (user.trustLevel !== 'super_admin') {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

/**
 * Grants access to moderator OR super_admin users.
 */
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthUser | undefined;

    if (!user) throw new ForbiddenException('Authentication required');

    const isStaff = user.trustLevel === 'moderator' || user.trustLevel === 'super_admin';
    if (!isStaff) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
