# Full Code Audit Report - Trapezlemezes.hu

**Audit Date:** 2026-01-21
**Auditor:** Claude Code
**Repository:** trapezlemezes.hu
**Tech Stack:** Astro 5.x, TypeScript, Cloudflare Pages/Workers

---

## Executive Summary

This is a well-architected e-commerce platform for selling corrugated metal roofing sheets. The codebase demonstrates good security practices overall, with proper input validation, CSRF protection, and consent-aware tracking. However, several issues were identified that should be addressed.

### Risk Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 0 | No critical vulnerabilities found |
| **High** | 2 | Security issues requiring attention |
| **Medium** | 4 | Code quality and potential bugs |
| **Low** | 6 | Minor improvements and best practices |

---

## Security Findings

### HIGH-1: Quote Hash Checksum Bypass

**Location:** `src/lib/quote-hash.ts:205-210`

**Issue:** The `decodeQuoteHash()` function continues to decode data even when the HMAC checksum verification fails, only logging a warning comment.

```typescript
// Current code (problematic)
if (checksum !== expectedSimple) {
  // Invalid checksum - could be HMAC but we can't verify sync
  // For security, we still decode but log a warning
  // In production, HMAC verification would be async
}

// Decode continues anyway
const json = base64urlDecode(encoded);
```

**Risk:** An attacker could tamper with quote data (prices, customer info) by modifying the base64 payload without a valid checksum.

**Recommendation:** Either reject invalid checksums outright or implement async HMAC verification:

```typescript
export async function decodeQuoteHashAsync(hash: string): Promise<Partial<CalculatorFormData> | null> {
  // Verify HMAC before decoding
  const expectedHmac = (await hmacHash(encoded, secret)).slice(0, 8);
  if (checksum !== expectedHmac && checksum !== expectedSimple) {
    return null; // Reject tampered data
  }
  // ...
}
```

---

### HIGH-2: CSRF Protection Fallback Weakness

**Location:** `src/lib/csrf.ts:177-209`

**Issue:** The CSRF validation falls back to checking only Origin/Referer headers, which can be spoofed in some scenarios or may be missing.

```typescript
// If Origin is present and matches host, allow the request
if (origin) {
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) {
      return null; // Allows request
    }
  }
}
```

**Risk:** While this is a reasonable defense-in-depth measure, relying solely on Origin/Referer without the CSRF token provides weaker protection.

**Recommendation:**
1. Always require CSRF tokens for sensitive operations
2. Log when fallback path is used for monitoring
3. Consider implementing double-submit cookie pattern as additional layer

---

### MEDIUM-1: Sensitive Data in Logs

**Location:** Multiple files

**Issue:** Several log statements output potentially sensitive customer data:

- `src/pages/api/callback.ts:178-187` - Logs full name and phone
- `src/pages/api/quote.ts:288-294` - Logs quote details
- `src/lib/sheets.ts:17-18` - Logs credential presence info

**Recommendation:** Implement log redaction for PII:
```typescript
const redactedPhone = phone.slice(0, 4) + '****' + phone.slice(-2);
console.log('Callback request:', { name: '***', phone: redactedPhone });
```

---

### MEDIUM-2: Missing Rate Limiting

**Location:** All API endpoints

**Issue:** No rate limiting is implemented on form submission endpoints, making them vulnerable to:
- Spam submissions
- DoS attacks
- Email bombing (through notification emails)

**Recommendation:** Implement rate limiting using Cloudflare's built-in features or a middleware:
```typescript
// Example using a simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;
  record.count++;
  return true;
}
```

---

### MEDIUM-3: Missing Content-Security-Policy Headers

**Location:** Response headers throughout

**Issue:** API responses don't include security headers like `X-Content-Type-Options`, `X-Frame-Options`, or `Content-Security-Policy`.

**Recommendation:** Add security headers to all responses:
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

return new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json', ...securityHeaders },
});
```

---

### MEDIUM-4: Email Template XSS Potential

**Location:** `src/emails/quote-confirmation.ts`, `src/emails/admin-notification.ts`, `src/emails/callback-request.ts`

**Issue:** User input is directly interpolated into HTML email templates without escaping:

```typescript
// src/emails/admin-notification.ts:59
<td>${data.last_name} ${data.first_name}</td>

// src/emails/callback-request.ts:63
<td>${lastName} ${firstName}</td>
```

**Risk:** While email HTML XSS is less severe than web XSS, malicious names could inject unwanted HTML into admin emails.

**Recommendation:** HTML-escape all user input:
```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Usage
<td>${escapeHtml(data.last_name)} ${escapeHtml(data.first_name)}</td>
```

---

## Code Quality Findings

### LOW-1: Inconsistent Error Handling

**Location:** Multiple API endpoints

**Issue:** Some error handlers expose different levels of detail:
- `src/pages/api/quote.ts:330` - Generic Hungarian error message
- `src/pages/api/callback.ts:206` - Different generic message
- `src/pages/api/send-user-notification.ts:108` - English error message

**Recommendation:** Standardize error responses and create a shared error handler.

---

### LOW-2: Unused Function Parameters

**Location:** `src/emails/quote-confirmation.ts:16-19`

**Issue:** The `QuoteConfirmationTemplate` function receives several parameters that are never used:
- `lastName`
- `company`
- `quoteId`
- `breakdown`

```typescript
export default function QuoteConfirmationTemplate({
  firstName,
  quoteUrl,
  // These are destructured but unused:
  lastName,
  company,
  quoteId,
  breakdown,
}: QuoteConfirmationProps): string {
```

**Recommendation:** Either use these parameters in the template or remove them from the interface.

---

### LOW-3: Hardcoded Values

**Location:** Various files

**Issue:** Several values are hardcoded that should be configurable:
- `src/lib/meta-capi.ts:22` - Meta Pixel ID fallback
- `src/lib/email.ts:165` - Admin notification threshold (340000)
- `src/lib/sheets.ts:260` - High-value threshold (340000)
- `src/pages/api/send-admin-notification.ts:62` - Same threshold

**Recommendation:** Centralize these in `src/config/site.ts`:
```typescript
export const SITE_CONFIG = {
  // ... existing config
  thresholds: {
    highValueQuote: 340000,
    freeShipping: 250,
  },
  tracking: {
    metaPixelId: '1190487559035660',
  },
};
```

---

### LOW-4: Missing Type Safety in Form Data Parsing

**Location:** `src/pages/api/quote.ts:40-54`

**Issue:** Form data is parsed into a generic `Record<string, unknown>` before validation, which loses type safety:

```typescript
const data: Record<string, unknown> = {};

formData.forEach((value, key) => {
  if (key.endsWith('[]')) {
    // ...
  }
});
```

**Recommendation:** Consider using Zod's `.safeParseAsync()` directly on the FormData or create a typed form parser utility.

---

### LOW-5: Debug Logs in Production Code

**Location:** `src/lib/email.ts:70-76`, `src/lib/sheets.ts:17-18`

**Issue:** Some debug logs may leak information in production:

```typescript
console.log('sendViaResend called, to:', options.to);
console.log('Resend API key found, length:', apiKey.length);
```

**Recommendation:** Use the existing logger utility consistently:
```typescript
import { logger } from './logger';
logger.debug('sendViaResend called, to:', options.to);
```

---

### LOW-6: Missing Input Length Validation

**Location:** `src/lib/validation.ts`

**Issue:** While the Zod schema has length limits, the following fields lack maximum length constraints:
- `color` field - no max length
- `utm_*` fields - not validated at all

**Recommendation:** Add explicit length limits to prevent potential issues:
```typescript
color: z.string().max(50).optional(),
// Add UTM validation
utm_source: z.string().max(200).optional(),
utm_medium: z.string().max(200).optional(),
// etc.
```

---

## Positive Security Practices

The codebase demonstrates several good security practices:

1. **Proper Input Validation** - Zod schemas with comprehensive validation rules
2. **CSRF Protection** - Token-based protection with HMAC signatures
3. **Consent-Aware Tracking** - Marketing consent checked before Meta CAPI calls
4. **Secure Token Generation** - Uses Web Crypto API for HMAC-SHA256
5. **Environment Variable Handling** - Proper separation of secrets
6. **Error Handling** - Try-catch blocks in API handlers
7. **PII Hashing** - SHA-256 hashing for Meta CAPI user data
8. **Background Task Handling** - Proper use of Cloudflare's `waitUntil()`
9. **Email Typo Correction** - Proactive data quality improvement
10. **Phone Number Normalization** - Consistent format handling

---

## Performance Observations

1. **Efficient Image Handling** - Using Sharp for server-side optimization
2. **Parallel Operations** - `Promise.all()` for concurrent email/sheets operations
3. **Background Processing** - Non-blocking response with `waitUntil()`
4. **Safe localStorage** - Safari-compatible storage wrapper with fallbacks

---

## Recommendations Summary

### Immediate Actions (High Priority)
1. Fix quote hash checksum bypass vulnerability
2. Strengthen CSRF token validation
3. Add rate limiting to API endpoints

### Short-term Improvements (Medium Priority)
4. Add security headers to responses
5. Implement HTML escaping in email templates
6. Implement log redaction for PII
7. Centralize threshold configuration

### Code Quality (Low Priority)
8. Remove unused function parameters
9. Standardize error messages
10. Add length validation for optional fields
11. Use logger utility consistently
12. Add stricter TypeScript types for form parsing

---

## Files Reviewed

- `src/pages/api/quote.ts`
- `src/pages/api/callback.ts`
- `src/pages/api/send-user-notification.ts`
- `src/pages/api/send-admin-notification.ts`
- `src/lib/validation.ts`
- `src/lib/csrf.ts`
- `src/lib/quote-hash.ts`
- `src/lib/email.ts`
- `src/lib/sheets.ts`
- `src/lib/meta-capi.ts`
- `src/lib/env.ts`
- `src/lib/logger.ts`
- `src/calculator/calculation.ts`
- `src/calculator/config.ts`
- `src/config/site.ts`
- `src/emails/quote-confirmation.ts`
- `src/emails/admin-notification.ts`
- `src/emails/callback-request.ts`
- `src/components/conversion-tracking/src/client/index.ts`
- `src/components/conversion-tracking/src/client/storage.ts`
- `src/components/conversion-tracking/src/client/validation.ts`

---

## Conclusion

The Trapezlemezes.hu codebase is generally well-structured with good security practices. The identified issues are addressable and none represent immediate critical vulnerabilities. The main areas for improvement are strengthening cryptographic verification, adding defense-in-depth measures like rate limiting, and improving code consistency.

---

*This audit was performed as a point-in-time assessment. Regular security reviews are recommended as the codebase evolves.*
