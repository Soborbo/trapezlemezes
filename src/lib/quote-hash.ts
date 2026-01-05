/**
 * Quote Hash Generation
 *
 * Creates hashed URLs to reload saved quotes.
 * Uses base64 encoding with a simple obfuscation.
 * Cloudflare Workers compatible (no Node.js Buffer).
 */

import type { CalculatorFormData } from './validation';
import { getEnvVar } from '../config/site';

/**
 * Base64url encode (Cloudflare Workers compatible)
 */
function base64urlEncode(str: string): string {
  // Use btoa for base64 encoding, then convert to base64url
  const base64 = btoa(unescape(encodeURIComponent(str)));
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
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Simple hash function (djb2 algorithm)
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a hash from quote data
 */
export function createQuoteHash(data: Partial<CalculatorFormData> & { sizes?: Array<{ length: number; quantity: number }> }): string {
  const secret = getEnvVar('QUOTE_HASH_SECRET') || 'trapezlemez-secret-2024';

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
    sz: data.sizes, // sizes array
  };

  // Create JSON and encode
  const json = JSON.stringify(saveData);
  const encoded = base64urlEncode(json);

  // Add simple checksum (first 8 chars of hash)
  const checksum = simpleHash(encoded + secret).slice(0, 8);

  return `${encoded}.${checksum}`;
}

/**
 * Decodes a quote hash back to data
 */
export function decodeQuoteHash(hash: string): Partial<CalculatorFormData> | null {
  const secret = getEnvVar('QUOTE_HASH_SECRET') || 'trapezlemez-secret-2024';

  try {
    const [encoded, checksum] = hash.split('.');

    if (!encoded || !checksum) {
      return null;
    }

    // Verify checksum
    const expectedChecksum = simpleHash(encoded + secret).slice(0, 8);
    if (checksum !== expectedChecksum) {
      console.warn('Invalid quote hash checksum');
      return null;
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
      sizes: saveData.sz, // sizes array
    } as Partial<CalculatorFormData> & { sizes?: Array<{ length: number; quantity: number }> };
  } catch (error) {
    console.error('Error decoding quote hash:', error);
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
