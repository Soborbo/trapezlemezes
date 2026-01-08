/**
 * Callback Request Email Template
 *
 * Sent to admin when customer requests a callback from the quote page.
 */

interface CallbackRequestProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalPrice: number;
  quoteId: string;
  quoteUrl: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU').format(price);
}

export default function CallbackRequestTemplate({
  firstName,
  lastName,
  email,
  phone,
  totalPrice,
  quoteId,
  quoteUrl,
}: CallbackRequestProps): string {
  return `
<table style="background-color: #f4f4f4;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 20px;" align="center" valign="top">
<table style="background-color: #ffffff; max-width: 600px; width: 100%; margin: 0 auto; border-radius: 6px; overflow: hidden; font-family: sans-serif; color: #333;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color: #ffc107; padding: 20px; text-align: center;">
<h1 style="color: #333; font-size: 22px; margin: 0;">📞 Visszahívás Kérés</h1>
</td>
</tr>
<tr>
<td style="padding: 30px;">

  <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
    <p style="margin: 0; font-weight: bold; color: #856404; font-size: 16px;">
      Az ügyfél visszahívást kért az árajánlat oldalról!
    </p>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: #555;">
    Ez az ügyfél érdeklődik és szeretné, ha visszahívnád. Hívd fel mielőbb!
  </p>

  <p style="margin: 20px 0; text-align: center;">
    <a href="tel:${phone.replace(/\s/g, '')}" style="background-color: #ec1d23; color: #ffffff!important; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">📞 ${phone}</a>
  </p>

  <h2 style="color: #046bd2; font-size: 18px; margin: 25px 0 15px; border-bottom: 2px solid #046bd2; padding-bottom: 8px;">👤 Ügyfél Adatok</h2>
  <table style="width: 100%; margin-bottom: 20px;">
    <tr>
      <td style="padding: 8px 0; width: 35%; font-weight: bold; color: #555;">Név:</td>
      <td style="padding: 8px 0;">${lastName} ${firstName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
      <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #046bd2;">${email}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #555;">Telefon:</td>
      <td style="padding: 8px 0;"><a href="tel:${phone.replace(/\s/g, '')}" style="color: #046bd2; font-size: 16px; font-weight: bold;">${phone}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #555;">Becsült ár:</td>
      <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #046bd2;">${formatPrice(totalPrice)} Ft</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-weight: bold; color: #555;">Ajánlat ID:</td>
      <td style="padding: 8px 0; font-family: monospace;">${quoteId}</td>
    </tr>
  </table>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${quoteUrl}" style="background-color: #046bd2; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">📄 Ajánlat Megtekintése</a>
  </div>

  <div style="background: #e7f3ff; border-left: 4px solid #046bd2; padding: 15px; margin-top: 25px; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #046bd2;">
      💡 <strong>Tipp:</strong> Hívd vissza az ügyfelet mielőbb, mert most aktívan érdeklődik!
    </p>
  </div>

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
