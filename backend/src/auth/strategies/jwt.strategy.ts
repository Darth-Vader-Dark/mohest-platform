import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      console.error('[AUTH] JWT_ACCESS_SECRET not set — token verification will fail.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'MISSING_SECRET',
    });
  }

  async validate(payload: JwtPayload) {
    // Returned value becomes `request.user`. Kept intentionally small —
    // permission checks re-read from the database in PermissionsGuard
    // rather than trusting a stale token payload.
    return { sub: payload.sub, email: payload.email };
  }
}
