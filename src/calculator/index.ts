/**
 * Calculator Module
 *
 * Használat:
 * import { adminConfig, colors, calculateQuote } from '../calculator';
 */

// Config exports
export {
  adminConfig,
  sheetSpecs,
  colors,
  shippingOptions,
  screwConfig,
  calculatorUI,
  analyticsEvents,
  steps,
  socialProof,
  type ColorOption,
  type ShippingOption,
  type StepConfig,
} from './config';

// Calculation exports
export {
  basePrices,
  shippingZones,
  defaultShippingPrice,
  freeShippingThreshold,
  screwPricing,
  volumeDiscounts,
  calculateSheets,
  calculateRoofSheets,
  calculateFenceSheets,
  getColorType,
  calculateSheetPrice,
  getVolumeDiscount,
  calculateShippingCost,
  calculateScrewCost,
  calculateQuote,
  formatPrice,
  generateQuoteId,
  type SizeEntry,
  type SheetCalculation,
  type RoofDimensions,
  type FenceDimensions,
  type VolumeDiscount,
  type ShippingZone,
  type QuoteInput,
  type QuoteResult,
} from './calculation';
