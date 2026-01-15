/**
 * Send Admin Notification API Endpoint
 *
 * Sends notification to admin about a quote view.
 * Called after 5 minutes if the user didn't request a callback.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import { setRuntimeEnv, getEnv } from '../../lib/env';
import AdminNotificationTemplate from '../../emails/admin-notification';
import type { CalculatorFormData } from '../../lib/validation';
import { validateCsrfFromRequest } from '../../lib/csrf';
import { SITE_CONFIG } from '../../config/site';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Set runtime env for Cloudflare Pages
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  setRuntimeEnv(runtimeEnv || null);

  // CSRF validation - protects against cross-site request forgery
  const csrfError = validateCsrfFromRequest(request);
  if (csrfError) return csrfError;

  // Parse JSON body with error handling
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid JSON payload',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { quote_id, quote_data, delay_reason } = body;

    // Validate quote_data structure
    if (quote_data && typeof quote_data !== 'object') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid quote_data format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Only send admin notification for high-value quotes (>340,000 Ft)
    const ADMIN_NOTIFICATION_THRESHOLD = 340000;
    const rawPrice = (quote_data as Record<string, unknown>)?.totalPrice;
    const totalPrice = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : 0;

    if (totalPrice < ADMIN_NOTIFICATION_THRESHOLD) {
      console.log(`Skipping delayed admin notification: ${totalPrice} Ft < ${ADMIN_NOTIFICATION_THRESHOLD} Ft threshold`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'below_threshold',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!quote_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'quote_id is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Helper to safely extract string from quote_data
    const qd = quote_data as Record<string, unknown> | undefined;
    const getString = (key: string): string => {
      const val = qd?.[key];
      return typeof val === 'string' ? val : '';
    };
    const getNumber = (key: string): number => {
      const val = qd?.[key];
      return typeof val === 'number' && !isNaN(val) ? val : 0;
    };

    // Convert quote_data to CalculatorFormData format
    // Type assertions needed for enum fields since getString returns string
    const shippingVal = getString('shipping') as '' | 'gazdasagos' | 'expressz' | 'sajat';
    const screwsVal = getString('screws') as '' | 'fa' | 'fem' | 'vegyes' | 'nem';
    const secondhandVal = getString('secondhand') as '' | 'yes' | 'no';

    const formData: Partial<CalculatorFormData> = {
      quote_id: typeof quote_id === 'string' ? quote_id : '',
      first_name: getString('first_name'),
      last_name: getString('last_name'),
      company: getString('company'),
      email: getString('email'),
      phone: getString('phone'),
      postcode: getString('postcode'),
      city: getString('city'),
      street: getString('street'),
      color: getString('color'),
      shipping: shippingVal || undefined,
      screws: screwsVal || undefined,
      secondhand: secondhandVal || undefined,
      source_page: 'ajanlat',
    };

    // Generate quote URL
    const baseUrl = new URL(request.url).origin;
    const quoteUrl = `${baseUrl}/ajanlat?q=${encodeURIComponent(formData.quote_id || '')}`;

    // Generate email HTML with note about delay
    const html = AdminNotificationTemplate({
      data: formData as CalculatorFormData,
      quoteUrl,
      totalPrice,
      totalSqm: getNumber('totalSqm'),
      screwBoxes: getNumber('screwBoxes'),
      screwPrice: getNumber('screwPrice'),
      sizesFormatted: getString('sizesFormatted'),
    }).replace(
      'Nagyösszegű árajánlatot adtunk ki',
      `Árajánlat megtekintve (${delay_reason === 'no_callback_after_5min' ? 'nem kért visszahívást' : 'értesítés'})`
    );

    // Send email to admin
    const adminEmail = getEnv('ADMIN_EMAIL') || SITE_CONFIG.email;

    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `📋 Árajánlat megtekintve - ${formData.first_name} ${formData.last_name}`,
      html,
      replyTo: formData.email || undefined,
    });

    console.log('Admin notification sent:', {
      quote_id,
      delay_reason,
      emailSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send admin notification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to send notification',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
