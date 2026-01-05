/**
 * Quote Submission API Endpoint
 *
 * Handles form submission, validation, email sending, and Google Sheets integration.
 */

import type { APIRoute } from 'astro';
import { validateForm, correctEmailTypos } from '../../lib/validation';
import { sendQuoteConfirmation, sendAdminNotification } from '../../lib/email';
import { appendToSheet, ensureSheetHeaders } from '../../lib/sheets';
import { generateQuoteId, generateQuoteUrl } from '../../lib/quote-hash';
import { calculateQuote, calculateRoofSheets, calculateFenceSheets, type SizeEntry } from '../../calculator';
import { validateCsrfFromRequest } from '../../lib/csrf';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // CSRF validation
  const csrfError = validateCsrfFromRequest(request);
  if (csrfError) return csrfError;

  try {
    // Parse form data
    const formData = await request.formData();
    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      // Handle arrays (like sizes)
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2);
        if (!data[arrayKey]) {
          data[arrayKey] = [];
        }
        (data[arrayKey] as unknown[]).push(value);
      } else {
        data[key] = value;
      }
    });

    // Generate quote ID and timestamp
    data.quote_id = generateQuoteId();
    data.timestamp = new Date().toISOString();

    // Correct email typos
    if (typeof data.email === 'string') {
      data.email = correctEmailTypos(data.email);
    }

    // Validate
    const validation = validateForm(data);

    if (!validation.success) {
      console.log('Validation failed:', validation.errors);
      console.log('Received data:', JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          errors: validation.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validatedData = validation.data!;

    // Additional validation: require address if shipping is not 'sajat'
    if (validatedData.shipping && validatedData.shipping !== 'sajat') {
      const addressErrors: Record<string, string> = {};

      if (!validatedData.postcode) {
        addressErrors.postcode = 'Irányítószám megadása kötelező szállítás esetén';
      }
      if (!validatedData.city) {
        addressErrors.city = 'Település megadása kötelező szállítás esetén';
      }
      if (!validatedData.street) {
        addressErrors.street = 'Utca, házszám megadása kötelező szállítás esetén';
      }

      if (Object.keys(addressErrors).length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            errors: addressErrors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Calculate quote (if sizes are provided)
    let breakdown: Array<{ label: string; value: number }> = [];
    let calculatedData = {
      totalSqm: 0,
      totalSheets: 0,
      totalPrice: 0,
      quoteUrl: '',
    };

    // Parse sizes from form data
    // Support both array format (size_length[]) and numbered format (length_1, length_2, etc.)
    const sizes: SizeEntry[] = [];

    // Try array format first (size_length[], size_quantity[])
    const sizeLengths = data.size_length as string[] | undefined;
    const sizeQuantities = data.size_quantity as string[] | undefined;

    if (sizeLengths && sizeQuantities) {
      for (let i = 0; i < sizeLengths.length; i++) {
        const length = parseInt(sizeLengths[i], 10);
        const quantity = parseInt(sizeQuantities[i], 10);
        if (length > 0 && quantity > 0) {
          sizes.push({ length, quantity });
        }
      }
    }

    // If no array data, try numbered format (length_1, quantity_1, etc.)
    if (sizes.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const lengthKey = `length_${i}`;
        const quantityKey = `quantity_${i}`;
        const lengthVal = data[lengthKey] as string | undefined;
        const quantityVal = data[quantityKey] as string | undefined;

        if (lengthVal && quantityVal) {
          const length = parseInt(lengthVal, 10);
          const quantity = parseInt(quantityVal, 10);
          if (length > 0 && quantity > 0) {
            sizes.push({ length, quantity });
          }
        }
      }
    }

    // If still no sizes, calculate from roof dimensions
    if (sizes.length === 0) {
      const roofType = data.roof_type as string | undefined;
      for (let i = 1; i <= 5; i++) {
        const roofA = parseInt(data[`roof_${i}_a`] as string, 10);
        const roofB = parseInt(data[`roof_${i}_b`] as string, 10);
        const roofC = parseInt(data[`roof_${i}_c`] as string, 10) || undefined;
        const roofD = parseInt(data[`roof_${i}_d`] as string, 10) || undefined;

        if (roofA > 0 && roofB > 0) {
          const roofCalc = calculateRoofSheets({
            type: roofType === 'felteto' ? 'felnyereg' : 'nyereg',
            a: roofA,
            b: roofB,
            c: roofC,
            d: roofD,
          });
          sizes.push(...roofCalc.sizes.map(s => ({ length: s.length, quantity: s.quantity })));
        }
      }
    }

    // If still no sizes, calculate from fence dimensions
    if (sizes.length === 0) {
      // Simple mode: fence_length and fence_height
      const fenceLength = parseInt(data.fence_length as string, 10);
      const fenceHeight = parseInt(data.fence_height as string, 10);

      if (fenceLength > 0 && fenceHeight > 0) {
        const fenceCalc = calculateFenceSheets({ length: fenceLength, height: fenceHeight });
        sizes.push(...fenceCalc.sizes.map(s => ({ length: s.length, quantity: s.quantity })));
      } else {
        // Sides mode: fence_side_N_length and fence_side_N_height
        for (let i = 1; i <= 10; i++) {
          const sideLength = parseInt(data[`fence_side_${i}_length`] as string, 10);
          const sideHeight = parseInt(data[`fence_side_${i}_height`] as string, 10);

          if (sideLength > 0 && sideHeight > 0) {
            const fenceCalc = calculateFenceSheets({ length: sideLength, height: sideHeight });
            sizes.push(...fenceCalc.sizes.map(s => ({ length: s.length, quantity: s.quantity })));
          }
        }
      }
    }

    if (sizes.length > 0 && validatedData.color) {
      const quote = calculateQuote({
        sizes,
        colorId: validatedData.color,
        shippingType: validatedData.shipping || 'gazdasagos',
        postcode: validatedData.postcode,
        includeScrews: validatedData.screws !== 'nem',
      });

      breakdown = quote.breakdown;
      calculatedData = {
        totalSqm: quote.sheets.totalSqm,
        totalSheets: quote.sheets.totalSheets,
        totalPrice: quote.total,
        quoteUrl: '',
      };
    }

    // Generate quote URL (including sizes for recalculation on ajanlat page)
    const baseUrl = new URL(request.url).origin;
    const quoteDataWithSizes = { ...validatedData, sizes };
    const quoteUrl = generateQuoteUrl(quoteDataWithSizes, baseUrl);
    calculatedData.quoteUrl = quoteUrl;

    // Send emails and save to sheets - don't fail if these fail
    let customerEmailSent = false;
    let adminEmailSent = false;
    let sheetsSaved = false;

    try {
      // Send emails in parallel
      const emailPromises = [
        sendQuoteConfirmation(validatedData, quoteUrl, breakdown).catch(() => false),
        sendAdminNotification(validatedData, quoteUrl).catch(() => false),
      ];

      // Save to Google Sheets
      await ensureSheetHeaders().catch(() => {});
      const sheetsPromise = appendToSheet(validatedData, calculatedData).catch(() => false);

      // Wait for all operations
      [customerEmailSent, adminEmailSent, sheetsSaved] = await Promise.all([
        ...emailPromises,
        sheetsPromise,
      ]);
    } catch (serviceError) {
      console.error('Service error (non-fatal):', serviceError);
      // Continue - we still want to return success to the user
    }

    console.log('Quote submission result:', {
      quoteId: validatedData.quote_id,
      customerEmailSent,
      adminEmailSent,
      sheetsSaved,
    });

    return new Response(
      JSON.stringify({
        success: true,
        quoteId: validatedData.quote_id,
        quoteUrl,
        emailSent: customerEmailSent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Quote submission error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Hiba történt az ajánlatkérés feldolgozása során. Kérjük, próbálja újra.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
