'use client'

import {
  getSessionData,
  getStoredValue,
  getTokenWithFallback,
  SessionMode,
} from "@/lib/flow-ai/token-storage";

export interface ExtractSessionConfig {
  accessToken: string | null;
  refreshToken: string | null;
  documentId: string | null;
  pendingId: string | null;
  mode: SessionMode;
}

const HARD_CODED_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_FLOWRMS_ACCESS_TOKEN?.trim() || null;

const HARD_CODED_REFRESH_TOKEN =
  process.env.NEXT_PUBLIC_FLOWRMS_REFRESH_TOKEN?.trim() || null;

const HARD_CODED_DOCUMENT_ID =
  process.env.NEXT_PUBLIC_FLOWRMS_DOCUMENT_ID?.trim() || null;

const HARD_CODED_PENDING_ID =
  process.env.NEXT_PUBLIC_FLOWRMS_PENDING_ID?.trim() || null;

const HARD_CODED_MODE =
  (process.env.NEXT_PUBLIC_FLOWRMS_MODE?.trim() as SessionMode) ?? null;

export function getExtractSessionConfig(): ExtractSessionConfig {
  // Only access localStorage on client side to prevent hydration issues
  if (typeof window === 'undefined') {
    return {
      accessToken: HARD_CODED_ACCESS_TOKEN,
      refreshToken: HARD_CODED_REFRESH_TOKEN,
      documentId: HARD_CODED_DOCUMENT_ID,
      pendingId: HARD_CODED_PENDING_ID,
      mode: HARD_CODED_MODE ?? 'document',
    };
  }

  const session = getSessionData();
  return {
    accessToken: getTokenWithFallback(
      "ACCESS_TOKEN",
      HARD_CODED_ACCESS_TOKEN
    ),
    refreshToken: getTokenWithFallback(
      "REFRESH_TOKEN",
      HARD_CODED_REFRESH_TOKEN
    ),
    documentId:
      getStoredValue("DOCUMENT_ID") ?? HARD_CODED_DOCUMENT_ID ?? session.documentId,
    pendingId:
      getStoredValue("PENDING_ID") ?? HARD_CODED_PENDING_ID ?? session.pendingId,
    mode:
      (getStoredValue("MODE") as SessionMode) ?? session.mode ?? HARD_CODED_MODE ?? 'document',
  };
}





