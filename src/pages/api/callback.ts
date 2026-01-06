/**
 * Callback Request API Endpoint
 *
 * Handles callback request submissions from the ajanlat page.
 * Sends immediate notification to admin.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import { setRuntimeEnv, getEnv } from '../../lib/env';
import CallbackRequestTemplate from '../../emails/callback-request';
import { validateCsrfFromRequest } from '../../lib/csrf';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Set runtime env for Cloudflare Pages
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  setRuntimeEnv(runtimeEnv || null);

  // CSRF validation
  const csrfError = validateCsrfFromRequest(request);
  if (csrfError) return csrfError;

  try {
    const formData = await request.formData();

    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const quoteId = formData.get('quote_id') as string;
    const quoteUrl = formData.get('quote_url') as string;
    const totalPrice = parseFloat(formData.get('total_price') as string) || 0;

    // Validate required fields
    if (!firstName || !lastName || !phone || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Minden mező kitöltése kötelező',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate email HTML
    const html = CallbackRequestTemplate({
      firstName,
      lastName,
      email,
      phone,
      totalPrice,
      quoteId: quoteId || '-',
      quoteUrl: quoteUrl || '#',
    });

    // Send email to admin
    const adminEmail = getEnv('ADMIN_EMAIL') || 'info@trapezlemezes.hu';

    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `📞 Visszahívás kérés - ${lastName} ${firstName} - ${new Intl.NumberFormat('hu-HU').format(totalPrice)} Ft`,
      html,
      replyTo: email,
    });

    if (!emailSent) {
      console.error('Failed to send callback notification email');
    }

    console.log('Callback request processed:', {
      name: `${lastName} ${firstName}`,
      phone,
      quoteId,
      totalPrice,
      emailSent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Visszahívás kérés elküldve',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Callback request error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Hiba történt. Kérjük, próbálja újra.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
