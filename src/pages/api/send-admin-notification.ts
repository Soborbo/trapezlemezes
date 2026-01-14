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

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Set runtime env for Cloudflare Pages
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  setRuntimeEnv(runtimeEnv || null);

  try {
    const body = await request.json();

    const { quote_id, quote_data, delay_reason } = body;

    // Only send admin notification for high-value quotes (>340,000 Ft)
    const ADMIN_NOTIFICATION_THRESHOLD = 340000;
    const totalPrice = quote_data?.totalPrice || 0;

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

    // Convert quote_data to CalculatorFormData format
    const formData: Partial<CalculatorFormData> = {
      quote_id,
      first_name: quote_data?.first_name || '',
      last_name: quote_data?.last_name || '',
      company: quote_data?.company || '',
      email: quote_data?.email || '',
      phone: quote_data?.phone || '',
      postcode: quote_data?.postcode || '',
      city: quote_data?.city || '',
      street: quote_data?.street || '',
      color: quote_data?.color || '',
      shipping: quote_data?.shipping || '',
      screws: quote_data?.screws || '',
      secondhand: quote_data?.secondhand || '',
      source_page: 'ajanlat',
    };

    // Generate quote URL
    const baseUrl = new URL(request.url).origin;
    const quoteUrl = `${baseUrl}/ajanlat?q=${encodeURIComponent(quote_id)}`;

    // Generate email HTML with note about delay
    const html = AdminNotificationTemplate({
      data: formData as CalculatorFormData,
      quoteUrl,
      totalPrice: quote_data?.totalPrice || 0,
      totalSqm: quote_data?.totalSqm || 0,
      screwBoxes: quote_data?.screwBoxes || 0,
      screwPrice: quote_data?.screwPrice || 0,
      sizesFormatted: quote_data?.sizesFormatted || '',
    }).replace(
      'Nagyösszegű árajánlatot adtunk ki',
      `Árajánlat megtekintve (${delay_reason === 'no_callback_after_5min' ? 'nem kért visszahívást' : 'értesítés'})`
    );

    // Send email to admin
    const adminEmail = getEnv('ADMIN_EMAIL') || 'info@trapezlemezes.hu';

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
