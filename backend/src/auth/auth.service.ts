import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: parseInt(process.env.ARGON2_MEMORY_COST ?? '19456', 10),
  timeCost: parseInt(process.env.ARGON2_TIME_COST ?? '2', 10),
  parallelism: parseInt(process.env.ARGON2_PARALLELISM ?? '1', 10),
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTS);
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        department: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Deliberately identical error for "no such user" and "wrong password"
    // so the login endpoint doesn't leak which emails are registered —
    // there is no public self-registration, so this matters more here
    // than on a consumer app.
    const invalidCredentials = () =>
      new UnauthorizedException('Invalid email or password.');

    if (!user || !user.isActive) throw invalidCredentials();

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw invalidCredentials();

    const accessToken = await this.signAccessToken(user.id, user.email);
    const refreshToken = await this.issueRefreshToken(user.id);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth.login',
          entityType: 'User',
          entityId: user.id,
          ipAddress: meta.ip,
          metadata: { userAgent: meta.userAgent },
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mustResetPassword: user.mustResetPassword,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
        } : null,
        roles: user.roles.map((ur) => ur.role.name),
      },
    };
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!record || !record.user.isActive) {
      throw new ForbiddenException('Refresh token is invalid or expired.');
    }

    // Rotate: revoke the used token and issue a new one. If a revoked
    // token is ever presented again, that's a strong signal of theft —
    // a production build should revoke the whole session family here.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = await this.signAccessToken(
      record.user.id,
      record.user.email,
    );
    const newRefreshToken = await this.issueRefreshToken(record.user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, rawToken?: string) {
    if (rawToken) {
      const tokenHash = this.hashToken(rawToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.prisma.auditLog.create({
      data: { userId, action: 'auth.logout', entityType: 'User', entityId: userId },
    });
  }

  private async signAccessToken(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as `${number}m`,
      },
    );
  }

  private async issueRefreshToken(userId: string) {
    const raw = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.parseDays(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'),
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return raw;
  }

  // Refresh tokens are stored hashed (never in plaintext), same principle
  // as passwords — a leaked database shouldn't hand out usable tokens.
  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private parseDays(expr: string): number {
    const match = /^(\d+)d$/.exec(expr);
    return match ? parseInt(match[1], 10) : 7;
  }
}
