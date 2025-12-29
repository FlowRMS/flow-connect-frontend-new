import { triggerReportCacheClear } from "./reportCacheControl";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() / 1000 > payload.exp - 30;
  } catch {
    return true;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function hasTokens(): boolean {
  if (typeof window === "undefined") return false;
  return !!(getAccessToken() || getRefreshToken());
}

export function setTokens({ access, refresh }: { access?: string; refresh?: string }): void {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  triggerReportCacheClear();
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(
    "https://py.report.flowrms.com/api/auth/refresh",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Failed to refresh token" }));
    throw new Error(errorData.message || "Failed to refresh access token");
  }

  const data = await response.json();
  setTokens({ access: data.access_token, refresh: data.refresh_token });
  return data.access_token;
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();

  // If we have a valid access token, return it
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  // If we're already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Start refresh process
  isRefreshing = true;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    isRefreshing = false;
    // Return null instead of redirecting, let the calling component handle this
    return null;
  }

  try {
    refreshPromise = refreshAccessToken();
    return await refreshPromise;
  } catch (_) {
    // Clear tokens if refresh fails but don't redirect here
    clearTokens();
    isRefreshing = false;
    refreshPromise = null;
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}
