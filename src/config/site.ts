/**
 * Central Site Configuration
 *
 * All site-wide constants should be defined here to avoid duplication
 * and ensure consistency across the codebase.
 */

export const SITE_CONFIG = {
  // Contact information
  phone: '+36 1 300-92-06',
  phoneRaw: '+3613009206',
  email: 'info@trapezlemezes.hu',
  emailAjanlat: 'ajanlat@trapezlemezes.hu',
  emailHello: 'hello@trapezlemezes.hu',

  // Address
  address: {
    full: '1182 Budapest, Királyhágó utca 30.',
    city: 'Budapest',
    district: '18. kerület',
    street: 'Királyhágó utca 30.',
    postcode: '1182',
  },

  // Company info
  company: {
    name: 'Trapezlemezes.hu',
    ceo: 'Farkas Roland',
    taxNumber: '32249833-2-43',
    registrationNumber: '01-09-414203',
  },

  // URLs
  siteUrl: 'https://trapezlemezes.hu',

  // Quote settings
  quote: {
    // Quote URLs expire after 7 days
    expiryDays: 7,
    expiryMs: 7 * 24 * 60 * 60 * 1000,
  },
} as const;

// Re-export getEnv for backwards compatibility
// Note: For runtime env access in Cloudflare, use getEnv from '../lib/env'
import { getEnv } from '../lib/env';
export { getEnv as getEnvVar };

// Environment variable validation (use only at build time or after setRuntimeEnv)
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const required = ['QUOTE_HASH_SECRET'];
  // Optional env vars: BREVO_API_KEY, RESEND_API_KEY, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID, ADMIN_EMAIL

  const missing: string[] = [];

  for (const key of required) {
    const value = getEnv(key);
    if (!value) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
