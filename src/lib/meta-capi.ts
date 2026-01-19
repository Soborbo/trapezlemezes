/**
 * Meta Conversions API (CAPI) - Server-side tracking
 *
 * Sends conversion events directly to Meta's servers.
 * - Higher match rate than client-side pixel
 * - Not blocked by ad blockers or iOS ITP
 * - Runs in background with waitUntil()
 *
 * IMPORTANT: Requires marketing consent from client before sending.
 * The client passes `marketing_consent: 'granted' | 'denied'` to the API.
 */

import { getEnv } from './env';

const META_API_VERSION = 'v21.0';

/**
 * Get Meta Pixel ID from environment or fallback
 * Prefer environment variable for flexibility
 */
function getMetaPixelId(): string {
  return getEnv('META_PIXEL_ID') || '1190487559035660';
}

interface MetaUserData {
  em?: string;  // Email (will be hashed)
  ph?: string;  // Phone (will be hashed)
  fn?: string;  // First name (will be hashed)
  ln?: string;  // Last name (will be hashed)
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID cookie
  fbp?: string; // Facebook browser ID cookie
}

interface MetaConversionEvent {
  event_name: 'Lead' | 'Contact' | 'Purchase' | 'ViewContent' | 'InitiateCheckout';
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: 'website';
  user_data: MetaUserData;
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
  };
}

interface MetaAPIPayload {
  data: MetaConversionEvent[];
  test_event_code?: string;
}

interface MetaAPIResponse {
  events_received?: number;
  messages?: string[];
  fbtrace_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Hash a value using SHA-256 for Meta's Enhanced Matching
 * Meta requires lowercase, trimmed, and hashed values
 */
async function hashValue(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize phone number to E.164 format for Meta
 * Removes spaces, dashes, and ensures country code
 */
function normalizePhone(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If starts with 06, replace with +36 (Hungarian)
  if (normalized.startsWith('06')) {
    normalized = '+36' + normalized.slice(2);
  }

  // If doesn't start with +, assume Hungarian
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('36')) {
      normalized = '+' + normalized;
    } else {
      normalized = '+36' + normalized;
    }
  }

  return normalized;
}

/**
 * Generate a unique event ID for deduplication
 * Used to match server-side events with client-side pixel events
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Build user data object with hashed PII
 */
async function buildUserData(params: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<MetaUserData> {
  const userData: MetaUserData = {};

  if (params.email) {
    userData.em = await hashValue(params.email);
  }

  if (params.phone) {
    const normalizedPhone = normalizePhone(params.phone);
    userData.ph = await hashValue(normalizedPhone);
  }

  if (params.firstName) {
    userData.fn = await hashValue(params.firstName);
  }

  if (params.lastName) {
    userData.ln = await hashValue(params.lastName);
  }

  if (params.ipAddress) {
    userData.client_ip_address = params.ipAddress;
  }

  if (params.userAgent) {
    userData.client_user_agent = params.userAgent;
  }

  if (params.fbc) {
    userData.fbc = params.fbc;
  }

  if (params.fbp) {
    userData.fbp = params.fbp;
  }

  return userData;
}

/**
 * Send a conversion event to Meta's Conversions API
 */
export async function sendMetaConversion(params: {
  eventName: 'Lead' | 'Contact';
  eventId: string;
  sourceUrl: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  ipAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  accessToken: string;
  testEventCode?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userData = await buildUserData({
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      lastName: params.lastName,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    });

    const event: MetaConversionEvent = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      event_source_url: params.sourceUrl,
      action_source: 'website',
      user_data: userData,
    };

    // Add custom data if provided
    if (params.value || params.currency || params.contentName) {
      event.custom_data = {};
      if (params.value) event.custom_data.value = params.value;
      if (params.currency) event.custom_data.currency = params.currency;
      if (params.contentName) event.custom_data.content_name = params.contentName;
    }

    const payload: MetaAPIPayload = {
      data: [event],
    };

    // Add test event code for debugging
    if (params.testEventCode) {
      payload.test_event_code = params.testEventCode;
    }

    const pixelId = getMetaPixelId();
    const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${params.accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: MetaAPIResponse = await response.json();

    if (result.error) {
      console.error('[Meta CAPI] Error:', result.error.message);
      return { success: false, error: result.error.message };
    }

    console.log(`[Meta CAPI] Event sent: ${params.eventName}, events_received: ${result.events_received}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Meta CAPI] Exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Helper to extract Meta cookies from request
 */
export function getMetaCookies(cookieHeader: string | null): { fbc?: string; fbp?: string } {
  if (!cookieHeader) return {};

  const cookies: { fbc?: string; fbp?: string } = {};

  const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);
  if (fbcMatch) cookies.fbc = fbcMatch[1];

  const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
  if (fbpMatch) cookies.fbp = fbpMatch[1];

  return cookies;
}

/**
 * Helper to get client IP from Cloudflare headers
 */
export function getClientIP(request: Request): string | undefined {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         undefined;
}
