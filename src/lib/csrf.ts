/**
 * CSRF Protection Utilities
 *
 * Provides CSRF token generation and validation for API routes.
 * Uses HMAC-SHA256 for secure token generation (Cloudflare Workers compatible).
 */

import { getEnv } from './env';

// Token expiration time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate HMAC-SHA256 hash using Web Crypto API
 * Falls back to simple hash in non-crypto environments (dev only)
 */
async function hmacHash(message: string, secret: string): Promise<string> {
  try {
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
  } catch {
    // Fallback for environments without crypto.subtle (should not happen in production)
    return fallbackHash(message + secret);
  }
}

/**
 * Synchronous fallback hash (djb2) - only used when crypto.subtle unavailable
 */
function fallbackHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate a CSRF token (async version using HMAC)
 * Token format: base64(timestamp:hmac)
 */
export async function generateCsrfTokenAsync(): Promise<string> {
  const secret = getEnv('CSRF_SECRET') || getEnv('QUOTE_HASH_SECRET');
  if (!secret) {
    // Only allow fallback in development
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return btoa(`${Date.now()}:dev-token`);
    }
    throw new Error('CSRF_SECRET or QUOTE_HASH_SECRET must be configured');
  }

  const timestamp = Date.now().toString();
  const hash = await hmacHash(timestamp, secret);
  return btoa(`${timestamp}:${hash.slice(0, 32)}`);
}

/**
 * Generate a CSRF token (sync version - for backward compatibility)
 * Uses fallback hash which is less secure but sync
 */
export function generateCsrfToken(): string {
  const secret = getEnv('CSRF_SECRET') || getEnv('QUOTE_HASH_SECRET');
  if (!secret) {
    // Only allow fallback in development
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return btoa(`${Date.now()}:dev-token`);
    }
    throw new Error('CSRF_SECRET or QUOTE_HASH_SECRET must be configured');
  }

  const timestamp = Date.now().toString();
  const hash = fallbackHash(timestamp + ':' + secret);
  return btoa(`${timestamp}:${hash}`);
}

/**
 * Validate a CSRF token (async version using HMAC)
 */
export async function validateCsrfTokenAsync(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const decoded = atob(token);
    const [timestamp, hash] = decoded.split(':');

    if (!timestamp || !hash) return false;

    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY_MS) {
      return false;
    }

    // Verify hash
    const secret = getEnv('CSRF_SECRET') || getEnv('QUOTE_HASH_SECRET');
    if (!secret) {
      // In dev mode, accept dev tokens
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return hash === 'dev-token';
      }
      return false;
    }

    const expectedHash = await hmacHash(timestamp, secret);
    // Compare first 32 chars (HMAC tokens) or full hash (fallback tokens)
    return hash === expectedHash.slice(0, 32) || hash === fallbackHash(timestamp + ':' + secret);
  } catch {
    return false;
  }
}

/**
 * Validate a CSRF token (sync version - backward compatible)
 */
export function validateCsrfToken(token: string): boolean {
  if (!token) return false;

  try {
    const decoded = atob(token);
    const [timestamp, hash] = decoded.split(':');

    if (!timestamp || !hash) return false;

    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY_MS) {
      return false;
    }

    // Verify hash
    const secret = getEnv('CSRF_SECRET') || getEnv('QUOTE_HASH_SECRET');
    if (!secret) {
      // In dev mode, accept dev tokens
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        return hash === 'dev-token';
      }
      return false;
    }

    const expectedHash = fallbackHash(timestamp + ':' + secret);
    return hash === expectedHash;
  } catch {
    return false;
  }
}

/**
 * Middleware to validate CSRF token from request
 * Returns null if valid, error Response if invalid
 */
export function validateCsrfFromRequest(request: Request): Response | null {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return null;
  }

  // Get token from header or form data
  const headerToken = request.headers.get('X-CSRF-Token');

  if (headerToken && validateCsrfToken(headerToken)) {
    return null;
  }

  // For form submissions, we'll accept if Origin/Referer matches
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  const host = request.headers.get('Host');

  // If Origin is present and matches host, allow the request
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid origin URL
    }
  }

  // If Referer is present and matches host, allow the request
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid referer URL
    }
  }

  // In development, be more lenient
  if (host?.includes('localhost') || host?.includes('127.0.0.1') || !host) {
    return null;
  }

  // Also check if running in dev mode via Astro
  const isDev = import.meta.env?.DEV;
  if (isDev) {
    return null;
  }

  // CSRF validation failed
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Érvénytelen kérés. Kérjük, frissítse az oldalt és próbálja újra.',
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
