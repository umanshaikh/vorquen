import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function POST() {
  try {
    const admin = await getAdminSession();
    if (admin) {
      await prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'ADMIN_LOGOUT',
          entityType: 'admin_auth',
          entityId: admin.id,
          safeMetadata: JSON.stringify({ email: admin.email, timestamp: new Date().toISOString() }),
        },
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    response.cookies.set(ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Logout failed' }, { status: 400 });
  }
}
