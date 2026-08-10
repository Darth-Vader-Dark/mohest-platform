import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please configure it in your Vercel project settings or local .env file.',
      );
    }

    super({
      datasources: {
        db: { url: dbUrl },
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
