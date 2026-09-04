import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { execSync } from 'child_process';
import { AppModule } from '../backend/src/app.module';
import type { IncomingMessage, ServerResponse } from 'http';

import * as express from 'express';

let cachedApp: NestExpressApplication | null = null;
let migrationsRun = false;

const HR_TABLES_MIGRATION = [
  `CREATE TABLE IF NOT EXISTS "leave_requests" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "leaveType" TEXT NOT NULL, "fromDate" TIMESTAMP(3) NOT NULL, "toDate" TIMESTAMP(3) NOT NULL, "days" INTEGER NOT NULL, "reason" TEXT, "status" TEXT NOT NULL DEFAULT 'Pending', "approvedBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "attendance_records" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "checkIn" TEXT, "checkOut" TEXT, "hours" DOUBLE PRECISION, "status" TEXT NOT NULL DEFAULT 'Present', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "performance_reviews" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "reviewPeriod" TEXT NOT NULL, "score" DOUBLE PRECISION NOT NULL, "rating" TEXT NOT NULL, "reviewer" TEXT, "comments" TEXT, "status" TEXT NOT NULL DEFAULT 'Completed', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "training_programs" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "duration" TEXT, "startDate" TIMESTAMP(3), "maxEnroll" INTEGER NOT NULL DEFAULT 20, "status" TEXT NOT NULL DEFAULT 'Upcoming', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "training_enrollments" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "programId" TEXT NOT NULL, "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "discipline_actions" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "actionType" TEXT NOT NULL, "severity" TEXT, "incident" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "status" TEXT NOT NULL DEFAULT 'Open', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "discipline_actions_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "separation_records" ("id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "separationType" TEXT NOT NULL, "lastWorkingDay" TIMESTAMP(3) NOT NULL, "reason" TEXT, "benefitsCleared" BOOLEAN NOT NULL DEFAULT false, "status" TEXT NOT NULL DEFAULT 'In Progress', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "separation_records_pkey" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "leave_requests_employeeId_idx" ON "leave_requests"("employeeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_employeeId_date_key" ON "attendance_records"("employeeId", "date")`,
  `CREATE INDEX IF NOT EXISTS "attendance_records_employeeId_idx" ON "attendance_records"("employeeId")`,
  `CREATE INDEX IF NOT EXISTS "performance_reviews_employeeId_idx" ON "performance_reviews"("employeeId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "training_enrollments_employeeId_programId_key" ON "training_enrollments"("employeeId", "programId")`,
  `CREATE INDEX IF NOT EXISTS "training_enrollments_employeeId_idx" ON "training_enrollments"("employeeId")`,
  `CREATE INDEX IF NOT EXISTS "training_enrollments_programId_idx" ON "training_enrollments"("programId")`,
  `CREATE INDEX IF NOT EXISTS "discipline_actions_employeeId_idx" ON "discipline_actions"("employeeId")`,
  `CREATE INDEX IF NOT EXISTS "separation_records_employeeId_idx" ON "separation_records"("employeeId")`);

async function runMigrations(): Promise<void> {
  if (migrationsRun || !process.env.DATABASE_URL) return;
  migrationsRun = true;

  // Try prisma migrate deploy first
  try {
    console.log('[DB] Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy --schema=backend/prisma/schema.prisma', {
      timeout: 60_000,
      stdio: 'pipe',
    });
    console.log('[DB] Migrations applied successfully via prisma migrate deploy.');
    return;
  } catch (err: any) {
    console.log('[DB] prisma migrate deploy failed or not available, trying fallback SQL...', err?.stderr?.toString() || err?.message);
  }

  // Fallback: run CREATE TABLE IF NOT EXISTS directly via PrismaClient
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    for (const sql of HR_TABLES_MIGRATION) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e: any) {
        // Table already exists — expected
        if (!e?.message?.includes('already exists')) {
          console.warn('[DB] SQL warning:', e?.message);
        }
      }
    }
    console.log('[DB] Fallback migration completed.');
    await prisma.$disconnect();
  } catch (err: any) {
    console.error('[DB] Fallback migration failed (non-fatal):', err?.message);
  }
}

async function createApp(): Promise<NestExpressApplication> {
  if (cachedApp) return cachedApp;

  // Run migrations on first cold start, before NestJS initializes
  await runMigrations();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  cachedApp = app;
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await createApp();
    const expressInstance = app.getHttpAdapter().getInstance();
    return expressInstance(req, res);
  } catch (err: any) {
    console.error('=== VERCEL 500 ERROR ===');
    console.error('URL:', req.method, req.url);
    console.error('Error:', err?.message || err);
    console.error('Stack:', err?.stack);
    console.error('JWT_ACCESS_SECRET set:', !!process.env.JWT_ACCESS_SECRET);
    console.error('DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.error('========================');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      statusCode: 500,
      message: 'Internal server error',
      hint: `JWT: ${!!process.env.JWT_ACCESS_SECRET}, DB: ${!!process.env.DATABASE_URL}`,
    }));
  }
}
