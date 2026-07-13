import { Module } from '@nestjs/common';
import { PublicSiteController } from './public-site.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicSiteController],
})
export class PublicSiteModule {}
