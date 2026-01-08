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

export default function QuoteConfirmationTemplate({
  firstName,
  quoteUrl,
}: QuoteConfirmationProps): string {
  return `
<table style="background-color: #f4f4f4;" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 20px;" align="center" valign="top">
<table style="background-color: #ffffff; max-width: 600px; width: 100%; margin: 0 auto; border-radius: 6px; overflow: hidden; font-family: sans-serif; color: #333;" border="0" width="600" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color: #4a51ac; padding: 30px; text-align: center;">
<h1 style="color: #ffffff; font-size: 24px; margin: 0;">Trapezlemezes.hu</h1>
</td>
</tr>
<tr>
<td style="text-align: center; font-size: 16px; padding: 20px;">
<p style="margin-bottom: 20px;"><strong>Kedves ${firstName}!</strong></p>
<p style="margin-bottom: 20px;">Köszönöm, hogy használta az online árajánlat-szolgáltatásunkat.</p>
<table style="margin: 0 auto;" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="text-align: center;"><a style="background-color: #ec1d23; color: #ffffff; font-weight: bold; text-decoration: none; font-size: 16px; padding: 14px 24px; border-radius: 6px; display: inline-block;" href="${quoteUrl}">TEKINTSE MEG ÁRBECSLÉSÉT</a></td>
</tr>
</tbody>
</table>
<p style="margin-top: 20px;">Ha az ajánlat elnyerte a tetszését, a legegyszerűbb, ha visszahívást kér az árajánlatot tartalmazó oldalon (kattintson a gombra!) vagy <strong>csak egyszerűen válaszoljon "igen"-t erre az e-mailre.</strong></p>
<p>Így munkatársunk a már megadott adatok birtokában hívja majd fel Önt és véglegesíti a rendelését.</p>
<p style="margin-top: 20px;"><img style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 0px; display: block; margin-left: auto; margin-right: auto;" src="https://trapezlemezes.hu/wp-content/uploads/2024/07/20240628_173905.jpg" alt="Trapezlemezes.hu" width="350" /></p>
<p style="margin-top: 20px;">Ha pedig bármiben, akár a szükséges méreteket, akár az anyagot illetően a legcsekélyebb bizonytalanságot is érzi, ne habozzon felhívni a</p>
<p><a style="font-size: 28px; color: red; font-weight: bold; text-decoration: none;" href="tel:+3613009206">+36 1 300-92-06</a></p>
<p>számon, örömmel segítünk!</p>
<p style="margin-top: 20px;"><strong>Tisztelettel:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin-left: auto; margin-right: auto; margin-top: 20px;" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="width: 50%; vertical-align: top; padding-right: 10px;"><img style="font-size: 16px; border-radius: 6px; float: right; max-width: 100%; height: auto;" src="https://trapezlemezes.hu/wp-content/uploads/2024/07/roland.jpg" alt="Farkas Roland" width="150" /></td>
<td style="width: 50%; text-align: left; padding-left: 15px; vertical-align: middle;"><strong>Farkas Roland</strong><br />Ügyvezető<br />Trapezlemezes.hu<br />+36 1 300-9206<br /><a href="mailto:hello@trapezlemezes.hu">hello@trapezlemezes.hu</a></td>
</tr>
</tbody>
</table>
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
