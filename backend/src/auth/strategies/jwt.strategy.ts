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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'mohest-enterprise-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    // Returned value becomes `request.user`. Kept intentionally small —
    // permission checks re-read from the database in PermissionsGuard
    // rather than trusting a stale token payload.
    return { sub: payload.sub, email: payload.email };
  }
}
