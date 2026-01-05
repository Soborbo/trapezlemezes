/**
 * Callback Request Email Template
 *
 * Sent to admin when a customer requests a callback.
 */

interface CallbackRequestProps {
  name: string;
  phone: string;
  email?: string;
  quoteId?: string;
  quoteData?: {
    color?: string;
    shipping?: string;
    postcode?: string;
    city?: string;
    street?: string;
  };
}

const SHIPPING_LABELS: Record<string, string> = {
  gazdasagos: 'Gazdaságos szállítás',
  expressz: 'Expressz szállítás',
  sajat: 'Saját szállítás',
};

export default function CallbackRequestTemplate({
  name,
  phone,
  email,
  quoteId,
  quoteData,
}: CallbackRequestProps): string {
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
  <title>Visszahívás kérés - ${name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #f59e0b; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">
                📞 Visszahívás kérés érkezett!
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Priority Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #92400e;">
                  ⚡ SÜRGŐS - Ügyfél visszahívást kért!
                </p>
              </div>

              <!-- Customer Info -->
              <h2 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Ügyfél adatai
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;">Név:</td>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Telefon:</td>
                  <td style="padding: 8px 0;">
                    <a href="tel:${phone}" style="color: #259bd7; text-decoration: none; font-weight: 700; font-size: 18px;">${phone}</a>
                  </td>
                </tr>
                ${email ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">E-mail:</td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${email}" style="color: #259bd7; text-decoration: none; font-weight: 500;">${email}</a>
                  </td>
                </tr>
                ` : ''}
              </table>

              ${quoteId ? `
              <!-- Quote Info -->
              <h2 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Ajánlat információk
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 140px;">Ajánlat ID:</td>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">${quoteId}</td>
                </tr>
                ${quoteData?.color ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Szín:</td>
                  <td style="padding: 8px 0; color: #374151;">${quoteData.color}</td>
                </tr>
                ` : ''}
                ${quoteData?.shipping ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Szállítás:</td>
                  <td style="padding: 8px 0; color: #374151;">${SHIPPING_LABELS[quoteData.shipping] || quoteData.shipping}</td>
                </tr>
                ` : ''}
                ${quoteData?.postcode && quoteData?.city ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Cím:</td>
                  <td style="padding: 8px 0; color: #374151;">
                    ${quoteData.postcode} ${quoteData.city}${quoteData.street ? `<br>${quoteData.street}` : ''}
                  </td>
                </tr>
                ` : ''}
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="tel:${phone}" style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      📞 Hívás indítása: ${phone}
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
                Ez az értesítés automatikusan lett kiküldve a Trapezlemezes.hu árajánlat oldalról.
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
