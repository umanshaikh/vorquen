import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validation';
import { signSessionToken } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existing = await prisma.profile.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const profile = await prisma.profile.create({
      data: {
        email: validated.email.toLowerCase(),
        passwordHash,
        fullName: validated.fullName,
        phoneNumber: validated.phoneNumber || null,
        roles: {
          create: [{ role: 'customer' }],
        },
      },
      include: { roles: true },
    });

    const sessionPayload = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      roles: profile.roles.map((r) => r.role as any),
    };

    const token = signSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set('fashionhub_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message || 'Registration failed' }, { status: 400 });
  }
}
