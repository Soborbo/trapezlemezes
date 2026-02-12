/**
 * Google Sheets Integration
 *
 * Saves all quote submissions to a Google Sheet.
 * Uses direct REST API calls instead of googleapis SDK for smaller bundle size.
 */

import type { CalculatorFormData } from './validation';
import { getEnv } from './env';

// JWT creation for Google Service Account authentication
async function createJWT(): Promise<string | null> {
  console.log('createJWT called');
  const clientEmail = getEnv('GOOGLE_SHEETS_CLIENT_EMAIL');
  const privateKey = getEnv('GOOGLE_SHEETS_PRIVATE_KEY');

  console.log('clientEmail:', clientEmail ? 'found' : 'MISSING');
  console.log('privateKey:', privateKey ? `found (${privateKey.length} chars)` : 'MISSING');

  if (!clientEmail || !privateKey) {
    console.warn('Google Sheets credentials not configured');
    return null;
  }

  const key = privateKey.replace(/\\n/g, '\n');

  // Create JWT header and payload
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Base64URL encode
  const base64url = (obj: object): string => {
    const json = JSON.stringify(obj);
    const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign
  try {
    // Parse PEM key
    const pemContents = key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${signatureInput}.${signatureEncoded}`;
  } catch (error) {
    console.error('JWT signing error:', error);
    return null;
  }
}

// Get access token from Google
async function getAccessToken(): Promise<string | null> {
  const jwt = await createJWT();
  if (!jwt) return null;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange error:', error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Token fetch error:', error);
    return null;
  }
}

/**
 * Append a row to the Google Sheet
 * Columns (A-AA): Dátum | Telefonszám | Email | Vezetéknév | Keresztnév | Cégnév | Város | Irányítószám | Utca házszám | Tételek | Szín | Négyzetméter | Szállítás | Csavar mennyiség | Csavar ára | Kishibás | Netes rendelés | Végösszeg | Ajánlat ID | Megjegyzés | GCLID | Forrás oldal | UTM Source | UTM Medium | UTM Campaign | UTM Term | UTM Content
 */
export async function appendToSheet(
  data: CalculatorFormData,
  calculatedData: {
    totalSqm: number;
    totalSheets: number;
    totalPrice: number;
    quoteUrl: string;
    sizesFormatted?: string;
    screwBoxes?: number;
    screwPrice?: number;
    gclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<boolean> {
  console.log('appendToSheet called for:', data.email);

  const spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  console.log('spreadsheetId:', spreadsheetId ? 'found' : 'MISSING');
  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured');
    return false;
  }

  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  console.log('accessToken:', accessToken ? 'obtained' : 'FAILED');
  if (!accessToken) return false;

  try {
    // Format date in Hungarian format
    const now = new Date();
    const dateStr = now.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Prepare row data matching user's column structure (A-V)
    const row = [
      dateStr,                                    // A: Dátum
      data.phone,                                 // B: Telefonszám
      data.email,                                 // C: Email
      data.last_name,                             // D: Vezetéknév
      data.first_name,                            // E: Keresztnév
      data.company || '',                         // F: Cégnév
      data.city,                                  // G: Város
      data.postcode,                              // H: Irányítószám
      data.street,                                // I: Utca házszám
      calculatedData.sizesFormatted || '',        // J: Tételek
      data.color || '',                           // K: Szín
      calculatedData.totalSqm || '',              // L: Négyzetméter
      data.shipping || '',                        // M: Szállítás
      calculatedData.screwBoxes || '',            // N: Csavar mennyiség (doboz)
      calculatedData.screwPrice || '',            // O: Csavar ára
      data.secondhand || '',                      // P: Kishibás
      'Igen',                                     // Q: Netes rendelés (always yes from website)
      calculatedData.totalPrice,                  // R: Végösszeg
      data.quote_id || '',                        // S: Ajánlat ID
      '',                                         // T: Megjegyzés
      calculatedData.gclid || '',                 // U: GCLID
      data.source_page || '',                     // V: Forrás oldal
      calculatedData.utm_source || '',            // W: UTM Source
      calculatedData.utm_medium || '',            // X: UTM Medium
      calculatedData.utm_campaign || '',          // Y: UTM Campaign
      calculatedData.utm_term || '',              // Z: UTM Term
      calculatedData.utm_content || '',           // AA: UTM Content
    ];

    const range = encodeURIComponent('Trapez mind!A:AA');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Sheets append error:', error);
      return false;
    }

    console.log('Data appended to Google Sheet:', data.quote_id);
    return true;
  } catch (error) {
    console.error('Google Sheets error:', error);
    return false;
  }
}

/**
 * Append a raw row (string array) to a named sheet tab.
 * Used by the order API which has a different column structure.
 */
export async function appendRawRowToSheet(
  sheetName: string,
  row: (string | number)[]
): Promise<boolean> {
  const spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured');
    return false;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const range = encodeURIComponent(`${sheetName}!A:AA`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Google Sheets (${sheetName}) append error:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Google Sheets (${sheetName}) error:`, error);
    return false;
  }
}

/**
 * Check if sheet headers exist (user already has headers, this is just a check)
 */
export async function ensureSheetHeaders(): Promise<boolean> {
  // User already has headers configured in "Trapez mind" sheet
  // This function is kept for compatibility but does nothing
  return true;
}

/**
 * Append to "Trapez 350000+" sheet for high-value quotes (>340,000 Ft)
 * Same column structure as "Trapez mind"
 */
export async function appendToHighValueSheet(
  data: CalculatorFormData,
  calculatedData: {
    totalSqm: number;
    totalSheets: number;
    totalPrice: number;
    quoteUrl: string;
    sizesFormatted?: string;
    screwBoxes?: number;
    screwPrice?: number;
    gclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<boolean> {
  const THRESHOLD = 340000;
  if (calculatedData.totalPrice < THRESHOLD) {
    return true; // Not a high-value quote, skip silently
  }

  console.log('appendToHighValueSheet called for:', data.email, 'price:', calculatedData.totalPrice);

  const spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured');
    return false;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const row = [
      dateStr,
      data.phone,
      data.email,
      data.last_name,
      data.first_name,
      data.company || '',
      data.city,
      data.postcode,
      data.street,
      calculatedData.sizesFormatted || '',
      data.color || '',
      calculatedData.totalSqm || '',
      data.shipping || '',
      calculatedData.screwBoxes || '',
      calculatedData.screwPrice || '',
      data.secondhand || '',
      'Igen',
      calculatedData.totalPrice,
      data.quote_id || '',
      '',
      calculatedData.gclid || '',
      data.source_page || '',
      calculatedData.utm_source || '',
      calculatedData.utm_medium || '',
      calculatedData.utm_campaign || '',
      calculatedData.utm_term || '',
      calculatedData.utm_content || '',
    ];

    const range = encodeURIComponent('Trapez 350000+!A:AA');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Sheets (350000+) append error:', error);
      return false;
    }

    console.log('Data appended to Trapez 350000+ sheet:', data.quote_id);
    return true;
  } catch (error) {
    console.error('Google Sheets (350000+) error:', error);
    return false;
  }
}

/**
 * Append to "Trapez visszahivast kert" sheet for callback requests
 * Same column structure as "Trapez mind"
 */
export async function appendToCallbackSheet(
  data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company?: string;
    postcode?: string;
    city?: string;
    street?: string;
    quote_id?: string;
    color?: string;
    shipping?: string;
    screws?: string;
    secondhand?: string;
    source_page?: string;
  },
  calculatedData: {
    totalSqm?: number;
    totalPrice?: number;
    sizesFormatted?: string;
    screwBoxes?: number;
    screwPrice?: number;
    gclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }
): Promise<boolean> {
  console.log('appendToCallbackSheet called for:', data.email);

  const spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured');
    return false;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const row = [
      dateStr,
      data.phone,
      data.email,
      data.last_name,
      data.first_name,
      data.company || '',
      data.city || '',
      data.postcode || '',
      data.street || '',
      calculatedData.sizesFormatted || '',
      data.color || '',
      calculatedData.totalSqm || '',
      data.shipping || '',
      calculatedData.screwBoxes || '',
      calculatedData.screwPrice || '',
      data.secondhand || '',
      'Igen',
      calculatedData.totalPrice || '',
      data.quote_id || '',
      'Visszahívást kért',
      calculatedData.gclid || '',
      data.source_page || 'ajanlat',
      calculatedData.utm_source || '',
      calculatedData.utm_medium || '',
      calculatedData.utm_campaign || '',
      calculatedData.utm_term || '',
      calculatedData.utm_content || '',
    ];

    const range = encodeURIComponent('Trapez visszahivast kert!A:AA');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Sheets (visszahivast kert) append error:', error);
      return false;
    }

    console.log('Data appended to Trapez visszahivast kert sheet:', data.quote_id);
    return true;
  } catch (error) {
    console.error('Google Sheets (visszahivast kert) error:', error);
    return false;
  }
}
