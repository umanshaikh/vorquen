import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import prisma from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      addresses: true,
      roles: true,
    },
  });

  return NextResponse.json({
    user: profile
      ? {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          roles: profile.roles.map((r) => r.role),
          addresses: profile.addresses,
        }
      : null,
  });
}
