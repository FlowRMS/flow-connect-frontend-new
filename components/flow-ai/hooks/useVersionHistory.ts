"use client";

import { useApolloClient } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  M_ROLLBACK_TO_VERSION,
  Q_GET_SPECIFIC_VERSION,
  Q_GET_VERSION_HISTORY,
} from "@/lib/flow-ai/gql";
import {
  Extracted,
  getIdentifierLabel,
  getIdentifierValue,
  safeParseExtractedArray,
} from "@/lib/flow-ai/parseExtracted";
import { fetchCsvDataViaProxy } from "@/lib/flow-ai/csv-fetch";

type Maybe<T> = T | null | undefined;

export interface VersionHistoryEntry {
  id: string;
  pendingDocumentId?: string | null;
  versionNumber: number;
  changeType?: string | null;
  changeDescription?: string | null;
  userInstruction?: string | null;
  executedCode?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export interface VersionSnapshot {
  id: string;
  pendingDocumentId?: string | null;
  versionNumber: number;
  changeType?: string | null;
  changeDescription?: string | null;
  userInstruction?: string | null;
  executedCode?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  createdBy?: string | null;
  extractedDataSets: Extracted[];
  dataSets: Array<{ index: number; label: string; value: string }>;
  entityType?: string | null;
  convertedDocumentUrl?: string | null;
  originalPresignedUrl?: string | null;
  pages?: Array<{ markdownContent?: string }> | null;
  originalCsvData?: unknown[][] | null;
  processedCsvData?: unknown[][] | null;
  isCsv: boolean;
}

type SpecificVersionResponse = {
  id: string;
  pendingDocumentId?: string | null;
  versionNumber: number;
  changeType?: string | null;
  changeDescription?: string | null;
  userInstruction?: string | null;
  executedCode?: string | null;
  metadata?: Maybe<unknown>;
  createdAt: string;
  createdBy?: string | null;
  data?: Maybe<unknown>;
};

export function formatChangeTypeLabel(value?: string | null): string | null {
  if (!value) return null;
  const tokens = value
    .split(/[_\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  return tokens
    .map((token) => {
      const upper = token.toUpperCase();
      // Preserve common acronyms (AI, CSV, API, etc.)
      if (token === upper && upper.length <= 4) {
        return upper;
      }
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(' ');
}

function parseMaybeJson<T = Record<string, unknown>>(value: Maybe<unknown>): T | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return null;
}

function toOptionalString(value: Maybe<unknown>): string | null {
  if (typeof value === "string") return value;
  return null;
}

function coerceMatrix(value: Maybe<unknown>): unknown[][] | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value as unknown[][];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as unknown[][]) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function detectCsv(...urls: Array<Maybe<string>>): boolean {
  return urls.some((url) => {
    if (!url) return false;
    const normalized = url.toLowerCase();
    return normalized.includes(".csv") || normalized.includes("tabular");
  });
}

function coercePages(value: Maybe<unknown>): Array<{ markdownContent?: string }> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value as Array<{ markdownContent?: string }>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Array<{ markdownContent?: string }>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function serializeExtractedSource(value: Maybe<unknown>): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function useVersionHistory(pendingId?: string | null, currentEntityType?: string | null) {
  const client = useApolloClient();
  const [history, setHistory] = useState<VersionHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [snapshots, setSnapshots] = useState<Record<number, VersionSnapshot>>({});
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [isRollbacking, setIsRollbacking] = useState(false);

  const currentVersionNumber = useMemo(() => {
    return history.reduce((max, entry) => Math.max(max, entry.versionNumber), 0);
  }, [history]);

  const fetchHistory = useCallback(async () => {
    if (!pendingId) {
      setHistory([]);
      return;
    }

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const { data } = await client.query({
        query: Q_GET_VERSION_HISTORY,
        variables: { pendingId },
        fetchPolicy: "no-cache",
      });

      const response = data as { getVersionHistory?: VersionHistoryEntry[] };
      const entries = [...(response.getVersionHistory ?? [])];
      entries.sort((a, b) => b.versionNumber - a.versionNumber);
      setHistory(entries);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Failed to load version history");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [client, pendingId]);

  useEffect(() => {
    setSnapshots({});
    if (pendingId) {
      void fetchHistory();
    } else {
      setHistory([]);
    }
  }, [pendingId, fetchHistory]);

  const normalizeSnapshot = useCallback(async (payload: SpecificVersionResponse): Promise<VersionSnapshot> => {
    const metadata = parseMaybeJson<Record<string, unknown>>(payload.metadata);
    const rawData = parseMaybeJson<Record<string, unknown>>(payload.data);
    const entityType = (
      rawData?.entityType ??
      rawData?.entity_type ??
      metadata?.entityType ??
      metadata?.entity_type ??
      currentEntityType ??
      null
    ) as string | null;

    const extractedEnvelope = parseMaybeJson<Record<string, unknown>>(
      rawData?.extractedDataJson ??
        rawData?.extracted_data_json ??
        metadata?.extractedDataJson ??
        metadata?.extracted_data_json
    );

    // Parse rawData.data if it's a string containing JSON
    const parsedRawDataData = parseMaybeJson<Record<string, unknown>>(rawData?.data);

    const extractedSource =
      parsedRawDataData?.data ?? // Check parsed data.data first
      rawData?.data ??
      metadata?.data ??
      extractedEnvelope?.data ??
      rawData?.extractedDataJson ??
      rawData?.extracted_data_json ??
      metadata?.extractedDataJson ??
      metadata?.extracted_data_json ??
      null;

    const extractedDataSets = safeParseExtractedArray(serializeExtractedSource(extractedSource));
    const dataSets = extractedDataSets.map((extracted, index) => ({
      index,
      label: getIdentifierLabel(entityType),
      value: getIdentifierValue(extracted, entityType),
    }));

    const convertedDocumentUrl =
      toOptionalString(rawData?.convertedDocumentUrl) ??
      toOptionalString(rawData?.converted_document_url) ??
      toOptionalString(metadata?.convertedDocumentUrl) ??
      toOptionalString(metadata?.converted_document_url) ??
      toOptionalString(extractedEnvelope?.convertedDocumentUrl) ??
      toOptionalString(extractedEnvelope?.converted_document_url);

    const originalPresignedUrl =
      toOptionalString(rawData?.originalPresignedUrl) ??
      toOptionalString(rawData?.original_presigned_url) ??
      toOptionalString(metadata?.originalPresignedUrl) ??
      toOptionalString(metadata?.original_presigned_url) ??
      toOptionalString(extractedEnvelope?.originalPresignedUrl) ??
      toOptionalString(extractedEnvelope?.original_presigned_url);

    const manuallyMarkedCsv =
      Boolean((rawData as { isCsv?: boolean; is_csv?: boolean })?.isCsv) ||
      Boolean((rawData as { is_csv?: boolean })?.is_csv) ||
      Boolean((metadata as { isCsv?: boolean; is_csv?: boolean })?.isCsv) ||
      Boolean((metadata as { is_csv?: boolean })?.is_csv);

    const csvHints = [
      convertedDocumentUrl,
      originalPresignedUrl,
      toOptionalString((extractedEnvelope as { s3_key?: string })?.s3_key),
      toOptionalString((extractedEnvelope as { original_s3_key?: string })?.original_s3_key),
    ];
    const isCsv = manuallyMarkedCsv || detectCsv(...csvHints);

    let originalCsvData =
      coerceMatrix(rawData?.originalCsvData) ??
      coerceMatrix(rawData?.original_csv_data) ??
      coerceMatrix(metadata?.originalCsvData) ??
      coerceMatrix(metadata?.original_csv_data) ??
      null;
    let processedCsvData =
      coerceMatrix(rawData?.processedCsvData) ??
      coerceMatrix(rawData?.processed_csv_data) ??
      coerceMatrix(metadata?.processedCsvData) ??
      coerceMatrix(metadata?.processed_csv_data) ??
      null;

    if (isCsv) {
      if (!originalCsvData && originalPresignedUrl) {
        originalCsvData = await fetchCsvDataViaProxy(originalPresignedUrl);
      }
      if (!processedCsvData && convertedDocumentUrl) {
        processedCsvData = await fetchCsvDataViaProxy(convertedDocumentUrl);
      }
    }

    const pages =
      coercePages(rawData?.pages) ??
      coercePages(metadata?.pages) ??
      coercePages(rawData?.pagesJson) ??
      coercePages(metadata?.pagesJson) ??
      null;

    return {
      id: payload.id,
      pendingDocumentId: payload.pendingDocumentId,
      versionNumber: payload.versionNumber,
      changeType: payload.changeType,
      changeDescription: payload.changeDescription,
      userInstruction: payload.userInstruction,
      executedCode: payload.executedCode,
      metadata,
      createdAt: payload.createdAt,
      createdBy: payload.createdBy,
      extractedDataSets,
      dataSets,
      entityType,
      convertedDocumentUrl,
      originalPresignedUrl,
      pages,
      originalCsvData,
      processedCsvData,
      isCsv,
    };
  }, [currentEntityType]);

  const loadSnapshot = useCallback(
    async (versionNumber: number) => {
      if (!pendingId) {
        setSnapshotError("Missing pending document id");
        return null;
      }

      if (snapshots[versionNumber]) {
        return snapshots[versionNumber];
      }

      setLoadingSnapshot(true);
      setSnapshotError(null);

      try {
        const { data } = await client.query({
          query: Q_GET_SPECIFIC_VERSION,
          variables: { pendingId, versionNumber },
          fetchPolicy: "no-cache",
        });

        const response = data as { getSpecificVersion?: SpecificVersionResponse };
        const payload = response.getSpecificVersion;
        if (!payload) {
          throw new Error("Version not found");
        }

        const snapshot = await normalizeSnapshot(payload);
        setSnapshots((prev) => ({ ...prev, [versionNumber]: snapshot }));
        return snapshot;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load version";
        setSnapshotError(message);
        throw error;
      } finally {
        setLoadingSnapshot(false);
      }
    },
    [client, pendingId, snapshots, normalizeSnapshot]
  );

  const rollbackToVersion = useCallback(
    async (versionNumber: number, changeDescription?: string) => {
      if (!pendingId) {
        throw new Error("Missing pending document id");
      }

      setIsRollbacking(true);
      try {
        const { data } = await client.mutate({
          mutation: M_ROLLBACK_TO_VERSION,
          variables: {
            pendingId,
            versionNumber,
            changeDescription: changeDescription?.trim() ?? "",
          },
        });

        setSnapshots({});
        await fetchHistory();
        const response = data as { rollbackToVersion?: unknown };
        return response.rollbackToVersion ?? null;
      } finally {
        setIsRollbacking(false);
      }
    },
    [client, pendingId, fetchHistory]
  );

  return {
    history,
    historyError,
    loadingHistory,
    refreshHistory: fetchHistory,
    snapshots,
    loadSnapshot,
    loadingSnapshot,
    snapshotError,
    rollbackToVersion,
    isRollbacking,
    currentVersionNumber,
  };
}





