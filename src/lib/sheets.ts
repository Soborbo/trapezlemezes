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
 */
export async function appendToSheet(
  data: CalculatorFormData,
  calculatedData: {
    totalSqm: number;
    totalSheets: number;
    totalPrice: number;
    quoteUrl: string;
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
    // Prepare row data
    const row = [
      new Date().toISOString(), // Timestamp
      data.quote_id || '', // Quote ID
      data.first_name,
      data.last_name,
      data.company || '',
      data.email,
      data.phone,
      data.postcode,
      data.city,
      data.street,
      data.knows_sizes || '',
      data.usage || '',
      data.roof_type || '',
      data.color || '',
      data.shipping || '',
      data.screws || '',
      data.secondhand || '',
      calculatedData.totalSqm,
      calculatedData.totalSheets,
      calculatedData.totalPrice,
      calculatedData.quoteUrl,
      data.source_page || '',
    ];

    const range = encodeURIComponent('Ajánlatkérések!A:V');
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
 * Create header row if sheet is empty
 */
export async function ensureSheetHeaders(): Promise<boolean> {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_SPREADSHEET_ID');
  if (!spreadsheetId) return false;

  const accessToken = await getAccessToken();
  if (!accessToken) return false;

  try {
    // Check if headers exist
    const range = encodeURIComponent('Ajánlatkérések!A1:V1');
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      if (data.values && data.values.length > 0) {
        return true; // Headers already exist
      }
    }

    // Add headers
    const headers = [
      'Időpont',
      'Ajánlat ID',
      'Vezetéknév',
      'Keresztnév',
      'Cégnév',
      'E-mail',
      'Telefon',
      'Irányítószám',
      'Település',
      'Utca, házszám',
      'Tudja méreteket',
      'Felhasználás',
      'Tető típus',
      'Szín',
      'Szállítás',
      'Csavar',
      'Kishibás',
      'Összes m²',
      'Lemezszám',
      'Végösszeg',
      'Ajánlat URL',
      'Forrás oldal',
    ];

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Google Sheets header update error:', error);
      return false;
    }

    console.log('Sheet headers created');
    return true;
  } catch (error) {
    console.error('Google Sheets header error:', error);
    return false;
  }
}
