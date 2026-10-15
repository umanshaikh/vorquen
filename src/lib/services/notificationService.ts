import prisma from '../db/prisma';

export interface NotificationPayload {
  userId?: string;
  orderId?: string;
  type: 'order_confirmed' | 'order_dispatched' | 'order_delivered' | 'refund_processed';
  title: string;
  message: string;
  recipientEmail?: string;
}

export async function sendNotification(payload: NotificationPayload) {
  const { userId, orderId, type, title, message, recipientEmail } = payload;

  // Record in-app notification in DB
  const notification = await prisma.notification.create({
    data: {
      userId,
      orderId,
      notificationType: type,
      title,
      message,
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date(),
    },
  });

  // Handle email notification (Resend / SMTP)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('your_') && recipientEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'orders@fashionhub.in',
          to: recipientEmail,
          subject: title,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
              <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">FashionHub</h2>
              <div style="background: #faf9f6; padding: 20px; border-radius: 8px; border: 1px solid #ebe7df;">
                <h3 style="margin-top: 0; color: #3d2a23;">${title}</h3>
                <p style="font-size: 15px; line-height: 1.6;">${message}</p>
              </div>
              <p style="font-size: 12px; color: #777; margin-top: 24px;">Thank you for shopping with FashionHub India.</p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error('[NOTIFICATION EMAIL ERROR]', err);
    }
  } else {
    // Safe development logging
    console.info(`[NOTIFICATION MOCK EMAIL] To: ${recipientEmail || 'Guest'} | Subject: ${title} | Message: ${message}`);
  }

  return notification;
}
