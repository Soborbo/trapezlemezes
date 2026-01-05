/**
 * Form Validation with Zod
 *
 * Hungarian error messages and common email typo corrections.
 */

import { z } from 'zod';

// Common email domain typos and corrections
const EMAIL_TYPO_CORRECTIONS: Record<string, string> = {
  'gmail.hu': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmail.hu': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotamil.com': 'hotmail.com',
  'yahoo.hu': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlookk.com': 'outlook.com',
  'freemail.huu': 'freemail.hu',
  'fremail.hu': 'freemail.hu',
  'citromail.huu': 'citromail.hu',
  'citromial.hu': 'citromail.hu',
};

/**
 * Corrects common email domain typos
 */
export function correctEmailTypos(email: string): string {
  if (!email) return email;

  const [localPart, domain] = email.toLowerCase().trim().split('@');
  if (!domain) return email;

  const correctedDomain = EMAIL_TYPO_CORRECTIONS[domain] || domain;
  return `${localPart}@${correctedDomain}`;
}

// Hungarian phone regex for NORMALIZED format (no spaces/dashes)
// After normalizePhone(), format is: +36XXXXXXXXX or 06XXXXXXXXX
// Mobile: 20/30/31/50/70 + 7 digits
// Landline Budapest: 1 + 7 digits
// Landline other: 2-9X + 6 digits
const PHONE_REGEX = /^(\+36|06)(1\d{7}|20\d{7}|30\d{7}|31\d{7}|50\d{7}|70\d{7}|[2-9]\d{7,8})$/;

/**
 * Normalizes a phone number by removing whitespace and normalizing prefix
 */
export function normalizePhone(phone: string): string {
  if (!phone) return phone;

  // Trim and remove extra spaces/dashes
  let normalized = phone.trim().replace(/[\s\-]+/g, '');

  // If starts with just "36" (no + or 0), add +
  if (normalized.match(/^36\d/)) {
    normalized = '+' + normalized;
  }

  return normalized;
}

// Hungarian postcode
const POSTCODE_REGEX = /^\d{4}$/;

// Zod schema for calculator form with Hungarian error messages
export const calculatorFormSchema = z.object({
  // Personal info
  first_name: z.string()
    .min(2, 'A vezetéknév legalább 2 karakter legyen')
    .max(50, 'A vezetéknév maximum 50 karakter lehet'),

  last_name: z.string()
    .min(2, 'A keresztnév legalább 2 karakter legyen')
    .max(50, 'A keresztnév maximum 50 karakter lehet'),

  company: z.string().max(100, 'A cégnév maximum 100 karakter lehet').optional().default(''),

  // Contact
  email: z.string()
    .email('Érvényes e-mail címet adjon meg')
    .transform(correctEmailTypos),

  phone: z.string()
    .transform(normalizePhone)
    .refine((val) => PHONE_REGEX.test(val), 'Érvényes magyar telefonszámot adjon meg (pl. +36 30 123 4567)'),

  // Address (optional - only required when shipping is selected)
  postcode: z.string()
    .regex(POSTCODE_REGEX, 'Érvényes irányítószámot adjon meg (4 számjegy)')
    .optional()
    .or(z.literal('')),

  city: z.string()
    .min(2, 'A település legalább 2 karakter legyen')
    .max(100, 'A település maximum 100 karakter lehet')
    .optional()
    .or(z.literal('')),

  street: z.string()
    .min(5, 'Az utca, házszám legalább 5 karakter legyen')
    .max(200, 'Az utca, házszám maximum 200 karakter lehet')
    .optional()
    .or(z.literal('')),

  // GDPR
  gdpr: z.literal('on', {
    errorMap: () => ({ message: 'Az adatkezelési tájékoztató elfogadása kötelező' })
  }),

  // Calculator data
  knows_sizes: z.enum(['yes', 'no']).optional(),
  usage: z.enum(['teto', 'kerites', 'teto_es_oldalfal']).optional(),
  roof_type: z.enum(['nyereg', 'felteto']).optional(),
  color: z.string().optional(),
  shipping: z.enum(['gazdasagos', 'expressz', 'sajat']).optional(),
  screws: z.enum(['fa', 'fem', 'vegyes', 'nem']).optional(),
  secondhand: z.enum(['yes', 'no']).optional(),

  // Calculated fields
  quote_id: z.string().optional(),
  timestamp: z.string().optional(),
  source_page: z.string().optional(),
}).passthrough(); // Allow extra fields from the form

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Hungarian validation error messages
export const VALIDATION_MESSAGES = {
  required: 'Ez a mező kötelező',
  email: 'Érvényes e-mail címet adjon meg',
  phone: 'Érvényes telefonszámot adjon meg',
  postcode: 'Érvényes irányítószámot adjon meg',
  minLength: (min: number) => `Legalább ${min} karakter legyen`,
  maxLength: (max: number) => `Maximum ${max} karakter lehet`,
  gdpr: 'Az adatkezelési tájékoztató elfogadása kötelező',
};

/**
 * Validates form data and returns errors in Hungarian
 */
export function validateForm(data: unknown): {
  success: boolean;
  data?: CalculatorFormData;
  errors?: Record<string, string>;
} {
  const result = calculatorFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const field = error.path.join('.');
    errors[field] = error.message;
  }

  return { success: false, errors };
}

/**
 * Client-side field validation
 */
export function validateField(field: string, value: string): string | null {
  const fieldSchemas: Record<string, z.ZodType> = {
    first_name: z.string().min(2, 'Legalább 2 karakter'),
    last_name: z.string().min(2, 'Legalább 2 karakter'),
    email: z.string().email('Érvényes e-mail címet adjon meg'),
    phone: z.string().regex(PHONE_REGEX, 'Érvényes telefonszámot adjon meg'),
    postcode: z.string().regex(POSTCODE_REGEX, '4 számjegy'),
    city: z.string().min(2, 'Legalább 2 karakter'),
    street: z.string().min(5, 'Legalább 5 karakter'),
  };

  const schema = fieldSchemas[field];
  if (!schema) return null;

  const result = schema.safeParse(value);
  if (result.success) return null;

  return result.error.errors[0]?.message || 'Hibás érték';
}
