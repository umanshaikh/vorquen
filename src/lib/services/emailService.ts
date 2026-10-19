import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'smtp' | 'mock';
  messageId?: string;
  error?: string;
}

/**
 * Detects the active email configuration:
 * 1. Resend API (if RESEND_API_KEY is configured)
 * 2. Custom SMTP (if SMTP_HOST and SMTP_USER are configured)
 * 3. Fallback mock logger (for local development without credentials)
 */
export function getEmailProviderInfo(): {
  provider: 'resend' | 'smtp' | 'mock';
  isConfigured: boolean;
  fromEmail: string;
  details: string;
} {
  const fromEmail = process.env.EMAIL_FROM || 'concierge@vorquen.com';

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !resendKey.startsWith('your_') && resendKey.trim().length > 0) {
    return {
      provider: 'resend',
      isConfigured: true,
      fromEmail,
      details: 'Resend Transactional API Active',
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  if (smtpHost && smtpUser && !smtpHost.startsWith('your_')) {
    return {
      provider: 'smtp',
      isConfigured: true,
      fromEmail,
      details: `Custom SMTP (${smtpHost}:${process.env.SMTP_PORT || 587})`,
    };
  }

  return {
    provider: 'mock',
    isConfigured: false,
    fromEmail,
    details: 'Development Mock Mode (Logged to Console)',
  };
}

/**
 * Core email dispatcher with multi-provider failover
 */
export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  const { to, subject, html, text, from } = options;
  const sender = from || process.env.EMAIL_FROM || 'VORQUEN Atelier <concierge@vorquen.com>';
  const recipients = Array.isArray(to) ? to.join(', ') : to;

  // 1. Try Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('your_') && resendApiKey.trim().length > 0) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Resend API dispatch failed');
      }

      return {
        success: true,
        provider: 'resend',
        messageId: data.id,
      };
    } catch (err: any) {
      console.error('[EMAIL ERROR - RESEND]', err.message);
      // If SMTP is also configured, fall through to SMTP
      if (!process.env.SMTP_HOST) {
        return { success: false, provider: 'resend', error: err.message };
      }
    }
  }

  // 2. Try SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  if (smtpHost && smtpUser && !smtpHost.startsWith('your_')) {
    try {
      const port = Number(process.env.SMTP_PORT || 587);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass || '',
        },
      });

      const info = await transporter.sendMail({
        from: sender,
        to: recipients,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      });

      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error('[EMAIL ERROR - SMTP]', err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  // 3. Fallback: Safe Development Mock Logger
  console.info(`\n======================================================`);
  console.info(`[VORQUEN EMAIL NOTIFICATION - DEVELOPMENT MOCK]`);
  console.info(`To:      ${recipients}`);
  console.info(`From:    ${sender}`);
  console.info(`Subject: ${subject}`);
  console.info(`Date:    ${new Date().toISOString()}`);
  console.info(`------------------------------------------------------`);
  console.info(`Summary text:\n${text || html.replace(/<[^>]*>/g, ' ').slice(0, 300)}...`);
  console.info(`======================================================\n`);

  return {
    success: true,
    provider: 'mock',
    messageId: `mock_msg_${Date.now()}`,
  };
}

// -------------------------------------------------------------
// VORQUEN LUXURY HTML EMAIL TEMPLATES
// -------------------------------------------------------------

function getBaseTemplate(title: string, bodyContent: string, actionButton?: { text: string; url: string }) {
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0d0d;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #e5e5e5;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #141414;
      border: 1px solid #262626;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(180deg, #1a1a1a 0%, #111111 100%);
      padding: 36px 24px;
      text-align: center;
      border-bottom: 1px solid #2a2a2a;
    }
    .logo {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.35em;
      color: #f5f5f5;
      text-transform: uppercase;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }
    .subtag {
      font-size: 9px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #c9a96e;
      margin-top: 8px;
    }
    .content {
      padding: 32px 28px;
      color: #cccccc;
      line-height: 1.65;
      font-size: 14px;
    }
    .headline {
      font-size: 19px;
      font-weight: 600;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }
    .badge-box {
      background: #1c1c1c;
      border: 1px solid #333333;
      border-left: 3px solid #c9a96e;
      border-radius: 3px;
      padding: 16px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background: #c9a96e;
      color: #0d0d0d !important;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 2px;
      margin-top: 24px;
      text-align: center;
    }
    .footer {
      background-color: #0d0d0d;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #222222;
      font-size: 11px;
      color: #737373;
      line-height: 1.5;
    }
    .footer a {
      color: #a3a3a3;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="container">
      <div class="header">
        <h1 class="logo">VORQUEN</h1>
        <div class="subtag">Haute Couture &amp; Sculptural Atelier</div>
      </div>
      <div class="content">
        ${bodyContent}
        ${
          actionButton
            ? `
          <div style="text-align: center;">
            <a href="${actionButton.url}" class="btn" target="_blank">${actionButton.text}</a>
          </div>
        `
            : ''
        }
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">VORQUEN Atelier Pvt. Ltd. • Bengaluru, Karnataka, India</p>
        <p style="margin: 0 0 12px 0;">Direct Concierge: <a href="mailto:concierge@vorquen.com">concierge@vorquen.com</a></p>
        <p style="margin: 0; font-size: 10px; color: #525252;">
          This is an official communication regarding your VORQUEN account and transactions.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  items?: Array<{ productNameSnapshot: string; selectedSize?: string; unitPrice: number; quantity: number }>;
  shippingAddressSnapshot?: string | null;
}) {
  let addressText = '';
  try {
    if (order.shippingAddressSnapshot) {
      const addr = JSON.parse(order.shippingAddressSnapshot);
      addressText = `${addr.fullName || ''}, ${addr.addressLine1 || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}`;
    }
  } catch {
    addressText = 'Address on file';
  }

  const itemsHtml = order.items && order.items.length > 0
    ? `
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #333; color: #a3a3a3; text-align: left;">
            <th style="padding: 8px 0;">Item</th>
            <th style="padding: 8px 0; text-align: center;">Qty</th>
            <th style="padding: 8px 0; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #222;">
              <td style="padding: 10px 0; color: #f5f5f5;">
                ${item.productNameSnapshot}
                ${item.selectedSize ? `<br><span style="font-size: 11px; color: #737373;">Size: ${item.selectedSize}</span>` : ''}
              </td>
              <td style="padding: 10px 0; text-align: center; color: #a3a3a3;">${item.quantity}</td>
              <td style="padding: 10px 0; text-align: right; color: #f5f5f5; font-weight: 600;">₹${(item.unitPrice * item.quantity).toLocaleString('en-IN')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
    : '';

  const bodyContent = `
    <h2 class="headline">Thank you for your order.</h2>
    <p>Your bespoke garment requisition has been registered with the VORQUEN Atelier. Our artisans and fulfillment staff are now preparing your pieces.</p>
    
    <div class="badge-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a96e; margin-bottom: 4px;">Order Reference</div>
      <div style="font-size: 20px; font-weight: 700; color: #ffffff; font-family: monospace;">${order.orderNumber}</div>
      <div style="margin-top: 12px; font-size: 13px;">Total Charged: <strong style="color: #ffffff;">₹${order.totalAmount.toLocaleString('en-IN')}</strong></div>
      ${addressText ? `<div style="margin-top: 6px; font-size: 12px; color: #888;">Delivery to: ${addressText}</div>` : ''}
    </div>

    ${itemsHtml}

    <p style="margin-top: 24px; font-size: 13px; color: #a3a3a3;">
      You will receive tracking details via courier dispatch notice as soon as your garment clears final atelier inspection.
    </p>
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmation: ${order.orderNumber} | VORQUEN Atelier`,
    html: getBaseTemplate(`Order ${order.orderNumber}`, bodyContent, {
      text: 'Track Order Status',
      url: `${appUrl}/track-order?order=${order.orderNumber}`,
    }),
  });
}

/**
 * 2. Order Dispatched Email
 */
export async function sendOrderDispatchedEmail(
  order: { orderNumber: string; customerEmail: string },
  shipment: { courierName: string; awbNumber: string; trackingUrl?: string | null }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackUrl = shipment.trackingUrl || `${appUrl}/track-order?order=${order.orderNumber}`;

  const bodyContent = `
    <h2 class="headline">Your VORQUEN package is en route.</h2>
    <p>Your package has been carefully sealed with security seals and transferred to our premium logistics courier.</p>
    
    <div class="badge-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a96e; margin-bottom: 4px;">Logistics Courier</div>
      <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${shipment.courierName}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #a3a3a3;">Air Waybill (AWB): <strong style="color: #ffffff; font-family: monospace;">${shipment.awbNumber}</strong></div>
    </div>

    <p style="font-size: 13px; color: #a3a3a3;">
      Please ensure an authorized adult recipient is available to receive the package upon arrival.
    </p>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Dispatched: Your VORQUEN Order ${order.orderNumber} is on the way`,
    html: getBaseTemplate(`Shipment Dispatched`, bodyContent, {
      text: 'Track Live Shipment',
      url: trackUrl,
    }),
  });
}

/**
 * 3. Order Delivered Email
 */
export async function sendOrderDeliveredEmail(order: { orderNumber: string; customerEmail: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const bodyContent = `
    <h2 class="headline">Delivered: Welcome to the VORQUEN Universe.</h2>
    <p>Our courier has confirmed the delivery of your package for order <strong>${order.orderNumber}</strong>.</p>
    
    <div class="badge-box">
      <div style="font-size: 13px; color: #ffffff;">We hope your garment exceeds every expectation in drape, weight, and silhouette.</div>
    </div>

    <p style="font-size: 13px; color: #a3a3a3;">
      Should you require any styling assistance or sizing adjustments, our atelier concierge is at your service under our 7-day policy.
    </p>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Delivered: Your VORQUEN Order ${order.orderNumber}`,
    html: getBaseTemplate(`Delivered`, bodyContent, {
      text: 'View Order in Atelier',
      url: `${appUrl}/account`,
    }),
  });
}

/**
 * 4. Refund Processed Email
 */
export async function sendRefundProcessedEmail(
  order: { orderNumber: string; customerEmail: string },
  refund: { amount: number; refundReference?: string }
) {
  const bodyContent = `
    <h2 class="headline">Refund Credited.</h2>
    <p>A refund of <strong>₹${refund.amount.toLocaleString('en-IN')}</strong> for order <strong>${order.orderNumber}</strong> has been successfully processed.</p>
    
    <div class="badge-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a96e; margin-bottom: 4px;">Refund Reference</div>
      <div style="font-size: 14px; font-family: monospace; color: #ffffff;">${refund.refundReference || 'REF-' + Date.now()}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #a3a3a3;">Refunded Amount: <strong style="color: #ffffff;">₹${refund.amount.toLocaleString('en-IN')}</strong></div>
    </div>

    <p style="font-size: 13px; color: #a3a3a3;">
      Depending on your issuing bank or UPI provider, the funds typically reflect within 3 to 7 business banking days.
    </p>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Refund Processed for Order ${order.orderNumber} | VORQUEN`,
    html: getBaseTemplate(`Refund Confirmation`, bodyContent),
  });
}

/**
 * 5. Diagnostic / Test Email (for store owner in Admin Settings)
 */
export async function sendTestEmail(toEmail: string) {
  const providerInfo = getEmailProviderInfo();

  const bodyContent = `
    <h2 class="headline">VORQUEN Email Engine Verification</h2>
    <p>This is a live diagnostic verification dispatched from the VORQUEN Store Owner Administration Portal.</p>
    
    <div class="badge-box">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a96e; margin-bottom: 4px;">Dispatch Engine</div>
      <div style="font-size: 15px; font-weight: 600; color: #ffffff;">${providerInfo.details}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #a3a3a3;">Configured Sender: <strong style="color: #ffffff;">${providerInfo.fromEmail}</strong></div>
      <div style="margin-top: 4px; font-size: 12px; color: #a3a3a3;">Timestamp: <strong style="color: #ffffff;">${new Date().toLocaleString('en-IN')}</strong></div>
    </div>

    <p style="font-size: 13px; color: #a3a3a3;">
      All customer notifications, order confirmations, courier dispatches, and owner alerts are operating successfully.
    </p>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[VORQUEN Diagnostic] Email Integration Verification`,
    html: getBaseTemplate(`Email Verification`, bodyContent),
  });
}
