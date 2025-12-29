/**
 * Redirect utilities for Analytics - DEPRECATED
 * Auth is now handled by CRM middleware using WorkOS
 */

export function redirectToLogin() {
  // No-op: Auth is handled by CRM middleware
  console.warn("[Analytics] redirectToLogin called but auth is handled by CRM middleware");
}