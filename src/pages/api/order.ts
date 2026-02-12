/**
 * Order Submission API Endpoint
 *
 * Fogadja a kosárból érkező megrendelési szándéknyilatkozatot.
 * Validálja, emailt küld, Google Sheets-be ment.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { correctEmailTypos } from '../../lib/validation';
import { setRuntimeEnv, getEnv } from '../../lib/env';
import { logger } from '../../lib/logger';
import { SITE_CONFIG } from '../../config/site';
import { formatPrice } from '../../calculator/calculation';
import { appendToSheet } from '../../lib/sheets';
import { successResponse, errorResponse } from '../../lib/api-response';

export const prerender = false;

// Validáció
const orderItemSchema = z.object({
  id: z.string(),
  colorId: z.string(),
  colorLabel: z.string(),
  colorType: z.string(),
  sqm: z.number().positive(),
  pricePerSqm: z.number().positive(),
  totalPrice: z.number().min(0),
  withScrews: z.boolean(),
  screwCost: z.number().min(0),
  source: z.enum(['calculator', 'quick']),
});

const orderSchema = z.object({
  // Kontakt adatok
  lastName: z.string().min(2, 'Vezetéknév szükséges'),
  firstName: z.string().min(2, 'Keresztnév szükséges'),
  company: z.string().optional(),
  email: z.string().email('Érvénytelen email cím'),
  phone: z.string().min(9, 'Érvénytelen telefonszám'),

  // Szállítási adatok
  shippingType: z.enum(['gazdasagos', 'expressz', 'sajat']),
  postcode: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),

  // Megjegyzés
  notes: z.string().optional(),

  // Kosár
  items: z.array(orderItemSchema).min(1, 'A kosár üres'),
  sheetSubtotal: z.number().min(0),
  screwTotal: z.number().min(0),
  shippingCost: z.number().min(0),
  grandTotal: z.number().positive(),
  totalSqm: z.number().positive(),

  // GDPR
  gdpr: z.literal(true, { errorMap: () => ({ message: 'Adatkezelési hozzájárulás szükséges' }) }),
});

export const POST: APIRoute = async ({ request, locals }) => {
  logger.debug('=== ORDER API CALLED ===');

  // Set runtime env for Cloudflare
  const runtime = (locals as { runtime?: { env?: Record<string, string>; ctx?: { waitUntil: (promise: Promise<unknown>) => void } } }).runtime;
  setRuntimeEnv(runtime?.env || null);

  const ctx = runtime?.ctx;

  try {
    const body = await request.json();

    // Email korrekció
    if (body.email) {
      body.email = correctEmailTypos(body.email);
    }

    // Validáció
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      logger.debug('Order validation failed:', errors);
      const errorObj: Record<string, string> = {};
      errors.forEach((e) => { errorObj[e.field] = e.message; });
      return errorResponse('Validációs hiba', 400, errorObj);
    }

    const data = parsed.data;

    // Rendelésszám generálás
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Items összesítő szöveg
    const itemsSummary = data.items
      .map((item) => `${item.colorLabel} – ${item.sqm} m² × ${formatPrice(item.pricePerSqm)} = ${formatPrice(item.totalPrice)}${item.withScrews ? ' + csavar' : ''}`)
      .join('\n');

    // Admin email küldés (háttérben)
    const adminEmailHtml = `
      <h2>Új megrendelési szándéknyilatkozat: ${orderId}</h2>
      <p><strong>Időpont:</strong> ${new Date().toLocaleString('hu-HU')}</p>
      <hr/>
      <h3>Kapcsolattartó</h3>
      <p>
        <strong>Név:</strong> ${data.lastName} ${data.firstName}<br/>
        ${data.company ? `<strong>Cég:</strong> ${data.company}<br/>` : ''}
        <strong>Email:</strong> ${data.email}<br/>
        <strong>Telefon:</strong> ${data.phone}
      </p>
      <h3>Szállítás</h3>
      <p>
        <strong>Mód:</strong> ${data.shippingType === 'gazdasagos' ? 'Gazdaságos' : data.shippingType === 'expressz' ? 'Expressz' : 'Személyes átvétel'}<br/>
        ${data.postcode ? `<strong>Cím:</strong> ${data.postcode} ${data.city}, ${data.street}` : ''}
      </p>
      <h3>Tételek</h3>
      <pre>${itemsSummary}</pre>
      <h3>Összesítő</h3>
      <p>
        Lemez: ${formatPrice(data.sheetSubtotal)}<br/>
        Csavar: ${formatPrice(data.screwTotal)}<br/>
        Szállítás: ${formatPrice(data.shippingCost)}<br/>
        <strong>Összesen: ${formatPrice(data.grandTotal)}</strong><br/>
        Összterület: ${data.totalSqm} m²
      </p>
      ${data.notes ? `<h3>Megjegyzés</h3><p>${data.notes}</p>` : ''}
    `;

    const sendAdminEmail = async () => {
      try {
        const adminEmail = getEnv('ADMIN_EMAIL') || SITE_CONFIG.email;
        // Use Brevo or Resend
        const brevoKey = getEnv('BREVO_API_KEY');
        if (brevoKey) {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: SITE_CONFIG.company.name, email: 'noreply@trapezlemezes.hu' },
              to: [{ email: adminEmail }],
              subject: `[MEGRENDELÉS] ${orderId} – ${data.lastName} ${data.firstName} – ${formatPrice(data.grandTotal)}`,
              htmlContent: adminEmailHtml,
            }),
          });
        }
      } catch (err) {
        logger.debug('Admin email failed:', err);
      }
    };

    // User confirmation email
    const sendUserEmail = async () => {
      try {
        const brevoKey = getEnv('BREVO_API_KEY');
        if (brevoKey) {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: SITE_CONFIG.company.name, email: 'noreply@trapezlemezes.hu' },
              to: [{ email: data.email }],
              subject: `Megrendelési szándéknyilatkozat – ${orderId} | Trapezlemezes.hu`,
              htmlContent: `
                <h2>Köszönjük megrendelési szándéknyilatkozatát!</h2>
                <p>Rendelésszám: <strong>${orderId}</strong></p>
                <p>24 órán belül felhívjuk a <strong>${data.phone}</strong> számon, és közösen véglegesítjük a részleteket.</p>
                <h3>Összesítő</h3>
                <p>Összterület: ${data.totalSqm} m²<br/>
                Becsült összeg: <strong>${formatPrice(data.grandTotal)}</strong></p>
                <p><em>Ez szándéknyilatkozat – a végleges megrendelés csak telefonos egyeztetés után jön létre.</em></p>
                <hr/>
                <p>${SITE_CONFIG.company.name}<br/>
                Tel: ${SITE_CONFIG.phone}<br/>
                Email: ${SITE_CONFIG.email}</p>
              `,
            }),
          });
        }
      } catch (err) {
        logger.debug('User email failed:', err);
      }
    };

    // Google Sheets mentés
    const saveToSheets = async () => {
      try {
        await appendToSheet([
          timestamp,
          orderId,
          `${data.lastName} ${data.firstName}`,
          data.company || '',
          data.email,
          data.phone,
          data.items.map((i) => `${i.colorLabel} ${i.sqm}m²`).join(', '),
          String(data.totalSqm),
          formatPrice(data.grandTotal),
          data.shippingType,
          data.postcode ? `${data.postcode} ${data.city}, ${data.street}` : 'Személyes átvétel',
          data.notes || '',
          'Szándéknyilatkozat',
        ]);
      } catch (err) {
        logger.debug('Sheets save failed:', err);
      }
    };

    // Háttér feladatok
    if (ctx?.waitUntil) {
      ctx.waitUntil(Promise.all([sendAdminEmail(), sendUserEmail(), saveToSheets()]));
    } else {
      // Fallback: várakozás
      await Promise.all([sendAdminEmail(), sendUserEmail(), saveToSheets()]);
    }

    return successResponse({ orderId }, 'Megrendelési szándéknyilatkozat rögzítve');
  } catch (err) {
    logger.debug('Order API error:', err);
    return errorResponse('Szerverhiba', 500);
  }
};
