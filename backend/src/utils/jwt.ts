import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export type UserModel = 'Faculty' | 'Student';
export type ScopedRole = 'admin' | 'coordinator' | 'guide' | 'panel' | 'assistant' | 'student';

export interface IdentityTokenPayload extends JwtPayload {
  sub: string;
  userModel: UserModel;
  kind: 'identity';
}

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  userModel: UserModel;
  kind: 'access';
  role: ScopedRole;
  programId: string | null; // null only for admin
  tokenVersion: number;
}

export function signIdentityToken(userId: string, userModel: UserModel): string {
  const payload: IdentityTokenPayload = { sub: userId, userModel, kind: 'identity' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
}

export function signAccessToken(params: {
  userId: string;
  userModel: UserModel;
  role: ScopedRole;
  programId: string | null;
  tokenVersion: number;
}): string {
  const payload: AccessTokenPayload = {
    sub: params.userId,
    userModel: params.userModel,
    kind: 'access',
    role: params.role,
    programId: params.programId,
    tokenVersion: params.tokenVersion,
  };
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessLikeToken(token: string): IdentityTokenPayload | AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as IdentityTokenPayload | AccessTokenPayload;
}

export function signRefreshToken(userId: string, userModel: UserModel): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString('hex');
  const hash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  // We also embed identity in a signed wrapper so we don't need a DB round trip
  // just to know who the raw token belongs to before hash lookup.
  const wrapped = jwt.sign({ sub: userId, userModel, raw: token }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions['expiresIn'],
  });
  return { token: wrapped, hash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface RefreshTokenWrapper {
  sub: string;
  userModel: UserModel;
  raw: string;
}

export function verifyRefreshToken(token: string): RefreshTokenWrapper {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenWrapper;
}
