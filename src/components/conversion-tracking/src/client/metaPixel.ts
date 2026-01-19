/**
 * @leadgen/conversion-tracking - Meta Pixel Helpers (Consent-Aware)
 *
 * Client-side helpers for Meta Pixel events that respect CookieYes consent.
 * The Meta Pixel script is loaded via GTM with consent mode.
 * These helpers fire events only when:
 * 1. Marketing consent is granted (CookieYes)
 * 2. fbq function is available (GTM loaded the pixel)
 */

import { hasMarketingConsent } from './consent';
import { log } from './constants';

// =============================================================================
// Types
// =============================================================================

export interface MetaPixelLeadParams {
  /** Event ID from server response - REQUIRED for deduplication with CAPI */
  eventId: string;
  /** Conversion value */
  value?: number;
  /** Currency (default: HUF) */
  currency?: string;
  /** Content name for categorization */
  contentName?: string;
  /** Content category */
  contentCategory?: string;
}

export interface MetaPixelContactParams {
  /** Event ID for deduplication */
  eventId?: string;
  /** Content name */
  contentName?: string;
}

export interface MetaPixelResult {
  /** Whether the event was fired */
  success: boolean;
  /** Reason if not fired */
  reason?: 'no_consent' | 'no_fbq' | 'error';
  /** The event ID used */
  eventId?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if Meta Pixel (fbq) is available
 * The pixel is loaded via GTM when consent is granted
 */
export function isMetaPixelAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Generate a client-side event ID for deduplication
 * Use this only if you don't have a server-provided eventId
 */
export function generateMetaEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// =============================================================================
// Event Tracking Functions
// =============================================================================

/**
 * Track a Lead event with Meta Pixel (consent-aware)
 *
 * Call this AFTER receiving the eventId from server-side CAPI response.
 * This ensures the same eventId is used for deduplication.
 *
 * @example
 * const response = await fetch('/api/callback', { ... });
 * const { eventId } = await response.json();
 *
 * trackMetaLeadPixel({
 *   eventId,
 *   value: 50000,
 *   currency: 'HUF',
 *   contentName: 'Callback Request'
 * });
 */
export function trackMetaLeadPixel(params: MetaPixelLeadParams): MetaPixelResult {
  // Check consent first
  if (!hasMarketingConsent()) {
    log('Meta Pixel Lead: No marketing consent - skipping');
    return { success: false, reason: 'no_consent' };
  }

  // Check if fbq is available (loaded via GTM)
  if (!isMetaPixelAvailable()) {
    log('Meta Pixel Lead: fbq not available - skipping');
    return { success: false, reason: 'no_fbq' };
  }

  try {
    window.fbq!('track', 'Lead', {
      value: params.value || 0,
      currency: params.currency || 'HUF',
      content_name: params.contentName || 'Lead',
      content_category: params.contentCategory || 'conversion',
    }, { eventID: params.eventId });

    log('Meta Pixel Lead tracked:', params.eventId);
    return { success: true, eventId: params.eventId };
  } catch (error) {
    console.error('[Meta Pixel] Lead tracking error:', error);
    return { success: false, reason: 'error' };
  }
}

/**
 * Track a Contact event with Meta Pixel (consent-aware)
 *
 * Use for phone clicks and other contact interactions.
 *
 * @example
 * trackMetaContactPixel({
 *   eventId: generateMetaEventId(),
 *   contentName: 'Phone Click'
 * });
 */
export function trackMetaContactPixel(params: MetaPixelContactParams = {}): MetaPixelResult {
  // Check consent first
  if (!hasMarketingConsent()) {
    log('Meta Pixel Contact: No marketing consent - skipping');
    return { success: false, reason: 'no_consent' };
  }

  // Check if fbq is available
  if (!isMetaPixelAvailable()) {
    log('Meta Pixel Contact: fbq not available - skipping');
    return { success: false, reason: 'no_fbq' };
  }

  const eventId = params.eventId || generateMetaEventId();

  try {
    window.fbq!('track', 'Contact', {
      content_name: params.contentName || 'Contact',
      content_category: 'engagement',
    }, { eventID: eventId });

    log('Meta Pixel Contact tracked:', eventId);
    return { success: true, eventId };
  } catch (error) {
    console.error('[Meta Pixel] Contact tracking error:', error);
    return { success: false, reason: 'error' };
  }
}

/**
 * Track a custom event with Meta Pixel (consent-aware)
 */
export function trackMetaPixelEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string
): MetaPixelResult {
  if (!hasMarketingConsent()) {
    return { success: false, reason: 'no_consent' };
  }

  if (!isMetaPixelAvailable()) {
    return { success: false, reason: 'no_fbq' };
  }

  const id = eventId || generateMetaEventId();

  try {
    window.fbq!('track', eventName, params, { eventID: id });
    log(`Meta Pixel ${eventName} tracked:`, id);
    return { success: true, eventId: id };
  } catch (error) {
    console.error(`[Meta Pixel] ${eventName} tracking error:`, error);
    return { success: false, reason: 'error' };
  }
}

// =============================================================================
// Form Helper - Adds consent field to forms
// =============================================================================

/**
 * Add a hidden marketing_consent field to a form
 *
 * Call this before form submission to pass consent state to server.
 * Server should only send CAPI if marketing_consent === 'granted'.
 *
 * @example
 * const form = document.getElementById('my-form');
 * addConsentFieldToForm(form);
 * form.submit();
 */
export function addConsentFieldToForm(form: HTMLFormElement): void {
  // Remove existing field if present
  const existing = form.querySelector('input[name="marketing_consent"]');
  if (existing) {
    existing.remove();
  }

  const consentField = document.createElement('input');
  consentField.type = 'hidden';
  consentField.name = 'marketing_consent';
  consentField.value = hasMarketingConsent() ? 'granted' : 'denied';
  form.appendChild(consentField);
}

/**
 * Get marketing consent value for FormData
 *
 * @example
 * const formData = new FormData();
 * formData.append('marketing_consent', getMarketingConsentValue());
 */
export function getMarketingConsentValue(): 'granted' | 'denied' {
  return hasMarketingConsent() ? 'granted' : 'denied';
}

// =============================================================================
// Window augmentation for fbq
// =============================================================================

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}
