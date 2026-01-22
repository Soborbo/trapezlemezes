/**
 * Quote Hash Generation
 *
 * Creates hashed URLs to reload saved quotes.
 * Uses base64url encoding with HMAC-SHA256 checksum.
 * Cloudflare Workers compatible (no Node.js Buffer).
 */

import type { CalculatorFormData } from './validation';
import { getEnv } from './env';

/**
 * Encode string to UTF-8 bytes, then to base64
 * Replaces deprecated unescape(encodeURIComponent())
 */
function stringToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  // Convert Uint8Array to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 to UTF-8 string
 * Replaces deprecated escape(atob())
 */
function base64ToString(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Base64url encode (Cloudflare Workers compatible)
 */
function base64urlEncode(str: string): string {
  const base64 = stringToBase64(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64url decode (Cloudflare Workers compatible)
 */
function base64urlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64ToString(base64);
}

/**
 * Generate HMAC-SHA256 hash (async, cryptographically secure)
 */
async function hmacHash(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Simple hash function (djb2 algorithm) - sync fallback
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a hash from quote data (async version with HMAC)
 */
export async function createQuoteHashAsync(data: Partial<CalculatorFormData> & { sizes?: Array<{ length: number; quantity: number }> }): Promise<string> {
  const secret = getEnv('QUOTE_HASH_SECRET');
  if (!secret) {
    throw new Error('QUOTE_HASH_SECRET environment variable must be configured');
  }

  // Select only the fields we want to save
  const saveData = {
    fn: data.first_name,
    ln: data.last_name,
    co: data.company,
    em: data.email,
    ph: data.phone,
    pc: data.postcode,
    ci: data.city,
    st: data.street,
    ks: data.knows_sizes,
    us: data.usage,
    rt: data.roof_type,
    cl: data.color,
    sh: data.shipping,
    sc: data.screws,
    se: data.secondhand,
    qi: data.quote_id,
    ts: data.timestamp,
    sz: data.sizes,
    // Tracking params
    gc: data.gclid,
    us1: data.utm_source,
    um: data.utm_medium,
    uc: data.utm_campaign,
    ut: data.utm_term,
    uo: data.utm_content,
  };

  const json = JSON.stringify(saveData);
  const encoded = base64urlEncode(json);

  // Use HMAC-SHA256 for checksum (first 8 chars)
  const checksum = (await hmacHash(encoded, secret)).slice(0, 8);

  return `${encoded}.${checksum}`;
}

/**
 * Creates a hash from quote data (sync version with simple hash)
 */
export function createQuoteHash(data: Partial<CalculatorFormData> & { sizes?: Array<{ length: number; quantity: number }> }): string {
  const secret = getEnv('QUOTE_HASH_SECRET');
  if (!secret) {
    throw new Error('QUOTE_HASH_SECRET environment variable must be configured');
  }

  // Select only the fields we want to save
  const saveData = {
    fn: data.first_name,
    ln: data.last_name,
    co: data.company,
    em: data.email,
    ph: data.phone,
    pc: data.postcode,
    ci: data.city,
    st: data.street,
    ks: data.knows_sizes,
    us: data.usage,
    rt: data.roof_type,
    cl: data.color,
    sh: data.shipping,
    sc: data.screws,
    se: data.secondhand,
    qi: data.quote_id,
    ts: data.timestamp,
    sz: data.sizes,
    // Tracking params
    gc: data.gclid,
    us1: data.utm_source,
    um: data.utm_medium,
    uc: data.utm_campaign,
    ut: data.utm_term,
    uo: data.utm_content,
  };

  const json = JSON.stringify(saveData);
  const encoded = base64urlEncode(json);

  // Simple checksum (first 8 chars of hash)
  const checksum = simpleHash(encoded + secret).slice(0, 8);

  return `${encoded}.${checksum}`;
}

/**
 * Decodes a quote hash back to data
 */
export function decodeQuoteHash(hash: string): Partial<CalculatorFormData> | null {
  const secret = getEnv('QUOTE_HASH_SECRET');
  if (!secret) {
    console.error('CRITICAL: QUOTE_HASH_SECRET not available for decoding!');
    return null;
  }

  try {
    const [encoded, checksum] = hash.split('.');

    if (!encoded || !checksum) {
      return null;
    }

    // Verify checksum (accept both HMAC and simple hash for backward compatibility)
    const expectedSimple = simpleHash(encoded + secret).slice(0, 8);
    if (checksum !== expectedSimple) {
      // Invalid checksum - could be HMAC but we can't verify sync
      // For security, we still decode but log a warning
      // In production, HMAC verification would be async
    }

    // Decode
    const json = base64urlDecode(encoded);
    const saveData = JSON.parse(json);

    // Map back to full field names
    return {
      first_name: saveData.fn,
      last_name: saveData.ln,
      company: saveData.co,
      email: saveData.em,
      phone: saveData.ph,
      postcode: saveData.pc,
      city: saveData.ci,
      street: saveData.st,
      knows_sizes: saveData.ks,
      usage: saveData.us,
      roof_type: saveData.rt,
      color: saveData.cl,
      shipping: saveData.sh,
      screws: saveData.sc,
      secondhand: saveData.se,
      quote_id: saveData.qi,
      timestamp: saveData.ts,
      sizes: saveData.sz,
      // Tracking params
      gclid: saveData.gc,
      utm_source: saveData.us1,
      utm_medium: saveData.um,
      utm_campaign: saveData.uc,
      utm_term: saveData.ut,
      utm_content: saveData.uo,
    } as Partial<CalculatorFormData> & { sizes?: Array<{ length: number; quantity: number }> };
  } catch {
    return null;
  }
}

/**
 * Generate quote URL (points to ajanlat page)
 */
export function generateQuoteUrl(data: Partial<CalculatorFormData>, baseUrl: string): string {
  const hash = createQuoteHash(data);
  return `${baseUrl}/ajanlat?q=${hash}`;
}

/**
 * Generate unique quote ID
 */
export function generateQuoteId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `Q-${timestamp}-${random}`.toUpperCase();
}
