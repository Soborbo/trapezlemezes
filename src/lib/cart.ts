/**
 * Cart Store - localStorage-alapú kosár kezelés
 *
 * CustomEvent-ekkel szinkronizálja a UI-t (pl. Header badge).
 * A kalkulátor output és a gyors rendelés is ide ír.
 */

import { basePrices, calculateScrewCost, calculateShippingCost } from '../calculator/calculation';
import { colors } from '../calculator/config';

// ============================================
// TÍPUSOK
// ============================================

export interface CartItem {
  /** Egyedi azonosító */
  id: string;
  /** Szín azonosító (pl. 'antracit') */
  colorId: string;
  /** Szín megjelenítési neve (pl. 'Antracit RAL 7016') */
  colorLabel: string;
  /** Szín típus (standard/premium/special/promo) */
  colorType: string;
  /** Terület m²-ben */
  sqm: number;
  /** Méretlista (opcionális, kalkulátorból jön) */
  lengths?: Array<{ length: number; quantity: number }>;
  /** Ár per m² */
  pricePerSqm: number;
  /** Lemez összár */
  totalPrice: number;
  /** Csavar kell-e */
  withScrews: boolean;
  /** Csavar ár */
  screwCost: number;
  /** Forrás: kalkulátor vagy gyors rendelés */
  source: 'calculator' | 'quick';
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  totalSqm: number;
  sheetSubtotal: number;
  screwTotal: number;
  subtotal: number;
  shippingType: 'gazdasagos' | 'expressz' | 'sajat';
  shippingCost: number;
  grandTotal: number;
}

// ============================================
// CONSTANTS
// ============================================

const CART_STORAGE_KEY = 'trapez_cart';
const SHIPPING_STORAGE_KEY = 'trapez_cart_shipping';
const CART_EVENT = 'cart:updated';

// ============================================
// CART OPERATIONS
// ============================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function emitCartUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
}

/**
 * Kosár lekérése localStorage-ból
 */
export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Kosár mentése
 */
function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage quota exceeded or unavailable (private browsing)
  }
  emitCartUpdate();
}

/**
 * Tétel hozzáadása a kosárhoz
 */
export function addToCart(item: Omit<CartItem, 'id'>): CartItem {
  const items = getCartItems();
  const newItem: CartItem = { ...item, id: generateId() };
  items.push(newItem);
  saveCart(items);
  return newItem;
}

/**
 * Tétel eltávolítása
 */
export function removeFromCart(id: string): void {
  const items = getCartItems().filter((item) => item.id !== id);
  saveCart(items);
}

/**
 * Tétel m² frissítése
 */
export function updateCartItemSqm(id: string, sqm: number): void {
  const items = getCartItems();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.sqm = sqm;
    item.totalPrice = Math.round(sqm * item.pricePerSqm);
    if (item.withScrews) {
      item.screwCost = calculateScrewCost(sqm).price;
    }
    saveCart(items);
  }
}

/**
 * Kosár kiürítése
 */
export function clearCart(): void {
  saveCart([]);
  setShippingType('gazdasagos');
}

/**
 * Tételek száma
 */
export function getItemCount(): number {
  return getCartItems().length;
}

/**
 * Szállítási mód lekérése/beállítása
 */
export function getShippingType(): 'gazdasagos' | 'expressz' | 'sajat' {
  if (typeof window === 'undefined') return 'gazdasagos';
  try {
    const val = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (val === 'gazdasagos' || val === 'expressz' || val === 'sajat') return val;
  } catch {
    // localStorage unavailable
  }
  return 'gazdasagos';
}

export function setShippingType(type: 'gazdasagos' | 'expressz' | 'sajat'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, type);
  } catch {
    // localStorage quota exceeded or unavailable
  }
  emitCartUpdate();
}

/**
 * Teljes összesítő
 */
export function getCartSummary(): CartSummary {
  const items = getCartItems();
  const shippingType = getShippingType();

  const totalSqm = items.reduce((sum, item) => sum + item.sqm, 0);
  const sheetSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const screwTotal = items.reduce((sum, item) => sum + item.screwCost, 0);
  const subtotal = sheetSubtotal + screwTotal;
  const shippingCost = calculateShippingCost(shippingType, totalSqm);
  const grandTotal = subtotal + shippingCost;

  return {
    items,
    itemCount: items.length,
    totalSqm: Math.round(totalSqm * 100) / 100,
    sheetSubtotal,
    screwTotal,
    subtotal,
    shippingType,
    shippingCost,
    grandTotal,
  };
}

// ============================================
// HELPERS - Gyors rendelés
// ============================================

/**
 * Gyors rendelés: m² + szín → kosárba
 */
export function quickAddToCart(sqm: number, colorId: string, withScrews: boolean = false): CartItem {
  const color = colors.find((c) => c.id === colorId);
  const colorLabel = color
    ? `${color.label}${color.ral ? ' ' + color.ral : ''}`
    : colorId;
  const colorType = color?.type || 'standard';
  const pricePerSqm = basePrices[colorType] || basePrices.standard;
  const totalPrice = Math.round(sqm * pricePerSqm);
  const screwCost = withScrews ? calculateScrewCost(sqm).price : 0;

  return addToCart({
    colorId,
    colorLabel,
    colorType,
    sqm,
    pricePerSqm,
    totalPrice,
    withScrews,
    screwCost,
    source: 'quick',
  });
}

/**
 * Kalkulátor eredmény → kosár tétel
 */
export function addCalculatorResultToCart(data: {
  sqm: number;
  colorId: string;
  sizes?: Array<{ length: number; quantity: number }>;
  withScrews: boolean;
}): CartItem {
  const color = colors.find((c) => c.id === data.colorId);
  const colorLabel = color
    ? `${color.label}${color.ral ? ' ' + color.ral : ''}`
    : data.colorId;
  const colorType = color?.type || 'standard';
  const pricePerSqm = basePrices[colorType] || basePrices.standard;
  const totalPrice = Math.round(data.sqm * pricePerSqm);
  const screwCost = data.withScrews ? calculateScrewCost(data.sqm).price : 0;

  return addToCart({
    colorId: data.colorId,
    colorLabel,
    colorType,
    sqm: data.sqm,
    lengths: data.sizes,
    pricePerSqm,
    totalPrice,
    withScrews: data.withScrews,
    screwCost,
    source: 'calculator',
  });
}

/**
 * Magyar árformázás
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
