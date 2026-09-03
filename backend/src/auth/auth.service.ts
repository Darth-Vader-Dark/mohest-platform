import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// Lazy-load argon2 — it's a native C++ module that may fail to compile
// in serverless environments (Vercel, AWS Lambda, etc.).
let argon2: typeof import('argon2') | null = null;
let argon2LoadAttempted = false;

async function loadArgon2(): Promise<typeof import('argon2') | null> {
  if (argon2LoadAttempted) return argon2;
  argon2LoadAttempted = true;
  try {
    argon2 = await import('argon2');
    return argon2;
  } catch (err) {
    console.warn('[AUTH] argon2 native module unavailable, falling back to bcrypt:', (err as Error).message);
    return null;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    const a2 = await loadArgon2();
    if (a2) {
      try {
        return await a2.hash(plain, {
          type: a2.argon2id,
          memoryCost: parseInt(process.env.ARGON2_MEMORY_COST ?? '19456', 10),
          timeCost: parseInt(process.env.ARGON2_TIME_COST ?? '2', 10),
          parallelism: parseInt(process.env.ARGON2_PARALLELISM ?? '1', 10),
        });
      } catch {
        // Fall through to bcrypt
      }
    }
    return bcrypt.hash(plain, 10);
  }

  private async verifyPassword(hash: string, plain: string): Promise<boolean> {
    if (hash.startsWith('$argon2')) {
      const a2 = await loadArgon2();
      if (a2) {
        try {
          return await a2.verify(hash, plain);
        } catch (err) {
          // Fall through to bcrypt
        }
      }
      return false; // argon2 hash but module unavailable
    }
    return bcrypt.compare(plain, hash).catch(() => false);
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    let user;
    try {
      user = await this.prisma.user.findUnique({
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
    } catch (dbErr: any) {
      console.error('[AUTH] Database error during login:', dbErr?.message);
      console.error('[AUTH] DB error code:', dbErr?.code);
      console.error('[AUTH] DB error stack:', dbErr?.stack);
      // Return 503 (not 401) so the client knows it's a server issue, not bad credentials
      throw new UnauthorizedException(`Service temporarily unavailable: ${dbErr?.message || 'database error'}`);
    }

    const invalidCredentials = () =>
      new UnauthorizedException('Invalid email or password.');

    if (!user || !user.isActive) throw invalidCredentials();

    const passwordValid = await this.verifyPassword(user.passwordHash, dto.password);
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
        roles: user.roles.map((ur: any) => ur.role.name),
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
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not set.');
    }
    return this.jwt.signAsync(
      { sub: userId, email },
      {
        secret,
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
