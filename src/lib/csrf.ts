/**
 * CSRF Protection Utilities
 *
 * Provides CSRF token generation and validation for API routes.
 * Uses a simple token-based approach suitable for Cloudflare Workers.
 */

import { getEnvVar } from '../config/site';

// Token expiration time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a CSRF token
 * Token format: base64(timestamp:hash)
 */
export function generateCsrfToken(): string {
  const secret = getEnvVar('CSRF_SECRET') || getEnvVar('QUOTE_HASH_SECRET') || 'default-dev-secret';
  const timestamp = Date.now().toString();
  const data = `${timestamp}:${secret}`;

  // Simple hash using Web Crypto API would be ideal, but for compatibility
  // we use a simple approach that works in Cloudflare Workers
  const hash = simpleHash(data);

  const token = btoa(`${timestamp}:${hash}`);
  return token;
}

/**
 * Validate a CSRF token
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
    const secret = getEnvVar('CSRF_SECRET') || getEnvVar('QUOTE_HASH_SECRET') || 'default-dev-secret';
    const expectedHash = simpleHash(`${timestamp}:${secret}`);

    return hash === expectedHash;
  } catch (e) {
    return false;
  }
}

/**
 * Simple string hash function (not cryptographic, but sufficient for CSRF)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
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
    const originUrl = new URL(origin);
    if (originUrl.host === host) {
      return null;
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
