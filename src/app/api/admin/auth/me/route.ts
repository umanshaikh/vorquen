import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized admin session' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        isOwner: true,
        twoFactorEnabled: true,
        createdAt: true,
        roles: { select: { role: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin: {
        ...profile,
        roles: profile.roles.map((r) => r.role),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
