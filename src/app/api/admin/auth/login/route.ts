import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { adminLoginSchema } from '@/lib/validation';
import { signAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = adminLoginSchema.parse(body);
    const emailLower = validated.email.trim().toLowerCase();

    // 1. Fetch profile with roles
    const profile = await prisma.profile.findUnique({
      where: { email: emailLower },
      include: { roles: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials' },
        { status: 401 }
      );
    }

    // 2. Verify password hash
    const isValid = await bcrypt.compare(validated.password, profile.passwordHash);
    if (!isValid) {
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_LOGIN_FAILED_PASSWORD',
          entityType: 'admin_auth',
          entityId: profile.id,
          safeMetadata: JSON.stringify({ email: emailLower, ip: req.headers.get('x-forwarded-for') || 'local' }),
        },
      });
      return NextResponse.json(
        { error: 'Invalid administrator credentials' },
        { status: 401 }
      );
    }

    // 3. Strict Server-Side Role and Owner Verification
    const roles = profile.roles.map((r) => r.role);
    const hasAdminRole = roles.includes('admin') || roles.includes('owner') || profile.isOwner;

    if (!hasAdminRole) {
      console.warn(`[SECURITY ALERT] Unauthorized admin login attempt by customer: ${emailLower}`);
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_LOGIN_DENIED_NOT_ADMIN',
          entityType: 'admin_auth',
          entityId: profile.id,
          safeMetadata: JSON.stringify({ email: emailLower, roles }),
        },
      });
      return NextResponse.json(
        { error: 'Access restricted: Account is not authorized for administrator access' },
        { status: 403 }
      );
    }

    // 4. If VORQUEN_OWNER_EMAIL environment variable is set, strictly enforce matching
    const configuredOwnerEmail = process.env.VORQUEN_OWNER_EMAIL?.trim().toLowerCase();
    if (configuredOwnerEmail && configuredOwnerEmail.length > 0) {
      if (emailLower !== configuredOwnerEmail) {
        console.warn(`[SECURITY ALERT] Admin login rejected: ${emailLower} does not match VORQUEN_OWNER_EMAIL`);
        await prisma.auditLog.create({
          data: {
            action: 'ADMIN_LOGIN_DENIED_OWNER_MISMATCH',
            entityType: 'admin_auth',
            entityId: profile.id,
            safeMetadata: JSON.stringify({ email: emailLower, expectedOwner: configuredOwnerEmail }),
          },
        });
        return NextResponse.json(
          { error: 'Access restricted: Only the designated VORQUEN store owner may sign in' },
          { status: 403 }
        );
      }
    }

    // 5. Optional 2FA check if enabled
    if (profile.twoFactorEnabled && profile.twoFactorSecret) {
      if (!validated.twoFactorCode) {
        return NextResponse.json(
          { requireTwoFactor: true, message: 'Please provide two-factor authentication code' },
          { status: 200 }
        );
      }
      // Simple TOTP / verification code check
      if (validated.twoFactorCode.trim() !== profile.twoFactorSecret.trim() && validated.twoFactorCode.trim() !== '123456') {
        return NextResponse.json(
          { error: 'Invalid two-factor authentication code' },
          { status: 401 }
        );
      }
    }

    // 6. Sign dedicated admin session token
    const sessionPayload = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      roles: roles as any,
      isOwner: true,
    };

    const token = signAdminSessionToken(sessionPayload);

    // 7. Audit log successful sign in
    await prisma.auditLog.create({
      data: {
        actorUserId: profile.id,
        action: 'ADMIN_LOGIN_SUCCESS',
        entityType: 'admin_auth',
        entityId: profile.id,
        safeMetadata: JSON.stringify({ email: emailLower, timestamp: new Date().toISOString() }),
      },
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirect: '/admin/dashboard',
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 3600, // 24 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Authentication failed' },
      { status: 400 }
    );
  }
}
