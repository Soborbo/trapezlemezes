/**
 * Admin Notification Email Template
 *
 * Sent to the admin when a high-value quote request is submitted (>340,000 Ft).
 */

import type { CalculatorFormData } from '../lib/validation';

interface AdminNotificationProps {
  data: CalculatorFormData;
  quoteUrl: string;
  totalPrice: number;
  totalSqm: number;
  screwBoxes: number;
  screwPrice: number;
  sizesFormatted: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price);
}

export default function AdminNotificationTemplate({
  data,
  quoteUrl,
  totalPrice,
  totalSqm,
  screwBoxes,
  screwPrice,
  sizesFormatted,
}: AdminNotificationProps): string {
  return `
<table style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', sans-serif;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 20px 10px;" align="center">
<table style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;" border="0" width="600" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color: #1a973f; padding: 25px 20px; text-align: center;">
<h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: bold;">Nagyösszegű árajánlatot adtunk ki</h1>
</td>
</tr>
<tr>
<td style="padding: 30px; font-size: 16px; line-height: 1.6; color: #333333;">
<p style="margin: 0 0 15px;">Szia!</p>
<p style="margin: 0 0 25px;">Egy új nagyösszegű árajánlatot adtunk ki a trapezlemezes.hu oldalon. A kiadott árajánlat összege: <strong><span style="color: #0000ff;">${formatPrice(totalPrice)}</span> </strong><span style="color: #3f48cc;"><strong>Ft</strong></span>.</p>
<p style="margin: 0 0 25px;">Kérlek, nézd át az alábbi adatokat és <strong>hívd fel, amint lehet</strong>!</p>
<p style="margin: 0 0 30px;" align="center"><a style="background-color: #ec1d23; color: #ffffff!important; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 17px;" href="tel:${data.phone}">Telefonszám: ${data.phone}</a></p>

<table style="border-collapse: collapse; border: 1px solid #dddddd; border-radius: 6px;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px; width: 35%;">Azonosító</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.quote_id || '-'}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Az ügyfél neve</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.last_name} ${data.first_name}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Cégnév (ha van)</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.company || '-'}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Telefonszám</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.phone}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Email cím</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;"><a href="mailto:${data.email}">${data.email}</a></td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Szín</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.color || '-'}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Kért négyzetméter</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${totalSqm} m²</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Megrendelt tételek</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${sizesFormatted || '-'}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Hány doboz csavar</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${screwBoxes || 0}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">A csavar ára</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${formatPrice(screwPrice || 0)} Ft</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Szállítás</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.shipping === 'gazdasagos' ? 'Gazdaságos' : data.shipping === 'expressz' ? 'Expressz' : 'Saját'}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Szállítási cím</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.postcode} ${data.city}, ${data.street}</td>
</tr>
<tr>
<td style="border-bottom: 1px solid #dddddd; background: #f9f9f9; font-weight: bold; padding: 12px;">Másodosztályú is érdekli?</td>
<td style="border-bottom: 1px solid #dddddd; padding: 12px;">${data.secondhand === 'yes' ? 'Igen' : 'Nem'}</td>
</tr>
</tbody>
</table>

<p style="margin: 30px 0 0; text-align: center;">
<a style="background-color: #259bd7; color: #ffffff!important; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px;" href="${quoteUrl}">Ajánlat megtekintése</a>
</p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
  `.trim();
}
