import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List all configurable user roles' })
  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                key: true,
                module: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  @Get('permissions')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'List all permissions available in the system' })
  async findPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
  }

  @Post()
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Create a custom role with permissions' })
  async create(@Body() body: { name: string; description?: string; permissionIds?: string[] }) {
    if (!body.name) {
      throw new HttpException('Role name is required', HttpStatus.BAD_REQUEST);
    }

    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: body.name },
    });
    if (existing) {
      throw new HttpException('Role with this name already exists', HttpStatus.BAD_REQUEST);
    }

    const permissionIds = body.permissionIds || [];

    return this.prisma.role.create({
      data: {
        name: body.name,
        description: body.description || null,
        isSystem: false,
        permissions: {
          create: permissionIds.map((pid) => ({
            permissionId: pid,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  @Delete(':id')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Delete a custom role' })
  async delete(@Param('id') id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });
    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    if (role.isSystem) {
      throw new HttpException('System roles cannot be deleted', HttpStatus.FORBIDDEN);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
