/**
 * FlowCRM Redirect Utilities
 * Handles redirect to FlowRMS login page
 * Mirrors the flow-analytics redirect implementation exactly
 */

export const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || 'https://app2.flowrms.com';

export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = LOGIN_URL;
  }
}
