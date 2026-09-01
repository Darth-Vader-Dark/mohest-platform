import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

if (!process.env.JWT_ACCESS_SECRET) {
  console.error('[FATAL] JWT_ACCESS_SECRET is not set. Auth will fail. Set it in your environment variables.');
}

const jwtSignOptions: JwtModuleOptions['signOptions'] = {
  expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as `${number}m`,
};

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'MISSING_JWT_SECRET',
      signOptions: jwtSignOptions,
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
