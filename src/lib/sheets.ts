/**
 * Google Sheets Integration
 *
 * Saves all quote submissions to a Google Sheet.
 * Uses direct REST API calls instead of googleapis SDK for smaller bundle size.
 */

import type { CalculatorFormData } from './validation';
import { getEnvVar } from '../config/site';

// JWT creation for Google Service Account authentication
async function createJWT(): Promise<string | null> {
  const clientEmail = getEnvVar('GOOGLE_SHEETS_CLIENT_EMAIL');
  const privateKey = getEnvVar('GOOGLE_SHEETS_PRIVATE_KEY');

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
 * Columns: Dátum | Telefonszám | Email | Vezetéknév | Keresztnév | Cégnév | Város | Irányítószám | Utca házszám | Tételek | Szín | Szállítás | Csavar mennyiség | Csavar ára | Kishibás | Netes rendelés | Végösszeg | Ajánlat ID | Megjegyzés | GCLID | Forrás oldal
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
  }
): Promise<boolean> {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured');
    return false;
  }

  const accessToken = await getAccessToken();
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

    // Prepare row data matching user's column structure (A-U)
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
      data.shipping || '',                        // L: Szállítás
      calculatedData.screwBoxes || '',            // M: Csavar mennyiség (doboz)
      calculatedData.screwPrice || '',            // N: Csavar ára
      data.secondhand || '',                      // O: Kishibás
      'Igen',                                     // P: Netes rendelés (always yes from website)
      calculatedData.totalPrice,                  // Q: Végösszeg
      data.quote_id || '',                        // R: Ajánlat ID
      '',                                         // S: Megjegyzés
      calculatedData.gclid || '',                 // T: GCLID
      data.source_page || '',                     // U: Forrás oldal
    ];

    const range = encodeURIComponent('Trapez mind!A:U');
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
 * Check if sheet headers exist (user already has headers, this is just a check)
 */
export async function ensureSheetHeaders(): Promise<boolean> {
  // User already has headers configured in "Trapez mind" sheet
  // This function is kept for compatibility but does nothing
  return true;
}
