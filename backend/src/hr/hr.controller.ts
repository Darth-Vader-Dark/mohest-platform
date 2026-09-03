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
import { CreateLeaveDto, UpdateLeaveStatusDto } from './dto/create-leave.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { CreateTrainingDto, EnrollTrainingDto } from './dto/create-training.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { CreateSeparationDto } from './dto/create-separation.dto';
import { CreatePositionDto } from './dto/create-position.dto';

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

  // ════════════════════════════════════════════════════════════
  // DEPARTMENTS (for HR forms)
  // ════════════════════════════════════════════════════════════

  @Get('stats')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'Get HR dashboard statistics' })
  async getStats() {
    const [totalEmployees, activeEmployees, onLeaveEmployees, deptCount, pendingLeave, totalTransfers, totalPromotions] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'Active' } }),
      this.prisma.employee.count({ where: { status: 'OnLeave' } }),
      this.prisma.department.count(),
      this.prisma.leaveRequest.count({ where: { status: 'Pending' } }),
      this.prisma.departmentTransfer.count(),
      this.prisma.promotion.count(),
    ]);
    return { totalEmployees, activeEmployees, onLeaveEmployees, deptCount, pendingLeave, totalTransfers, totalPromotions };
  }

  // ════════════════════════════════════════════════════════════
  // ESTABLISHMENT & POSITIONS
  // ════════════════════════════════════════════════════════════

  @Get('positions')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List establishment positions with headcount' })
  async findPositions() {
    const depts = await this.prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = Object.fromEntries(depts.map((d: { id: string; name: string }) => [d.id, d.name]));
    // Group employees by position + department to create virtual positions
    const employees = await this.prisma.employee.findMany({ select: { position: true, departmentId: true, status: true } });
    const posMap = new Map<string, { title: string; deptId: string; dept: string; sanctioned: number; filled: number }>();
    for (const e of employees) {
      const key = `${e.position}|${e.departmentId}`;
      if (!posMap.has(key)) {
        posMap.set(key, { title: e.position, deptId: e.departmentId, dept: deptMap[e.departmentId] || 'Unknown', sanctioned: 0, filled: 0 });
      }
      const p = posMap.get(key)!;
      p.sanctioned++;
      if (e.status === 'Active') p.filled++;
    }
    return Array.from(posMap.values()).map((p, i) => ({ id: `pos-${i}`, ...p, vacant: p.sanctioned - p.filled }));
  }

  // ════════════════════════════════════════════════════════════
  // LEAVE & ABSENCE
  // ════════════════════════════════════════════════════════════

  @Get('leave')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List all leave requests' })
  async findLeave() {
    return this.prisma.leaveRequest.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('leave')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Create a leave request' })
  async createLeave(@Body() dto: CreateLeaveDto) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        days: dto.days,
        reason: dto.reason || null,
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  @Put('leave/:id/status')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  async updateLeaveStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveStatusDto,
    @Req() req: Request,
  ) {
    const operatorId = (req.user as { sub: string }).sub;
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: dto.status, approvedBy: operatorId },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  // ════════════════════════════════════════════════════════════
  // ATTENDANCE
  // ════════════════════════════════════════════════════════════

  @Get('attendance')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List attendance records (optionally filter by date)' })
  async findAttendance(@Query('date') date?: string) {
    const where: any = {};
    if (date) {
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
    return this.prisma.attendanceRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { date: 'desc' },
    });
  }

  @Post('attendance')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Record attendance' })
  async createAttendance(@Body() dto: CreateAttendanceDto) {
    return this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date: new Date(dto.date) } },
      update: {
        checkIn: dto.checkIn || undefined,
        checkOut: dto.checkOut || undefined,
        hours: dto.hours || undefined,
        status: dto.status || undefined,
      },
      create: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        hours: dto.hours || null,
        status: dto.status || 'Present',
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  // ════════════════════════════════════════════════════════════
  // PERFORMANCE REVIEWS
  // ════════════════════════════════════════════════════════════

  @Get('performance')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List performance reviews' })
  async findPerformance() {
    return this.prisma.performanceReview.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('performance')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Create a performance review' })
  async createPerformance(@Body() dto: CreatePerformanceDto) {
    const rating = dto.score >= 4.5 ? 'Outstanding' : dto.score >= 4 ? 'Exceeds Expectations' : dto.score >= 3 ? 'Meets Expectations' : dto.score >= 2 ? 'Needs Improvement' : 'Unsatisfactory';
    return this.prisma.performanceReview.create({
      data: {
        employeeId: dto.employeeId,
        reviewPeriod: dto.reviewPeriod,
        score: dto.score,
        rating,
        reviewer: dto.reviewer || null,
        comments: dto.comments || null,
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  // ════════════════════════════════════════════════════════════
  // TRAINING & DEVELOPMENT
  // ════════════════════════════════════════════════════════════

  @Get('training')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List training programs with enrollment counts' })
  async findTraining() {
    const programs = await this.prisma.trainingProgram.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return programs.map((p: any) => ({ ...p, enrolled: p._count.enrollments }));
  }

  @Post('training')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Create a training program' })
  async createTraining(@Body() dto: CreateTrainingDto) {
    return this.prisma.trainingProgram.create({
      data: {
        name: dto.name,
        type: dto.type,
        duration: dto.duration || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        maxEnroll: dto.maxEnroll || 20,
      },
    });
  }

  @Post('training/enroll')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Enroll an employee in a training program' })
  async enrollTraining(@Body() dto: EnrollTrainingDto) {
    return this.prisma.trainingEnrollment.create({
      data: { employeeId: dto.employeeId, programId: dto.programId },
    });
  }

  // ════════════════════════════════════════════════════════════
  // DISCIPLINE & GRIEVANCES
  // ════════════════════════════════════════════════════════════

  @Get('discipline')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List discipline records' })
  async findDiscipline() {
    return this.prisma.disciplineAction.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('discipline')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Record a disciplinary action' })
  async createDiscipline(@Body() dto: CreateDisciplineDto) {
    return this.prisma.disciplineAction.create({
      data: {
        employeeId: dto.employeeId,
        actionType: dto.actionType,
        severity: dto.severity || null,
        incident: dto.incident,
        date: new Date(dto.date),
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  // ════════════════════════════════════════════════════════════
  // RETIREMENT & SEPARATION
  // ════════════════════════════════════════════════════════════

  @Get('separations')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List separation records' })
  async findSeparations() {
    return this.prisma.separationRecord.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('separations')
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Record a separation' })
  async createSeparation(@Body() dto: CreateSeparationDto) {
    return this.prisma.separationRecord.create({
      data: {
        employeeId: dto.employeeId,
        separationType: dto.separationType,
        lastWorkingDay: new Date(dto.lastWorkingDay),
        reason: dto.reason || null,
        benefitsCleared: dto.benefitsCleared || false,
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    });
  }

  // ════════════════════════════════════════════════════════════
  // RECRUITMENT
  // ════════════════════════════════════════════════════════════

  @Get('recruitment')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List recruitment postings' })
  async findRecruitment(): Promise<any[]> {
    // Recruitment postings — not yet in schema, return empty array
    return [];
  }

  // ════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════════════

  @Get('notifications')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'Get HR notifications (pending leaves, etc.)' })
  async findNotifications(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ════════════════════════════════════════════════════════════
  // REPORTS — CHART DATA
  // ════════════════════════════════════════════════════════════

  @Get('reports/charts')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'Get chart data for reports dashboard' })
  async getChartData() {
    const employees = await this.prisma.employee.findMany({
      select: { gender: true, employmentType: true, departmentId: true, hireDate: true, status: true },
    });
    const depts = await this.prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = Object.fromEntries(depts.map((d: { id: string; name: string }) => [d.id, d.name]));

    const genderDist = { Male: 0, Female: 0, Other: 0 };
    const typeDist = { Permanent: 0, Contract: 0, Temporary: 0, Probation: 0 };
    const deptDist: Record<string, number> = {};
    const leaveStats = await this.prisma.leaveRequest.groupBy({ by: ['status'], _count: true });
    const attStats = await this.prisma.attendanceRecord.groupBy({ by: ['status'], _count: true });

    for (const e of employees) {
      if (e.gender === 'Male') genderDist.Male++;
      else if (e.gender === 'Female') genderDist.Female++;
      else genderDist.Other++;

      if (e.employmentType in typeDist) typeDist[e.employmentType as keyof typeof typeDist]++;

      const deptName = deptMap[e.departmentId] || 'Unknown';
      deptDist[deptName] = (deptDist[deptName] || 0) + 1;
    }

    const avgTenure = employees.length
      ? employees.reduce((s: number, e: { hireDate: Date }) => s + (Date.now() - new Date(e.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000), 0) / employees.length
      : 0;

    return {
      genderDist,
      typeDist,
      deptDist,
      avgTenure: Math.round(avgTenure * 10) / 10,
      totalPositions: 0,
      leaveByStatus: Object.fromEntries(leaveStats.map((s: any) => [s.status, s._count])),
      attendanceByStatus: Object.fromEntries(attStats.map((s: any) => [s.status, s._count])),
    };
  }
}

