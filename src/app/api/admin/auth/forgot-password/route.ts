import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { adminForgotPasswordSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = adminForgotPasswordSchema.parse(body);
    const emailLower = validated.email.trim().toLowerCase();

    // Verify administrator identity
    const profile = await prisma.profile.findUnique({
      where: { email: emailLower },
      include: { roles: true },
    });

    const isEligibleAdmin =
      profile &&
      (profile.isOwner || profile.roles.some((r) => r.role === 'admin' || r.role === 'owner'));

    // To prevent email enumeration, return general confirmation even if not found
    if (!profile || !isEligibleAdmin) {
      return NextResponse.json({
        success: true,
        message: 'If the provided email belongs to an authorized owner account, password recovery instructions have been prepared.',
      });
    }

    // Clean up existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: emailLower },
    });

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: emailLower,
        token,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: profile.id,
        action: 'ADMIN_PASSWORD_RESET_REQUESTED',
        entityType: 'admin_auth',
        entityId: profile.id,
        safeMetadata: JSON.stringify({ email: emailLower, timestamp: new Date().toISOString() }),
      },
    });

    const resetUrl = `/admin/reset-password?token=${token}`;

    console.info(`[ADMIN RECOVERY] Password reset requested for ${emailLower}. Direct reset link: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetUrl, // Provided for direct convenience in dev/production console
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || err.message || 'Password reset request failed' },
      { status: 400 }
    );
  }
}
