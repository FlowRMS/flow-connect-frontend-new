/**
 * ⚠️ DEPRECATED - Legacy token storage utilities
 * 
 * This file is DEPRECATED and should NOT be used for new code.
 * 
 * Flowscan now uses OAuth 2.0 Authorization Code + PKCE flow.
 * Tokens are stored in HttpOnly cookies, not localStorage.
 * 
 * See:
 * - /lib/auth-cookies.ts for cookie management
 * - /lib/pkce.ts for PKCE utilities
 * 
 * This file is kept only for backward compatibility during migration.
 * It may be removed in a future version.
 */

/**
 * @deprecated Use HttpOnly cookies via /lib/auth-cookies.ts instead
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "flowrms_access_token",
  REFRESH_TOKEN: "flowrms_refresh_token",
  DOCUMENT_ID: "flowrms_document_id",
  PENDING_ID: "flowrms_pending_id",
  MODE: "flowrms_mode",
} as const;

export type SessionMode = "document" | "pending" | null;

export interface SessionData {
  accessToken: string | null;
  refreshToken: string | null;
  documentId: string | null;
  pendingId: string | null;
  mode: SessionMode;
}

type StorageKey = keyof typeof STORAGE_KEYS;

export function getStoredValue(key: StorageKey): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEYS[key]);
  return value && value.trim() ? value.trim() : null;
}

export function setStoredValue(key: StorageKey, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS[key], value.trim());
}

export function removeStoredValue(key: StorageKey): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS[key]);
}

export function getSessionData(): SessionData {
  return {
    accessToken: getStoredValue("ACCESS_TOKEN"),
    refreshToken: getStoredValue("REFRESH_TOKEN"),
    documentId: getStoredValue("DOCUMENT_ID"),
    pendingId: getStoredValue("PENDING_ID"),
    mode: (getStoredValue("MODE") as SessionMode) ?? null,
  };
}

export function setSessionData(data: Partial<SessionData>): void {
  if (data.accessToken !== undefined) {
    if (data.accessToken) {
      setStoredValue("ACCESS_TOKEN", data.accessToken);
    } else {
      removeStoredValue("ACCESS_TOKEN");
    }
  }
  if (data.refreshToken !== undefined) {
    if (data.refreshToken) {
      setStoredValue("REFRESH_TOKEN", data.refreshToken);
    } else {
      removeStoredValue("REFRESH_TOKEN");
    }
  }
  if (data.documentId !== undefined) {
    if (data.documentId) {
      setStoredValue("DOCUMENT_ID", data.documentId);
    } else {
      removeStoredValue("DOCUMENT_ID");
    }
  }
  if (data.pendingId !== undefined) {
    if (data.pendingId) {
      setStoredValue("PENDING_ID", data.pendingId);
    } else {
      removeStoredValue("PENDING_ID");
    }
  }
  if (data.mode !== undefined) {
    if (data.mode) {
      setStoredValue("MODE", data.mode);
    } else {
      removeStoredValue("MODE");
    }
  }
}

export function clearSessionData(): void {
  removeStoredValue("ACCESS_TOKEN");
  removeStoredValue("REFRESH_TOKEN");
  removeStoredValue("DOCUMENT_ID");
  removeStoredValue("PENDING_ID");
  removeStoredValue("MODE");
}

export function getTokenWithFallback(
  storageKey: StorageKey,
  envValue: string | null
): string | null {
  const stored = getStoredValue(storageKey);
  return stored || envValue;
}

export function hasStoredSession(): boolean {
  const session = getSessionData();
  return Boolean(
    session.accessToken ||
      session.refreshToken ||
      session.documentId ||
      session.pendingId
  );
}





