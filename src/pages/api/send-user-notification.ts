/**
 * Send User Notification API Endpoint
 *
 * Sends the quote confirmation email to the user asynchronously
 * when they view the quote page.
 */

import type { APIRoute } from 'astro';
import { sendEmail } from '../../lib/email';
import { setRuntimeEnv } from '../../lib/env';
import QuoteConfirmationTemplate from '../../emails/quote-confirmation';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Set runtime env for Cloudflare Pages (secrets are in locals.runtime.env)
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  setRuntimeEnv(runtimeEnv || null);

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
    // Safely extract values with type checking
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const quote_id = typeof body.quote_id === 'string' ? body.quote_id : '';
    const quote_url = typeof body.quote_url === 'string' ? body.quote_url : '';
    const name = typeof body.name === 'string' ? body.name : '';

    if (!email || !quote_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email and quote_id are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse name
    const nameParts = (name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate email HTML (empty breakdown - the full quote is on the page)
    const html = QuoteConfirmationTemplate({
      firstName,
      lastName,
      quoteId: quote_id,
      quoteUrl: quote_url || '',
      breakdown: [],
    });

    // Send email
    const emailSent = await sendEmail({
      to: email,
      subject: 'A trapézlemez árajánlata elkészült',
      html,
      replyTo: 'info@trapezlemezes.hu',
    });

    console.log('User notification sent:', {
      email,
      quote_id,
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
    console.error('Send user notification error:', error);

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
