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

// Environment variable validation
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const required = ['QUOTE_HASH_SECRET'];
  // Optional env vars: BREVO_API_KEY, RESEND_API_KEY, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID, ADMIN_EMAIL

  const missing: string[] = [];

  for (const key of required) {
    const value = getEnvVar(key);
    if (!value) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Helper to get env vars (works in both Node.js and Cloudflare)
export function getEnvVar(key: string): string | undefined {
  // Try import.meta.env first (Astro/Cloudflare)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as Record<string, string>)[key];
    if (value) return value;
  }
  // Fall back to process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}
