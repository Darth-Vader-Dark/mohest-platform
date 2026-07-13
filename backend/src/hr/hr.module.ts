import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HrController],
})
export class HrModule {}
