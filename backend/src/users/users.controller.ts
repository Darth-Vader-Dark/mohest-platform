import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List staff accounts' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a staff account (ICT administrators only)' })
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const createdBy = (req.user as { sub: string }).sub;
    return this.usersService.create(dto, createdBy);
  }

  @Put(':id')
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Update staff account settings' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    const operatorId = (req.user as { sub: string }).sub;
    return this.usersService.update(id, dto, operatorId);
  }

  @Put(':id/reset-password')
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Reset staff account password' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto, @Req() req: Request) {
    const operatorId = (req.user as { sub: string }).sub;
    return this.usersService.resetPassword(id, dto, operatorId);
  }

  @Delete(':id')
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Delete staff account' })
  delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const operatorId = (req.user as { sub: string }).sub;
    return this.usersService.delete(id, operatorId);
  }
}
