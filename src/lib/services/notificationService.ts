import prisma from '../db/prisma';
import { sendEmail } from './emailService';

export interface NotificationPayload {
  userId?: string;
  orderId?: string;
  type: 'order_confirmed' | 'order_dispatched' | 'order_delivered' | 'refund_processed' | 'security_alert';
  title: string;
  message: string;
  recipientEmail?: string;
  actionUrl?: string;
}

export async function sendNotification(payload: NotificationPayload) {
  const { userId, orderId, type, title, message, recipientEmail, actionUrl } = payload;

  // 1. Record in-app notification in DB
  let notification = null;
  try {
    notification = await prisma.notification.create({
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
  } catch (dbErr: any) {
    console.error('[NOTIFICATION DB SAVE ERROR]', dbErr.message);
  }

  // 2. Dispatch email if recipientEmail provided
  if (recipientEmail) {
    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px;">
        <div style="border-bottom: 2px solid #0d0d0d; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; margin: 0; color: #0d0d0d;">VORQUEN</h1>
          <div style="font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a96e; margin-top: 4px;">Atelier Notification</div>
        </div>
        <div style="background: #faf9f6; padding: 20px; border-radius: 4px; border: 1px solid #ebe7df;">
          <h3 style="margin-top: 0; color: #0d0d0d; font-size: 16px; font-weight: 600;">${title}</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #444444; margin-bottom: 0;">${message}</p>
        </div>
        ${
          actionUrl
            ? `
          <div style="margin-top: 24px; text-align: center;">
            <a href="${actionUrl}" style="display: inline-block; background: #0d0d0d; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 12px 24px; border-radius: 2px;">
              View Details
            </a>
          </div>
        `
            : ''
        }
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #eeeeee; font-size: 11px; color: #888888; text-align: center;">
          <p style="margin: 0 0 4px 0;">VORQUEN Atelier Pvt. Ltd. • Bengaluru, Karnataka</p>
          <p style="margin: 0;">Inquiries: concierge@vorquen.com</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: recipientEmail,
        subject: `${title} | VORQUEN`,
        html: formattedHtml,
        text: `${title}\n\n${message}\n\nVORQUEN Atelier`,
      });
    } catch (err: any) {
      console.error('[NOTIFICATION EMAIL DISPATCH ERROR]', err.message);
    }
  }

  return notification;
}
