import { Injectable, OnModuleDestroy } from '@nestjs/common';

// Try to load PrismaClient — if prisma generate hasn't run, this import
// will fail and crash the entire NestJS module tree.
let PrismaClientRef: any;
try {
  PrismaClientRef = require('@prisma/client').PrismaClient;
} catch (err) {
  console.error('[DB] @prisma/client not found. Run `npx prisma generate` first. Error:', (err as Error).message);
  // Provide a stub so the module tree doesn't crash during initialization.
  // Actual DB calls will throw with a clear error.
  PrismaClientRef = class {
    constructor() {
      throw new Error('PrismaClient is not available. Run `npx prisma generate` and redeploy.');
    }
  };
}

@Injectable()
export class PrismaService extends PrismaClientRef implements OnModuleDestroy {
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
