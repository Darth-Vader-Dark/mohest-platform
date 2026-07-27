import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const FALLBACK_DB_URL = "postgresql://postgres.qixrbxgkfbclvbsylxfl:IBekBYAoRSMjgp9W@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?connection_limit=5";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.error('PrismaService connection error:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
