import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeSearchInput } from '../common/sanitize';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/create-employee.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';

@ApiTags('hr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hr')
export class HrController {
  constructor(private prisma: PrismaService) {}

  @Get('departments')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List departments for HR forms (no departments.read needed)' })
  async findDepartments() {
    return this.prisma.department.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('employees')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List all employees' })
  async findEmployees(@Query('search') search?: string) {
    const safeSearch = sanitizeSearchInput(search);
    return this.prisma.employee.findMany({
      where: safeSearch
        ? {
            OR: [
              { firstName: { contains: safeSearch, mode: 'insensitive' } },
              { lastName: { contains: safeSearch, mode: 'insensitive' } },
              { employeeNumber: { contains: safeSearch, mode: 'insensitive' } },
            ],
          }
        : {},
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        qualifications: true,
      },
      orderBy: { hireDate: 'desc' },
    });
  }

  @Post('employees')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Create new employee profile' })
  async createEmployee(@Body() dto: CreateEmployeeDto, @Req() req: Request) {
    const operatorId = (req.user as { sub: string }).sub;

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeNumber: dto.employeeNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender || null,
          nationalId: dto.nationalId || null,
          phone: dto.phone || null,
          personalEmail: dto.personalEmail || null,
          photoUrl: dto.photoUrl || null,
          departmentId: dto.departmentId,
          position: dto.position,
          employmentType: dto.employmentType,
          hireDate: new Date(dto.hireDate),
          status: dto.status || 'Active',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'employee.create',
          entityType: 'Employee',
          entityId: employee.id,
          metadata: { name: `${dto.firstName} ${dto.lastName}`, employeeNumber: dto.employeeNumber },
        },
      });

      return employee;
    });
  }

  @Put('employees/:id')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Update employee details' })
  async updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: Request,
  ) {
    const operatorId = (req.user as { sub: string }).sub;

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id },
        data: {
          employeeNumber: dto.employeeNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender || null,
          nationalId: dto.nationalId || null,
          phone: dto.phone || null,
          personalEmail: dto.personalEmail || null,
          photoUrl: dto.photoUrl || null,
          departmentId: dto.departmentId,
          position: dto.position,
          employmentType: dto.employmentType,
          hireDate: new Date(dto.hireDate),
          status: dto.status,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'employee.update',
          entityType: 'Employee',
          entityId: employee.id,
          metadata: { name: `${dto.firstName} ${dto.lastName}`, position: dto.position },
        },
      });

      return employee;
    });
  }

  @Delete('employees/:id')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Delete employee profile' })
  async deleteEmployee(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const operatorId = (req.user as { sub: string }).sub;

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorId,
          action: 'employee.delete',
          entityType: 'Employee',
          entityId: id,
          metadata: { name: `${employee.firstName} ${employee.lastName}` },
        },
      });

      return employee;
    });
  }

  @Post('employees/:id/qualifications')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Add a qualification to employee profile' })
  async addQualification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQualificationDto,
  ) {
    return this.prisma.qualification.create({
      data: {
        employeeId: id,
        level: dto.level,
        fieldOfStudy: dto.fieldOfStudy,
        institution: dto.institution,
        yearAwarded: dto.yearAwarded,
        certificateUrl: dto.certificateUrl || null,
      },
    });
  }

  @Delete('qualifications/:id')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Remove a qualification' })
  async removeQualification(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.qualification.delete({
      where: { id },
    });
  }
}
