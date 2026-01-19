/**
 * Callback Request API Endpoint
 *
 * Handles callback request submissions from the ajanlat page.
 * Sends immediate notification to admin.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import { setRuntimeEnv, getEnv } from '../../lib/env';
import { SITE_CONFIG } from '../../config/site';
import CallbackRequestTemplate from '../../emails/callback-request';
import { validateCsrfFromRequest } from '../../lib/csrf';
import { appendToCallbackSheet } from '../../lib/sheets';
import { sendMetaConversion, generateEventId, getMetaCookies, getClientIP } from '../../lib/meta-capi';

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

    // Tracking params
    const gclid = getString('gclid');
    const utmSource = getString('utm_source');
    const utmMedium = getString('utm_medium');
    const utmCampaign = getString('utm_campaign');
    const utmTerm = getString('utm_term');
    const utmContent = getString('utm_content');
    const fromEmail = getString('from_email');

    // Marketing consent from client (CookieYes)
    // Only send Meta CAPI if user has granted marketing consent
    const marketingConsent = getString('marketing_consent');

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
    const adminEmail = getEnv('ADMIN_EMAIL') || SITE_CONFIG.email;

    // Get Meta cookies and client info for CAPI
    const metaCookies = getMetaCookies(request.headers.get('cookie'));
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const metaAccessToken = getEnv('META_ACCESS_TOKEN');
    const eventId = generateEventId();

    // Send email, save to sheets, and send Meta CAPI in parallel
    const [emailSent, sheetsSaved, metaSent] = await Promise.all([
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
          source_page: fromEmail === 'yes' ? 'ajanlat (emailből)' : 'ajanlat',
        },
        {
          totalPrice,
          totalSqm,
          sizesFormatted,
          gclid,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm,
          utm_content: utmContent,
        }
      ).catch((e) => {
        console.error('Callback sheets error:', e);
        return false;
      }),
      // Meta CAPI - server-side conversion tracking
      // Only send if: 1) marketing consent granted, 2) access token available
      (marketingConsent === 'granted' && metaAccessToken) ? sendMetaConversion({
        eventName: 'Lead',
        eventId,
        sourceUrl: quoteUrl || 'https://trapezlemezes.hu/ajanlat',
        email,
        phone,
        firstName,
        lastName,
        value: totalPrice,
        currency: 'HUF',
        contentName: 'Callback Request',
        ipAddress: clientIP,
        userAgent,
        fbc: metaCookies.fbc,
        fbp: metaCookies.fbp,
        accessToken: metaAccessToken,
      }).catch((e) => {
        console.error('Meta CAPI error:', e);
        return { success: false, error: String(e) };
      }) : Promise.resolve({ success: false, error: marketingConsent !== 'granted' ? 'No marketing consent' : 'No META_ACCESS_TOKEN' }),
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
      metaSent: metaSent?.success ?? false,
      marketingConsent,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Visszahívás kérés elküldve',
        eventId, // Return eventId for client-side Meta Pixel deduplication
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
