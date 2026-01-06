/**
 * Email Service
 *
 * Supports both Resend and Brevo for transactional emails.
 * Uses fetch API for Cloudflare Workers compatibility.
 */

import type { CalculatorFormData } from './validation';
import { getEnv } from './env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Brevo (primary) using fetch API
 * Cloudflare Workers compatible
 */
async function sendViaBrevo(options: EmailOptions): Promise<boolean> {
  const apiKey = getEnv('BREVO_API_KEY');
  if (!apiKey) {
    console.warn('Brevo API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Trapezlemezes.hu',
          email: options.from?.match(/<(.+)>/)?.[1] || options.from || 'ajanlat@trapezlemezes.hu',
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        ...(options.replyTo && { replyTo: { email: options.replyTo } }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Brevo email error:', response.status, error);
      return false;
    }

    console.log('Email sent via Brevo to:', options.to);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

/**
 * Send email via Resend (primary) using fetch API
 * Cloudflare Workers compatible
 */
async function sendViaResend(options: EmailOptions): Promise<boolean> {
  console.log('sendViaResend called, to:', options.to);
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('Resend API key not configured');
    return false;
  }
  console.log('Resend API key found, length:', apiKey.length);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'Trapezlemezes.hu <ajanlat@trapezlemezes.hu>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.replyTo && { reply_to: options.replyTo }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend email error:', response.status, error);
      return false;
    }

    console.log('Email sent via Resend to:', options.to);
    return true;
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

/**
 * Send email with fallback
 * Tries Resend first, falls back to Brevo
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try Resend first
  const resendSuccess = await sendViaResend(options);
  if (resendSuccess) return true;

  // Fallback to Brevo
  console.log('Resend failed, trying Brevo fallback...');
  const brevoSuccess = await sendViaBrevo(options);
  return brevoSuccess;
}

/**
 * Send quote confirmation email to customer
 */
export async function sendQuoteConfirmation(
  data: CalculatorFormData,
  quoteUrl: string,
  breakdown: Array<{ label: string; value: number }>
): Promise<boolean> {
  const { default: QuoteConfirmationTemplate } = await import('../emails/quote-confirmation');

  const html = QuoteConfirmationTemplate({
    firstName: data.first_name,
    lastName: data.last_name,
    company: data.company,
    quoteId: data.quote_id || '',
    quoteUrl,
    breakdown,
  });

  return sendEmail({
    to: data.email,
    subject: `Trapézlemez árajánlat - ${data.quote_id}`,
    html,
    replyTo: 'hello@trapezlemezes.hu',
  });
}

/**
 * Send notification email to admin (only for high-value quotes >340,000 Ft)
 */
export async function sendAdminNotification(
  data: CalculatorFormData,
  quoteUrl: string,
  calculatedData: {
    totalPrice: number;
    totalSqm: number;
    screwBoxes: number;
    screwPrice: number;
    sizesFormatted: string;
  }
): Promise<boolean> {
  // Only send admin notification for high-value quotes (>340,000 Ft)
  const ADMIN_NOTIFICATION_THRESHOLD = 340000;
  if (calculatedData.totalPrice < ADMIN_NOTIFICATION_THRESHOLD) {
    console.log(`Skipping admin notification: ${calculatedData.totalPrice} Ft < ${ADMIN_NOTIFICATION_THRESHOLD} Ft threshold`);
    return true; // Return true as this is expected behavior, not an error
  }

  const { default: AdminNotificationTemplate } = await import('../emails/admin-notification');

  const html = AdminNotificationTemplate({
    data,
    quoteUrl,
    totalPrice: calculatedData.totalPrice,
    totalSqm: calculatedData.totalSqm,
    screwBoxes: calculatedData.screwBoxes,
    screwPrice: calculatedData.screwPrice,
    sizesFormatted: calculatedData.sizesFormatted,
  });

  const adminEmail = getEnv('ADMIN_EMAIL') || 'info@trapezlemezes.hu';

  return sendEmail({
    to: adminEmail,
    subject: `Nagyösszegű árajánlat - ${new Intl.NumberFormat('hu-HU').format(calculatedData.totalPrice)} Ft - ${data.first_name} ${data.last_name}`,
    html,
    replyTo: data.email,
  });
}
