/**
 * Send Admin Notification API Endpoint
 *
 * Sends notification to admin about a quote view.
 * Called after 5 minutes if the user didn't request a callback.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import AdminNotificationTemplate from '../../emails/admin-notification';
import type { CalculatorFormData } from '../../lib/validation';

export const prerender = false;

// Helper to get env vars
function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as Record<string, string>)[key];
    if (value) return value;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { quote_id, quote_data, delay_reason } = body;

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
    }).replace(
      '🎉 Új árajánlatkérés érkezett!',
      `📋 Árajánlat megtekintve (${delay_reason === 'no_callback_after_5min' ? 'nem kért visszahívást' : 'értesítés'})`
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
