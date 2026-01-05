/**
 * Admin Notification Email Template
 *
 * Sent to the admin when a new quote request is submitted.
 */

import type { CalculatorFormData } from '../lib/validation';

interface AdminNotificationProps {
  data: CalculatorFormData;
  quoteUrl: string;
}

const USAGE_LABELS: Record<string, string> = {
  teto: 'Tető',
  kerites: 'Kerítés',
  teto_es_oldalfal: 'Tető és oldalfal',
};

const ROOF_TYPE_LABELS: Record<string, string> = {
  nyereg: 'Nyeregtető',
  felteto: 'Féltető',
};

const SHIPPING_LABELS: Record<string, string> = {
  gazdasagos: 'Gazdaságos szállítás',
  expressz: 'Expressz szállítás',
  sajat: 'Saját szállítás',
};

const SCREW_LABELS: Record<string, string> = {
  fa: 'Fa csavar',
  fem: 'Fém csavar',
  vegyes: 'Vegyes',
  nem: 'Nem kér',
};

export default function AdminNotificationTemplate({
  data,
  quoteUrl,
}: AdminNotificationProps): string {
  const formattedDate = new Date().toLocaleString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Új árajánlatkérés - ${data.quote_id}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #16a34a; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">
                🎉 Új árajánlatkérés érkezett!
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Quote ID -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #166534;">
                  Ajánlat azonosító: ${data.quote_id}
                </p>
              </div>

              <!-- Customer Info -->
              <h2 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Ügyfél adatai
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;">Név:</td>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">${data.first_name} ${data.last_name}</td>
                </tr>
                ${data.company ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Cég:</td>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">${data.company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">E-mail:</td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${data.email}" style="color: #259bd7; text-decoration: none; font-weight: 500;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Telefon:</td>
                  <td style="padding: 8px 0;">
                    <a href="tel:${data.phone}" style="color: #259bd7; text-decoration: none; font-weight: 500;">${data.phone}</a>
                  </td>
                </tr>
              </table>

              <!-- Address -->
              <h2 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Szállítási cím
              </h2>
              <p style="margin: 0 0 24px 0; color: #374151; line-height: 1.6;">
                ${data.postcode} ${data.city}<br>
                ${data.street}
              </p>

              <!-- Quote Details -->
              <h2 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Igények
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                ${data.usage ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 140px;">Felhasználás:</td>
                  <td style="padding: 8px 0; color: #374151;">${USAGE_LABELS[data.usage] || data.usage}</td>
                </tr>
                ` : ''}
                ${data.roof_type ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Tető típus:</td>
                  <td style="padding: 8px 0; color: #374151;">${ROOF_TYPE_LABELS[data.roof_type] || data.roof_type}</td>
                </tr>
                ` : ''}
                ${data.color ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Szín:</td>
                  <td style="padding: 8px 0; color: #374151;">${data.color}</td>
                </tr>
                ` : ''}
                ${data.shipping ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Szállítás:</td>
                  <td style="padding: 8px 0; color: #374151;">${SHIPPING_LABELS[data.shipping] || data.shipping}</td>
                </tr>
                ` : ''}
                ${data.screws ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Csavar:</td>
                  <td style="padding: 8px 0; color: #374151;">${SCREW_LABELS[data.screws] || data.screws}</td>
                </tr>
                ` : ''}
                ${data.secondhand ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Kishibás elfogad:</td>
                  <td style="padding: 8px 0; color: #374151;">${data.secondhand === 'yes' ? 'Igen' : 'Nem'}</td>
                </tr>
                ` : ''}
              </table>

              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${quoteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #259bd7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin: 0 8px;">
                      Ajánlat megtekintése
                    </a>
                    <a href="mailto:${data.email}" style="display: inline-block; padding: 14px 28px; background-color: #374151; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin: 0 8px;">
                      E-mail küldése
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Forrás: ${data.source_page || 'Kalkulátor'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
