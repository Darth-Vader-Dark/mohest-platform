import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const FALLBACK_DB_URL = "postgresql://postgres.qixrbxgkfbclvbsylxfl:IBekBYAoRSMjgp9W@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const dbUrl = (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('@'))
      ? process.env.DATABASE_URL
      : FALLBACK_DB_URL;

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
