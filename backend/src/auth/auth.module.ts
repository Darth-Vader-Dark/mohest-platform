import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret) {
  throw new Error('JWT_ACCESS_SECRET environment variable is required but not set.');
}

const jwtSignOptions: JwtModuleOptions['signOptions'] = {
  expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as `${number}m`,
};

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtAccessSecret,
      signOptions: jwtSignOptions,
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
