import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import prisma from '../db/prisma';
import { Role, UserSession } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'vorquen_ultra_secure_jwt_secret_token_2026_production_key';
export const CUSTOMER_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'vorquen_customer_session';
export const ADMIN_COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || 'vorquen_admin_session';

// Legacy fallback cookie
const LEGACY_CUSTOMER_COOKIE = 'fashionhub_session';

export function signSessionToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function signAdminSessionToken(session: UserSession): string {
  return jwt.sign(
    { ...session, isAdminSession: true },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifySessionToken(token: string): (UserSession & { isAdminSession?: boolean }) | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession & { isAdminSession?: boolean };
  } catch {
    return null;
  }
}

/**
 * Reads customer session from cookie store.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token =
    cookieStore.get(CUSTOMER_COOKIE_NAME)?.value ||
    cookieStore.get(LEGACY_CUSTOMER_COOKIE)?.value;

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

/**
 * Server-side verified Admin/Owner authorization.
 * 1. Checks dedicated admin session cookie or Authorization header.
 * 2. Queries live database profile to confirm permissions.
 * 3. Enforces VORQUEN_OWNER_EMAIL configuration if set.
 * 4. Ensures customer tokens cannot access admin operations.
 */
export async function getAdminSession(): Promise<UserSession | null> {
  let token: string | undefined;

  try {
    const cookieStore = cookies();
    token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  } catch {
    // If running in contexts where cookies() is unavailable
  }

  if (!token) {
    try {
      const headersList = headers();
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    } catch {
      // Ignored
    }
  }

  if (!token) return null;

  const decoded = verifySessionToken(token);
  if (!decoded || !decoded.id || !decoded.isAdminSession) return null;

  // Strict live database authorization check
  const profile = await prisma.profile.findUnique({
    where: { id: decoded.id },
    include: { roles: true },
  });

  if (!profile) return null;

  const roles = profile.roles.map((r) => r.role as Role);
  const isOwner = Boolean(profile.isOwner || roles.includes('owner') || roles.includes('admin'));

  if (!isOwner) {
    return null;
  }

  // If VORQUEN_OWNER_EMAIL is configured in server environment, verify email strictly
  const configuredOwnerEmail = process.env.VORQUEN_OWNER_EMAIL?.trim().toLowerCase();
  if (configuredOwnerEmail && configuredOwnerEmail.length > 0) {
    if (profile.email.toLowerCase() !== configuredOwnerEmail) {
      console.warn(
        `[SECURITY WARNING] Admin access denied: Account ${profile.email} is not the configured VORQUEN_OWNER_EMAIL (${configuredOwnerEmail})`
      );
      return null;
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    roles,
    isOwner: true,
  };
}

/**
 * Guard for all administrative API routes and server actions.
 * Throws 401 UNAUTHORIZED or 403 FORBIDDEN if verification fails.
 */
export async function requireAdmin(): Promise<UserSession> {
  const admin = await getAdminSession();
  if (!admin) {
    throw new Error('UNAUTHORIZED_ADMIN_ACCESS');
  }
  return admin;
}
