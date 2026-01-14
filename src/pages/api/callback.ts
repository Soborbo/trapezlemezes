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
import { appendToCallbackSheet } from '../../lib/sheets';

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
    const company = formData.get('company') as string;
    const postcode = formData.get('postcode') as string;
    const city = formData.get('city') as string;
    const street = formData.get('street') as string;
    const quoteId = formData.get('quote_id') as string;
    const quoteUrl = formData.get('quote_url') as string;
    const totalPrice = parseFloat(formData.get('total_price') as string) || 0;
    const color = formData.get('color') as string;
    const shipping = formData.get('shipping') as string;
    const screws = formData.get('screws') as string;
    const secondhand = formData.get('secondhand') as string;
    const sizesFormatted = formData.get('sizes_formatted') as string;
    const totalSqm = parseFloat(formData.get('total_sqm') as string) || 0;

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

    // Send email and save to sheets in parallel
    const [emailSent, sheetsSaved] = await Promise.all([
      sendEmail({
        to: adminEmail,
        subject: `📞 Visszahívás kérés - ${lastName} ${firstName} - ${new Intl.NumberFormat('hu-HU').format(totalPrice)} Ft`,
        html,
        replyTo: email,
      }),
      appendToCallbackSheet(
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          company,
          postcode,
          city,
          street,
          quote_id: quoteId,
          color,
          shipping,
          screws,
          secondhand,
          source_page: 'ajanlat',
        },
        {
          totalPrice,
          totalSqm,
          sizesFormatted,
        }
      ).catch((e) => {
        console.error('Callback sheets error:', e);
        return false;
      }),
    ]);

    if (!emailSent) {
      console.error('Failed to send callback notification email');
    }

    console.log('Callback request processed:', {
      name: `${lastName} ${firstName}`,
      phone,
      quoteId,
      totalPrice,
      emailSent,
      sheetsSaved,
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
