/**
 * Token Manager for Analytics - WorkOS Integration
 * 
 * This module handles token management for the analytics module using WorkOS
 * authentication from the CRM. It replaces the Keycloak-based token management.
 */

let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let initialTokenFetched = false;

/**
 * Get access token from WorkOS via API route
 */
async function fetchToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/auth/token");
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.accessToken || null;
  } catch (error) {
    console.error("[TokenManager] Failed to fetch token:", error);
    return null;
  }
}

/**
 * Check if a token is expired (JWT)
 */
function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Consider expired 30 seconds before actual expiry
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return true;
  }
}

/**
 * Get access token from cache or fetch new one
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  
  // Check if cached token is still valid
  if (cachedToken && Date.now() < tokenExpiry - 30000) {
    return cachedToken;
  }
  
  return null;
}

/**
 * Get refresh token - not used with WorkOS, kept for API compatibility
 */
export function getRefreshToken(): string | null {
  // WorkOS handles token refresh automatically
  return null;
}

/**
 * Check if we have any tokens
 * For WorkOS integration, this always returns true since auth is handled by CRM middleware.
 * The actual token is fetched asynchronously by Apollo client.
 */
export function hasTokens(): boolean {
  if (typeof window === "undefined") return false;
  // Always return true - CRM middleware handles auth, and Apollo client fetches tokens
  // The old Keycloak flow checked localStorage which was synchronous
  // With WorkOS, tokens are fetched async, so we trust the auth middleware
  return true;
}

/**
 * Set tokens - updates cache
 */
export function setTokens({ access }: { access?: string; refresh?: string }): void {
  if (typeof window === "undefined") return;
  if (access) {
    cachedToken = access;
    tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  }
}

/**
 * Clear cached tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Refresh access token via API
 */
export async function refreshAccessToken(): Promise<string> {
  const token = await fetchToken();
  if (!token) {
    throw new Error("Failed to refresh token");
  }
  setTokens({ access: token });
  return token;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();

  // If we have a valid cached token, return it
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  // If we're already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Start refresh process
  isRefreshing = true;

  try {
    refreshPromise = fetchToken().then((token) => {
      if (token) {
        setTokens({ access: token });
      }
      return token;
    });
    const token = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;
    return token;
  } catch (error) {
    console.error("[TokenManager] Token refresh failed:", error);
    clearTokens();
    isRefreshing = false;
    refreshPromise = null;
    return null;
  }
}
