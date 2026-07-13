import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('departments.read')
  @ApiOperation({ summary: 'List departments (including future ones — no code change needed to add more)' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  @RequirePermissions('departments.create')
  @ApiOperation({ summary: 'Create a new department, e.g. Finance, Procurement, Legal' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Delete(':id')
  @RequirePermissions('departments.create')
  @ApiOperation({ summary: 'Delete a department' })
  delete(@Param('id') id: string) {
    return this.departmentsService.delete(id);
  }
}
