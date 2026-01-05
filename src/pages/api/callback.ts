/**
 * Callback Request API Endpoint
 *
 * Handles callback request submissions from the ajanlat page.
 * Sends immediate notification to admin.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import CallbackRequestTemplate from '../../emails/callback-request';
import { validateCsrfFromRequest } from '../../lib/csrf';
import { getEnvVar } from '../../config/site';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // CSRF validation
  const csrfError = validateCsrfFromRequest(request);
  if (csrfError) return csrfError;

  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string | null;
    const quoteId = formData.get('quote_id') as string | null;
    const quoteDataStr = formData.get('quote_data') as string | null;

    // Validate required fields
    if (!name || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Név és telefonszám megadása kötelező',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse quote data if provided
    let quoteData;
    if (quoteDataStr) {
      try {
        quoteData = JSON.parse(quoteDataStr);
      } catch (e) {
        console.warn('Failed to parse quote data:', e);
      }
    }

    // Generate email HTML
    const html = CallbackRequestTemplate({
      name,
      phone,
      email: email || undefined,
      quoteId: quoteId || undefined,
      quoteData,
    });

    // Send email to admin
    const adminEmail = getEnvVar('ADMIN_EMAIL') || 'info@trapezlemezes.hu';

    const emailSent = await sendEmail({
      to: adminEmail,
      subject: `📞 Visszahívás kérés - ${name}`,
      html,
      replyTo: email || undefined,
    });

    if (!emailSent) {
      console.error('Failed to send callback notification email');
    }

    console.log('Callback request processed:', {
      name,
      phone,
      quoteId,
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
