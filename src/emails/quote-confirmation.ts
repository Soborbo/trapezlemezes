/**
 * Quote Confirmation Email Template
 *
 * Sent to the customer after submitting a quote request.
 */

interface QuoteConfirmationProps {
  firstName: string;
  lastName: string;
  company?: string;
  quoteId: string;
  quoteUrl: string;
  breakdown: Array<{ label: string; value: number }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function QuoteConfirmationTemplate({
  firstName,
  lastName,
  company,
  quoteId,
  quoteUrl,
  breakdown,
}: QuoteConfirmationProps): string {
  const greeting = company
    ? `Tisztelt ${lastName} ${firstName} (${company})!`
    : `Tisztelt ${lastName} ${firstName}!`;

  const breakdownHtml = breakdown
    .map(item => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">
          ${item.label}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: ${item.label === 'Összesen' ? '700' : '400'}; color: ${item.value < 0 ? '#16a34a' : '#374151'};">
          ${item.value < 0 ? '-' : ''}${formatPrice(Math.abs(item.value))}
        </td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trapézlemez árajánlat - ${quoteId}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #259bd7; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Trapézlemez árajánlat
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Azonosító: ${quoteId}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Köszönjük, hogy trapézlemez árajánlatot kért tőlünk! Az alábbiakban találja a kalkulált árakat:
              </p>

              <!-- Price breakdown -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                      Tétel
                    </th>
                    <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                      Ár
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${breakdownHtml}
                </tbody>
              </table>

              <p style="margin: 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Ez egy előzetes kalkuláció. A végleges árat a pontos felmérés után tudjuk megerősíteni. Munkatársunk hamarosan felveszi Önnel a kapcsolatot.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${quoteUrl}" style="display: inline-block; padding: 16px 32px; background-color: #259bd7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Ajánlat megtekintése
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                A fenti linkre kattintva bármikor visszatérhet az ajánlatához és módosíthatja a paramétereket.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">
                      Trapezlemezes.hu
                    </p>
                    <p style="margin: 0;">
                      Telefon: <a href="tel:+36309386050" style="color: #259bd7; text-decoration: none;">+36 30 938 6050</a>
                    </p>
                    <p style="margin: 4px 0 0 0;">
                      E-mail: <a href="mailto:info@trapezlemezes.hu" style="color: #259bd7; text-decoration: none;">info@trapezlemezes.hu</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <p style="max-width: 600px; margin: 24px auto 0 auto; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5;">
          Ez az e-mail automatikusan került kiküldésre. Kérjük, ne válaszoljon rá közvetlenül.
          Ha kérdése van, írjon az info@trapezlemezes.hu címre.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
