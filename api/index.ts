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

async function runMigrations(): Promise<void> {
  if (migrationsRun || !process.env.DATABASE_URL) return;
  migrationsRun = true;
  try {
    console.log('[DB] Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy --schema=backend/prisma/schema.prisma', {
      timeout: 60_000,
      stdio: 'pipe',
    });
    console.log('[DB] Migrations applied successfully.');
  } catch (err: any) {
    console.error('[DB] Migration failed (non-fatal):', err?.stderr?.toString() || err?.message);
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
