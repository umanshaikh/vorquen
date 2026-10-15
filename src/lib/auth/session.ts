import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '../db/prisma';
import { Role, UserSession } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_fashionhub_dev_key';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'fashionhub_session';

export function signSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<UserSession> {
  const user = await requireAuth();
  const hasRole = user.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
