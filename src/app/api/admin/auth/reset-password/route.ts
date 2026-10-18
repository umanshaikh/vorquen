import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import { adminResetPasswordSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = adminResetPasswordSchema.parse(body);

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: validated.token },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { error: 'Password reset token has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { email: tokenRecord.email },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Associated user account not found' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.profile.update({
      where: { id: profile.id },
      data: { passwordHash },
    });

    // Invalidate token after single use
    await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: profile.id,
        action: 'ADMIN_PASSWORD_RESET_SUCCESS',
        entityType: 'admin_auth',
        entityId: profile.id,
        safeMetadata: JSON.stringify({ email: profile.email, timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been securely reset. You can now log in with your new credentials.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Password reset failed' },
      { status: 400 }
    );
  }
}
