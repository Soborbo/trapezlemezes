/**
 * Calculator Logic & Pricing
 *
 * Ez a fájl tartalmazza a kalkulátor számítási logikáját.
 * Itt módosíthatod az árakat, kedvezményeket, szállítási díjakat stb.
 */

import { sheetSpecs, colors, type ColorOption } from './config';

// ============================================
// ALAPÁRAK (Ft/m²)
// ============================================

export const basePrices: Record<string, number> = {
  /** Standard színek alapára Ft/m² */
  standard: 2640,

  /** Prémium színek (famintás) Ft/m² */
  premium: 2840,

  /** Speciális (horganyzott natúr) Ft/m² */
  special: 2240,

  /** Akciós narancssárga Ft/m² */
  promo: 2249,
};

// ============================================
// SZÁLLÍTÁSI DÍJAK
// ============================================

/** Szállítási zónák (CRM-hez szükséges, de az ár nem függ tőle) */
export interface ShippingZone {
  /** Irányítószám tartomány kezdete */
  from: number;
  /** Irányítószám tartomány vége */
  to: number;
  /** Zóna neve */
  name: string;
}

export const shippingZones: ShippingZone[] = [
  { from: 1000, to: 1999, name: 'Budapest' },
  { from: 2000, to: 2999, name: 'Pest megye' },
  { from: 3000, to: 3999, name: 'Észak-Magyarország' },
  { from: 4000, to: 4999, name: 'Észak-Alföld' },
  { from: 5000, to: 5999, name: 'Dél-Alföld' },
  { from: 6000, to: 6999, name: 'Dél-Alföld' },
  { from: 7000, to: 7999, name: 'Dél-Dunántúl' },
  { from: 8000, to: 8999, name: 'Közép-Dunántúl' },
  { from: 9000, to: 9999, name: 'Nyugat-Dunántúl' },
];

/** Fix szállítási díjak (Ft) */
export const shippingPrices = {
  /** Gazdaságos szállítás díja */
  economy: 19990,
  /** Expressz szállítás díja */
  express: 39990,
};

/** Ingyenes szállítás limit (m² felett) */
export const freeShippingSqmThreshold = 250;

// ============================================
// CSAVAR ÁR
// ============================================

export const screwPricing = {
  /** Egy doboz csavar ára (Ft) - GravityForms: 5990 */
  pricePerBox: 5990,

  /** Csavarok száma egy dobozban */
  screwsPerBox: 250,

  /** Hány m²-hez elég 1 doboz (GravityForms: 25) */
  sqmPerBox: 25,
};

// ============================================
// MENNYISÉGI KEDVEZMÉNYEK (jelenleg nincs)
// ============================================

export interface VolumeDiscount {
  /** Minimum m² */
  minSqm: number;
  /** Kedvezmény % */
  discountPercent: number;
}

/** Jelenleg nincsenek mennyiségi kedvezmények */
export const volumeDiscounts: VolumeDiscount[] = [];

// ============================================
// SZÁMÍTÁSI FÜGGVÉNYEK
// ============================================

/**
 * Számítja a szükséges lemezek számát a megadott méretek alapján
 */
export interface SizeEntry {
  length: number; // cm
  quantity: number;
}

export interface SheetCalculation {
  /** Összes lemezszám */
  totalSheets: number;
  /** Összes m² */
  totalSqm: number;
  /** Méretek részletezése */
  sizes: Array<{
    length: number;
    quantity: number;
    sqmPerSheet: number;
    sqmTotal: number;
  }>;
}

export function calculateSheets(sizes: SizeEntry[]): SheetCalculation {
  const result: SheetCalculation = {
    totalSheets: 0,
    totalSqm: 0,
    sizes: [],
  };

  for (const size of sizes) {
    if (!size.length || !size.quantity) continue;

    // Egy lemez m²-e (hossz × teljes szélesség)
    // Anyagszükséglet számításnál a teljes szélesség számít (116 cm), nem a fedett (110 cm)
    const sqmPerSheet = (size.length / 100) * (sheetSpecs.totalWidth / 100);
    const sqmTotal = sqmPerSheet * size.quantity;

    result.sizes.push({
      length: size.length,
      quantity: size.quantity,
      sqmPerSheet: Math.round(sqmPerSheet * 100) / 100,
      sqmTotal: Math.round(sqmTotal * 100) / 100,
    });

    result.totalSheets += size.quantity;
    result.totalSqm += sqmTotal;
  }

  result.totalSqm = Math.round(result.totalSqm * 100) / 100;
  return result;
}

/**
 * Számítja a tető típus alapján szükséges lemezeket
 */
export interface RoofDimensions {
  type: 'nyereg' | 'felnyereg' | 'lapos';
  a: number; // cm - egyik oldal
  b: number; // cm - másik oldal
  c?: number; // cm - nyeregtető másik oldala
  d?: number; // cm - nyeregtető másik oldala
}

export function calculateRoofSheets(roof: RoofDimensions): SheetCalculation {
  const coverWidthM = sheetSpecs.coverWidth / 100;
  const sizes: SizeEntry[] = [];

  switch (roof.type) {
    case 'nyereg': {
      // Nyeregtető: 2 lejtős oldal
      // A oldal = szélesség, B oldal = lejtő hossza
      // C és D = másik oldal méretei (ha eltér)
      const sheetsA = Math.ceil((roof.a / 100) / coverWidthM);
      const sheetsC = roof.c ? Math.ceil((roof.c / 100) / coverWidthM) : sheetsA;

      sizes.push({ length: roof.b, quantity: sheetsA });
      if (roof.d && roof.d !== roof.b) {
        sizes.push({ length: roof.d, quantity: sheetsC });
      } else {
        sizes[0].quantity += sheetsC;
      }
      break;
    }

    case 'felnyereg': {
      // Félnyeregtető: 1 lejtős oldal
      const sheets = Math.ceil((roof.a / 100) / coverWidthM);
      sizes.push({ length: roof.b, quantity: sheets });
      break;
    }

    case 'lapos': {
      // Lapostető: egyszerű téglalap
      const sheets = Math.ceil((roof.a / 100) / coverWidthM);
      sizes.push({ length: roof.b, quantity: sheets });
      break;
    }
  }

  return calculateSheets(sizes);
}

/**
 * Számítja a kerítéshez szükséges lemezeket
 */
export interface FenceDimensions {
  length: number; // cm - kerítés összhossza
  height: number; // cm - kerítés magassága (= lemezhossz)
}

export function calculateFenceSheets(fence: FenceDimensions): SheetCalculation {
  const coverWidthM = sheetSpecs.coverWidth / 100;
  const sheets = Math.ceil((fence.length / 100) / coverWidthM);

  return calculateSheets([{ length: fence.height, quantity: sheets }]);
}

/**
 * Megkeresi a szín típusát
 */
export function getColorType(colorId: string): ColorOption['type'] {
  const color = colors.find(c => c.id === colorId);
  return color?.type || 'standard';
}

/**
 * Számítja a lemezek árát
 */
export function calculateSheetPrice(sqm: number, colorId: string): number {
  const colorType = getColorType(colorId);
  const basePrice = basePrices[colorType];
  return Math.round(sqm * basePrice);
}

/**
 * Számítja a mennyiségi kedvezményt
 */
export function getVolumeDiscount(sqm: number): number {
  let discount = 0;
  for (const tier of volumeDiscounts) {
    if (sqm >= tier.minSqm) {
      discount = tier.discountPercent;
    }
  }
  return discount;
}

/**
 * Számítja a szállítási díjat
 * Fix árak: gazdaságos 19 990 Ft, expressz 39 990 Ft
 * 250 m² felett ingyenes
 */
export function calculateShippingCost(
  shippingType: 'gazdasagos' | 'expressz' | 'sajat',
  totalSqm: number
): number {
  if (shippingType === 'sajat') return 0;

  // Ingyenes szállítás 250 m² felett
  if (totalSqm >= freeShippingSqmThreshold) return 0;

  return shippingType === 'expressz'
    ? shippingPrices.express
    : shippingPrices.economy;
}

/**
 * Megkeresi a szállítási zónát irányítószám alapján (CRM-hez)
 */
export function getShippingZone(postcode: string): ShippingZone | null {
  const postcodeNum = parseInt(postcode, 10);
  return shippingZones.find(z => postcodeNum >= z.from && postcodeNum <= z.to) || null;
}

/**
 * Számítja a csavar költségét
 * GravityForms képlet: négyzetméter / 25 = dobozok száma
 */
export function calculateScrewCost(sqm: number): { boxes: number; price: number } {
  const boxes = Math.ceil(sqm / screwPricing.sqmPerBox);
  return {
    boxes,
    price: boxes * screwPricing.pricePerBox,
  };
}

/**
 * Teljes árajánlat kalkuláció
 */
export interface QuoteInput {
  sizes: SizeEntry[];
  colorId: string;
  shippingType: 'gazdasagos' | 'expressz' | 'sajat';
  postcode?: string;
  includeScrews: boolean;
}

export interface QuoteResult {
  sheets: SheetCalculation;
  sheetPrice: number;
  discountPercent: number;
  discountAmount: number;
  sheetPriceAfterDiscount: number;
  screws?: { boxes: number; price: number };
  shippingCost: number;
  total: number;
  pricePerSqm: number;
  breakdown: Array<{ label: string; value: number }>;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  // Lemezszámítás
  const sheets = calculateSheets(input.sizes);

  // Lemez ár
  const sheetPrice = calculateSheetPrice(sheets.totalSqm, input.colorId);

  // Kedvezmény
  const discountPercent = getVolumeDiscount(sheets.totalSqm);
  const discountAmount = Math.round(sheetPrice * (discountPercent / 100));
  const sheetPriceAfterDiscount = sheetPrice - discountAmount;

  // Csavar
  const screws = input.includeScrews ? calculateScrewCost(sheets.totalSqm) : undefined;

  // Szállítás (fix árak, 250 m² felett ingyenes)
  const subtotalBeforeShipping = sheetPriceAfterDiscount + (screws?.price || 0);
  const shippingCost = calculateShippingCost(
    input.shippingType,
    sheets.totalSqm
  );

  // Végösszeg (bruttó árak, ÁFA már benne van)
  const total = subtotalBeforeShipping + shippingCost;

  // Átlag ár/m²
  const pricePerSqm = sheets.totalSqm > 0
    ? Math.round(total / sheets.totalSqm)
    : 0;

  // Részletezés
  const breakdown: Array<{ label: string; value: number }> = [
    { label: `Trapézlemez (${sheets.totalSqm} m²)`, value: sheetPrice },
  ];

  if (discountAmount > 0) {
    breakdown.push({ label: `Mennyiségi kedvezmény (${discountPercent}%)`, value: -discountAmount });
  }

  if (screws) {
    breakdown.push({ label: `Tetőcsavar (${screws.boxes} doboz)`, value: screws.price });
  }

  if (shippingCost > 0) {
    breakdown.push({ label: 'Szállítási díj', value: shippingCost });
  } else if (input.shippingType !== 'sajat') {
    breakdown.push({ label: 'Szállítás (ingyenes)', value: 0 });
  }

  breakdown.push({ label: 'Összesen (bruttó)', value: total });

  return {
    sheets,
    sheetPrice,
    discountPercent,
    discountAmount,
    sheetPriceAfterDiscount,
    screws,
    shippingCost,
    total,
    pricePerSqm,
    breakdown,
  };
}

/**
 * Formázza az árat magyar formátumban
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Note: generateQuoteId is defined in lib/quote-hash.ts
// Re-export for backward compatibility
export { generateQuoteId } from '../lib/quote-hash';
