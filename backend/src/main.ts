import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProd
      ? (allowedOrigins.length ? allowedOrigins : true)
      : (_origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) =>
          cb(null, true),
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

  const config = new DocumentBuilder()
    .setTitle('MoHEST Enterprise Portal API')
    .setDescription(
      'Authentication, RBAC, and shared platform services for the MoHEST enterprise portal.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MoHEST API listening on port ${port} — docs at /api/docs`);
}
bootstrap();

