/**
 * Email Service
 *
 * Supports both Resend and Brevo for transactional emails.
 * Brevo is the primary provider, Resend is fallback.
 */

import { Resend } from 'resend';
import * as Brevo from '@getbrevo/brevo';
import type { CalculatorFormData } from './validation';

// Helper to get env vars (works in both Node.js and Cloudflare)
function getEnv(key: string): string | undefined {
  // Try import.meta.env first (Astro/Cloudflare)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as Record<string, string>)[key];
    if (value) return value;
  }
  // Fall back to process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

// Lazy initialization for Resend and Brevo
let resend: Resend | null = null;
let brevoClient: Brevo.TransactionalEmailsApi | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const apiKey = getEnv('RESEND_API_KEY');
  if (apiKey) {
    resend = new Resend(apiKey);
  }
  return resend;
}

function getBrevoClient(): Brevo.TransactionalEmailsApi | null {
  if (brevoClient) return brevoClient;
  const apiKey = getEnv('BREVO_API_KEY');
  if (apiKey) {
    brevoClient = new Brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );
  }
  return brevoClient;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Brevo (primary)
 */
async function sendViaBrevo(options: EmailOptions): Promise<boolean> {
  const client = getBrevoClient();
  if (!client) {
    console.warn('Brevo API key not configured');
    return false;
  }

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    sendSmtpEmail.sender = {
      name: 'Trapezlemezes.hu',
      email: options.from || 'ajanlat@trapezlemezes.hu'
    };
    sendSmtpEmail.to = [{ email: options.to }];
    if (options.replyTo) {
      sendSmtpEmail.replyTo = { email: options.replyTo };
    }

    await client.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent via Brevo to:', options.to);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

/**
 * Send email via Resend (fallback)
 */
async function sendViaResend(options: EmailOptions): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn('Resend API key not configured');
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: options.from || 'Trapezlemezes.hu <ajanlat@trapezlemezes.hu>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('Resend email error:', error);
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
 * Tries Brevo first, falls back to Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try Brevo first
  const brevoSuccess = await sendViaBrevo(options);
  if (brevoSuccess) return true;

  // Fallback to Resend
  const resendSuccess = await sendViaResend(options);
  return resendSuccess;
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
    replyTo: 'info@trapezlemezes.hu',
  });
}

/**
 * Send notification email to admin
 */
export async function sendAdminNotification(
  data: CalculatorFormData,
  quoteUrl: string
): Promise<boolean> {
  const { default: AdminNotificationTemplate } = await import('../emails/admin-notification');

  const html = AdminNotificationTemplate({
    data,
    quoteUrl,
  });

  const adminEmail = getEnv('ADMIN_EMAIL') || 'info@trapezlemezes.hu';

  return sendEmail({
    to: adminEmail,
    subject: `Új árajánlatkérés - ${data.first_name} ${data.last_name}`,
    html,
    replyTo: data.email,
  });
}
