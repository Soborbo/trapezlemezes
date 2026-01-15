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

    // Helper to safely get string from FormData
    const getString = (key: string): string => {
      const value = formData.get(key);
      return typeof value === 'string' ? value.trim() : '';
    };

    // Helper to safely get number from FormData
    const getNumber = (key: string): number => {
      const value = getString(key);
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    const firstName = getString('first_name');
    const lastName = getString('last_name');
    const phone = getString('phone');
    const email = getString('email');
    const company = getString('company');
    const postcode = getString('postcode');
    const city = getString('city');
    const street = getString('street');
    const quoteId = getString('quote_id');
    const quoteUrl = getString('quote_url');
    const totalPrice = getNumber('total_price');
    const color = getString('color');
    const shipping = getString('shipping');
    const screws = getString('screws');
    const secondhand = getString('secondhand');
    const sizesFormatted = getString('sizes_formatted');
    const totalSqm = getNumber('total_sqm');

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
