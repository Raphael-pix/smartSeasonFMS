import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { passportJwtSecret, ExpressJwtOptions } from 'jwks-rsa';
import { JwtPayload, JwtUser } from '../types/request-user.type';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor() {
    const jwksOptions: ExpressJwtOptions = {
      cache: true,
      rateLimit: true,
      jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    };

    const strategyOptions: StrategyOptionsWithoutRequest = {
      secretOrKeyProvider: passportJwtSecret(jwksOptions),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: 'authenticated',
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      algorithms: ['ES256'],
    };

    super(strategyOptions);
  }

  validate(payload: JwtPayload): JwtUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
      fullName: payload.fullName,
    };
  }
}
