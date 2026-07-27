import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [Reflector, PermissionsGuard],
  exports: [Reflector, PermissionsGuard],
})
export class RbacModule {}
