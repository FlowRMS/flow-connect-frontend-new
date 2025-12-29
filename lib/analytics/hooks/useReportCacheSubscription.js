"use client";

import React from "react";
import { gql } from "@apollo/client";
import {
  useReportCacheEntry,
  useReportCacheActions,
} from "@/contexts/analytics/ReportCacheContext";
import { parseReportCsv } from "@/lib/analytics/utils/reportData";
import { hasTokens, clearTokens } from "@/lib/analytics/tokenManager";
import { client as apolloClientInstance } from "@/lib/analytics/apolloClient";
import {
  clearAdvancedFilterCache,
  clearAllAdvancedFilterCache,
} from "@/lib/analytics/utils/advancedFilterCache";
import { isAuthorizationError } from "@/lib/analytics/utils/authErrors";

const GET_REPORT_PRESIGNED_URL = gql`
  query GetReportPresignedUrl(
    $reportType: ReportType!
    $limit: Int
    $startDate: Date
    $endDate: Date
    $cache: Boolean
    $filterByDate: FilterByDate
  ) {
    getReportPresignedUrl(
      reportType: $reportType
      limit: $limit
      startDate: $startDate
      endDate: $endDate
      cache: $cache
      filterByDate: $filterByDate
    )
  }
`;

function buildVariables(reportType, limit, startDate, endDate, cache, filterByDate) {
  const vars = { reportType };
  if (limit != null) {
    vars.limit = limit;
  }
  if (startDate) {
    vars.startDate = startDate;
  }
  if (endDate) {
    vars.endDate = endDate;
  }
  if (cache != null) {
    vars.cache = cache;
  }
  if (filterByDate) {
    vars.filterByDate = filterByDate;
  }
  return vars;
}

function computeSeenIds(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const ids = [];
  const seen = new Set();

  for (const item of rows) {
    const id = item?.id;
    if (id == null) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

function isUnauthorizedError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const networkError = error.networkError ?? error;
  const status =
    networkError?.statusCode ??
    networkError?.status ??
    networkError?.response?.status ??
    networkError?.result?.status;

  if (status === 401 || status === 403) {
    return true;
  }

  if (Array.isArray(error.graphQLErrors)) {
    return error.graphQLErrors.some(
      (graphError) =>
        graphError?.extensions?.code === "UNAUTHENTICATED" ||
        graphError?.extensions?.http?.status === 401 ||
        graphError?.extensions?.http?.status === 403
    );
  }

  if (typeof error.message === "string") {
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized") || message.includes("forbidden")) {
      return true;
    }
  }

  return false;
}

export function useReportCacheSubscription({
  reportType,
  limit,
  startDate,
  endDate,
  filterByDate,
  logPrefix,
}) {
  const apolloClient = React.useMemo(() => apolloClientInstance, []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [fetchTrigger, setFetchTrigger] = React.useState(0);
  const { clearAllEntries } = useReportCacheActions();

  React.useEffect(() => {
    if (!hasTokens()) {
      clearAllEntries();
      clearAllAdvancedFilterCache();
      // Auth is handled by CRM middleware - no redirect needed
      console.warn('[useReportCacheSubscription] No tokens found - CRM middleware will handle auth');
    }
  }, [clearAllEntries]);

  const { entry, updateEntry, clearEntry, key, isHydrated } = useReportCacheEntry(
    reportType,
    { limit, startDate, endDate, filterByDate }
  );

  const hasRows = entry.rows.length > 0;
  const hasFetchedOnce = entry.lastUpdated != null;
  const lastUpdated = entry.lastUpdated;

  // Determine if cache param should be true:
  // - If we're refreshing (fetchTrigger > 0), always send false to force fresh data
  // - If we have cached data currently (hasFetchedOnce && hasRows), send true
  // - Otherwise send false (initial load)
  const shouldSendCacheTrue = fetchTrigger > 0 ? false : (hasFetchedOnce && hasRows);

  const variables = React.useMemo(
    () => buildVariables(reportType, limit, startDate, endDate, shouldSendCacheTrue, filterByDate),
    [reportType, limit, startDate, endDate, shouldSendCacheTrue, filterByDate]
  );

  React.useEffect(() => {
    const tokensPresent = hasTokens();
    if (!tokensPresent) {
      clearAllEntries();
      clearAllAdvancedFilterCache();
      // Auth is handled by CRM middleware - no redirect needed
      console.warn('[useReportCacheSubscription] No tokens found - CRM middleware will handle auth');
      return;
    }

    // CRITICAL: Wait for IndexedDB hydration before checking cache
    if (!isHydrated) {
      console.log(
        `[${logPrefix ?? reportType}] ⏳ WAITING for IndexedDB hydration...`
      );
      return;
    }

    const triggeredByRefetch = fetchTrigger > 0;
    console.log(
      `[${logPrefix ?? reportType}] Cache check:`,
      {
        hasFetchedOnce,
        triggeredByRefetch,
        hasRows,
        rowCount: entry.rows.length,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        cacheKey: key,
        isHydrated,
        shouldSendCacheTrue,
        cacheParamValue: variables.cache,
      }
    );

    if (hasFetchedOnce && !triggeredByRefetch) {
      console.log(
        `[${logPrefix ?? reportType}] ✅ USING CACHED DATA - Skipping API call`
      );
      return;
    }

    console.log(
      `[${logPrefix ?? reportType}] 🔄 FETCHING FROM API - ${
        triggeredByRefetch ? "Manual refetch" : "Initial load"
      }`
    );

    let cancelled = false;
    const abortController = new AbortController();

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data } = await apolloClient.query({
          query: GET_REPORT_PRESIGNED_URL,
          variables,
          fetchPolicy: "network-only",
        });

        if (cancelled) return;

        const presignedUrl = data?.getReportPresignedUrl;
        if (!presignedUrl) {
          throw new Error("Failed to obtain report download link");
        }

        const response = await fetch(
          `/api/report-download?url=${encodeURIComponent(presignedUrl)}`,
          {
            signal: abortController.signal,
            cache: "no-store",
          }
        );

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          clearTokens();
          clearAllEntries();
          clearAllAdvancedFilterCache();
          // Auth is handled by CRM middleware - no redirect needed
          console.warn('[useReportCacheSubscription] Auth error (401/403) - CRM middleware will handle re-auth');
          setError(new Error('Authentication required'));
          return;
        }

        if (!response.ok) {
          let message = `Failed to download report (HTTP ${response.status})`;
          try {
            const errorPayload = await response.json();
            if (errorPayload?.message) {
              message = errorPayload.message;
            } else if (errorPayload?.error) {
              message = errorPayload.error;
            }
          } catch {
            // Ignore JSON parse errors, fall back to default message
          }
          throw new Error(message);
        }

        const csvPayload = await response.text();
        if (cancelled) return;

        const parsedRows = parseReportCsv(reportType, csvPayload);

        console.log(
          `[${logPrefix ?? reportType}] 💾 CACHING DATA - ${parsedRows.length} rows cached successfully`
        );

        updateEntry((previous) => ({
          ...previous,
          rows: parsedRows,
          seenIds: computeSeenIds(parsedRows),
          lastUpdated: Date.now(),
        }));
      } catch (err) {
        if (cancelled) return;
        if (err?.name === "AbortError") {
          return;
        }

        // Check if this is an authorization error (access denied)
        if (isAuthorizationError(err)) {
          console.warn(
            `[${logPrefix ?? reportType}] Authorization error - user does not have access to this resource:`,
            err
          );
          // Store the error but DON'T redirect to login
          // This is a permission issue, not an authentication issue
          setError(err);
          return;
        }

        // Check if this is an authentication error (token expired/invalid)
        if (isUnauthorizedError(err)) {
          clearTokens();
          clearAllEntries();
          clearAllAdvancedFilterCache();
          // Auth is handled by CRM middleware - no redirect needed
          console.warn('[useReportCacheSubscription] Unauthorized error - CRM middleware will handle re-auth');
          setError(new Error('Authentication required'));
          return;
        }

        console.error(
          `[${logPrefix ?? reportType}] Failed to load report data:`,
          err
        );

        setError(
          err instanceof Error
            ? err
            : new Error("Unexpected error while loading report")
        );
      } finally {
        if (cancelled) return;
        setLoading(false);
        if (triggeredByRefetch) {
          setFetchTrigger(0);
        }
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    apolloClient,
    reportType,
    variables,
    fetchTrigger,
    updateEntry,
    logPrefix,
    hasFetchedOnce,
    clearAllEntries,
    isHydrated,
    entry.rows.length,
    lastUpdated,
    key,
  ]);

  const resetCache = React.useCallback(() => {
    clearAdvancedFilterCache(key);
    clearEntry();
    setFetchTrigger((value) => value + 1);
  }, [clearEntry, key]);

  const hasCachedData = hasRows;
  const initialLoading = !hasFetchedOnce && loading;
  const rows = entry.rows;
  const data = hasFetchedOnce ? { getReport: rows } : undefined;

  return {
    data,
    error,
    loading,
    rows,
    cacheKey: key,
    lastUpdated,
    isFetching: loading,
    initialLoading,
    hasCachedData,
    resetCache,
    variables,
  };
}





