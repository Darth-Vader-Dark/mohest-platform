import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('[DB] DATABASE_URL not set — database queries will fail. Set it in your environment variables.');
    }

    super({
      datasources: {
        db: { url: dbUrl || 'postgresql://localhost:5432/fallback' },
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
