import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { sendTestEmail, getEmailProviderInfo } from '@/lib/services/emailService';

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => ({}));

    const targetEmail = body.toEmail?.trim() || admin.email;
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required' }, { status: 400 });
    }

    const providerInfo = getEmailProviderInfo();
    const result = await sendTestEmail(targetEmail);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch email via active provider',
          provider: result.provider,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${targetEmail}`,
      provider: result.provider,
      messageId: result.messageId,
      providerDetails: providerInfo.details,
    });
  } catch (err: any) {
    const isAuth = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json({ error: err.message }, { status: isAuth ? 401 : 500 });
  }
}
