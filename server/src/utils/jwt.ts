import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'qubix_enterprise_jwt_super_secret_key_2026_xyz!';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'qubix_enterprise_refresh_super_secret_key_2026_xyz!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  activeOrganizationId?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as any });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
};

