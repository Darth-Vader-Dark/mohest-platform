import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermissions decorator on this route → JWT auth alone is enough.
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.sub;
    if (!userId) throw new ForbiddenException('Not authenticated.');

    // Every permission the user holds, resolved through their current
    // roles. This is a live database read on every request rather than
    // baked into the JWT, so revoking a permission takes effect
    // immediately instead of waiting for the token to expire.
    const userPermissions = await this.prisma.permission.findMany({
      where: {
        roles: {
          some: {
            role: {
              users: {
                some: { userId },
              },
            },
          },
        },
      },
      select: { key: true },
    });

    const heldKeys = new Set(userPermissions.map((p) => p.key));
    const hasAll = required.every((key) => heldKeys.has(key));

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }
    return true;
  }
}
