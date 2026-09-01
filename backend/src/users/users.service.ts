import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(dto: CreateUserDto, createdByUserId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('A user with this email already exists.');

    const passwordHash = await this.authService.hashPassword(dto.temporaryPassword);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          departmentId: dto.departmentId,
          passwordHash,
          mustResetPassword: true,
          createdBy: createdByUserId,
          roles: {
            create: dto.roleIds.map((roleId) => ({ roleId })),
          },
        },
        include: { roles: { include: { role: true } }, department: true },
      });

      await tx.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'user.create',
          entityType: 'User',
          entityId: created.id,
          metadata: { email: created.email, roleIds: dto.roleIds },
        },
      });

      return created;
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        lastLoginAt: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        roles: { select: { role: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: any, operatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Clear previous roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      const updated = await tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          departmentId: dto.departmentId,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          roles: {
            create: dto.roleIds.map((roleId: string) => ({ roleId })),
          },
        },
        include: { roles: { include: { role: true } }, department: true },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'user.update',
          entityType: 'User',
          entityId: id,
          metadata: { email: updated.email, roleIds: dto.roleIds },
        },
      });

      const { passwordHash: _omit, ...safeUser } = updated;
      return safeUser;
    });
  }

  async resetPassword(id: string, dto: any, operatorId: string) {
    const passwordHash = await this.authService.hashPassword(dto.temporaryPassword);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          passwordHash,
          mustResetPassword: true,
        },
      });

      // Revoke all existing refresh tokens for this user so any
      // previously stolen tokens are immediately invalidated.
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'user.reset_password',
          entityType: 'User',
          entityId: id,
          metadata: { email: updated.email },
        },
      });

      return { success: true };
    });
  }

  async delete(id: string, operatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'user.delete',
          entityType: 'User',
          entityId: id,
          metadata: { email: user.email },
        },
      });

      return { success: true };
    });
  }
}
