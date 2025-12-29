/**
 * Redirect utilities for Analytics
 * 
 * NOTE: These are intentionally no-ops. Authentication is handled by the
 * CRM's middleware using WorkOS. The analytics module should not redirect
 * on its own - it should let errors propagate and the middleware handle auth.
 */

/**
 * Redirect to login page - DEPRECATED, now a no-op
 * CRM middleware handles authentication
 */
export function redirectToLogin(): void {
  // No-op: Auth is handled by CRM middleware
  console.warn("[Analytics] redirectToLogin called but auth is handled by CRM middleware");
}

/**
 * Redirect to home/dashboard - DEPRECATED, now a no-op
 */
export function redirectToHome(): void {
  // No-op
  console.warn("[Analytics] redirectToHome called but navigation should use router");
}
