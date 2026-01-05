/**
 * Environment Variable Access for Cloudflare Pages
 *
 * In Cloudflare Pages, secrets are available via locals.runtime.env,
 * NOT via import.meta.env. This module provides a way to access them.
 */

// Store for runtime env (set by API routes)
let runtimeEnv: Record<string, string> | null = null;

/**
 * Set the runtime environment (call this at the start of API routes)
 */
export function setRuntimeEnv(env: Record<string, string> | null): void {
  runtimeEnv = env;
}

/**
 * Get an environment variable
 * Checks in order: runtime env (Cloudflare), import.meta.env (Astro), process.env (Node)
 */
export function getEnv(key: string): string | undefined {
  // 1. Try runtime env first (Cloudflare Pages secrets)
  if (runtimeEnv && runtimeEnv[key]) {
    return runtimeEnv[key];
  }

  // 2. Try import.meta.env (Astro public vars)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as Record<string, string>)[key];
    if (value) return value;
  }

  // 3. Fall back to process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }

  return undefined;
}
