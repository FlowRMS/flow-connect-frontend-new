"use client";

import React from "react";
import {
  loadPersistedEntries,
  persistEntries,
  removeEntries,
  clearPersistedEntries,
} from "@/lib/analytics/lib/reportCacheStorage";
import { REPORT_CACHE_CLEAR_EVENT } from "@/lib/analytics/lib/reportCacheControl";
import {
  clearAdvancedFilterCache,
  clearAllAdvancedFilterCache,
} from "@/lib/analytics/utils/advancedFilterCache";

const ReportCacheContext = React.createContext(null);

const BOOTSTRAP_STORAGE_KEY = "flow-analytics-report-cache:bootstrap:v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BOOTSTRAP_ROW_LIMIT = 50; // Reduced from 250 to prevent localStorage quota errors
const MAX_BOOTSTRAP_ENTRIES = 2; // Only bootstrap the 2 most recently used reports

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const createEmptyEntry = () => ({
  rows: [],
  seenIds: [],
  lastUpdated: null,
});

function buildCacheKey(reportType, { limit, startDate, endDate, filterByDate }) {
  const limitKey = limit ?? "";
  const startKey = startDate ?? "";
  const endKey = endDate ?? "";
  const filterKey = filterByDate ?? "";
  return `${reportType}::${limitKey}::${startKey}::${endKey}::${filterKey}`;
}

function normalizeEntry(entry) {
  if (!entry) return createEmptyEntry();

  return {
    ...createEmptyEntry(),
    ...entry,
    rows: Array.isArray(entry.rows) ? entry.rows : [],
    seenIds: Array.isArray(entry.seenIds) ? entry.seenIds : [],
    lastUpdated:
      typeof entry.lastUpdated === "number"
        ? entry.lastUpdated
        : entry.lastUpdated ?? null,
  };
}

function loadBootstrapCache() {
  if (typeof window === "undefined") return new Map();

  try {
    const raw = window.localStorage.getItem(BOOTSTRAP_STORAGE_KEY);
    if (!raw) return new Map();

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries)) return new Map();

    const now = Date.now();
    const map = new Map();

    for (const item of parsed.entries) {
      if (!item?.key) continue;

      const normalizedValue = normalizeEntry(item.value);
      if (
        normalizedValue.lastUpdated &&
        now - normalizedValue.lastUpdated > CACHE_TTL_MS
      ) {
        continue;
      }

      map.set(item.key, normalizedValue);
    }

    return map;
  } catch (error) {
    console.warn("[ReportCacheProvider] Failed to load bootstrap cache:", error);
    return new Map();
  }
}

function pruneExpiredEntries(sourceMap) {
  const now = Date.now();
  const nextMap = new Map();
  const expiredKeys = [];

  sourceMap.forEach((value, key) => {
    const normalizedValue = normalizeEntry(value);

    if (
      normalizedValue.lastUpdated &&
      now - normalizedValue.lastUpdated > CACHE_TTL_MS
    ) {
      expiredKeys.push(key);
      return;
    }

    nextMap.set(key, normalizedValue);
  });

  if (expiredKeys.length > 0) {
    void removeEntries(expiredKeys);
  }

  return nextMap;
}

function buildBootstrapEntries(cache) {
  // Sort by lastUpdated (most recent first) and limit to MAX_BOOTSTRAP_ENTRIES
  return Array.from(cache.entries())
    .filter(([, value]) => Array.isArray(value?.rows) && value.rows.length > 0)
    .sort(([, a], [, b]) => {
      const timeA = a?.lastUpdated ?? 0;
      const timeB = b?.lastUpdated ?? 0;
      return timeB - timeA; // Most recent first
    })
    .slice(0, MAX_BOOTSTRAP_ENTRIES) // Only keep the N most recent reports
    .map(([key, value]) => ({
      key,
      value: {
        ...value,
        rows: value.rows.slice(0, BOOTSTRAP_ROW_LIMIT),
      },
    }));
}

export function ReportCacheProvider({ children }) {
  const [cache, setCache] = React.useState(() => new Map());
  const [bootstrapLoaded, setBootstrapLoaded] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (bootstrapLoaded) return;
    const bootstrapCache = loadBootstrapCache();
    if (bootstrapCache.size > 0) {
      setCache(bootstrapCache);
    }
    setBootstrapLoaded(true);
  }, [bootstrapLoaded]);

  const setEntryForKey = React.useCallback((key, updater) => {
    setCache((prev) => {
      const baseMap = pruneExpiredEntries(prev);
      const previousEntry = baseMap.get(key) ?? createEmptyEntry();
      const nextEntry =
        typeof updater === "function" ? updater(previousEntry) : updater;

      if (nextEntry === previousEntry) {
        return baseMap;
      }

      baseMap.set(key, normalizeEntry(nextEntry));
      return baseMap;
    });
  }, []);

  const clearAllEntries = React.useCallback(() => {
    setCache(new Map());
    clearAllAdvancedFilterCache();

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(BOOTSTRAP_STORAGE_KEY);
    }

    void clearPersistedEntries();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleExternalClear = () => {
      clearAllEntries();
    };

    window.addEventListener(REPORT_CACHE_CLEAR_EVENT, handleExternalClear);

    return () => {
      window.removeEventListener(REPORT_CACHE_CLEAR_EVENT, handleExternalClear);
    };
  }, [clearAllEntries]);

  const resetEntryForKey = React.useCallback((key) => {
    setCache((prev) => {
      const baseMap = pruneExpiredEntries(prev);
      if (!baseMap.has(key)) {
        clearAdvancedFilterCache(key);
        return baseMap;
      }
      baseMap.set(key, createEmptyEntry());
      clearAdvancedFilterCache(key);
      return baseMap;
    });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    setCache((prev) => pruneExpiredEntries(prev));
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function hydrateFromIndexedDB() {
      try {
        const persistedEntries = await loadPersistedEntries();
        if (cancelled) return;

        if (!persistedEntries || persistedEntries.length === 0) {
          setIsHydrated(true);
          return;
        }

        const now = Date.now();
        const hydrated = new Map();
        const expiredKeys = [];

        for (const entry of persistedEntries) {
          if (!entry?.key) continue;

          const normalizedValue = normalizeEntry(entry.value);
          if (
            normalizedValue.lastUpdated &&
            now - normalizedValue.lastUpdated > CACHE_TTL_MS
          ) {
            expiredKeys.push(entry.key);
            continue;
          }

          hydrated.set(entry.key, normalizedValue);
        }

        if (expiredKeys.length > 0) {
          void removeEntries(expiredKeys);
        }

        setCache((prev) => {
          const merged = new Map(prev);
          hydrated.forEach((value, key) => {
            merged.set(key, value);
          });
          return pruneExpiredEntries(merged);
        });
      } catch (error) {
        console.warn(
          "[ReportCacheProvider] Failed to hydrate cache from IndexedDB:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    hydrateFromIndexedDB();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    const prunedCache = pruneExpiredEntries(cache);

    const entries = Array.from(prunedCache.entries())
      .filter(([, value]) => Array.isArray(value?.rows) && value.rows.length > 0)
      .map(([key, value]) => ({
        key,
        value: normalizeEntry(value),
      }));

    (async () => {
      try {
        await persistEntries(entries);
      } catch (error) {
        console.warn("[ReportCacheProvider] Failed to persist entries:", error);
      }
    })();

    try {
      const bootstrapEntries = buildBootstrapEntries(prunedCache);

      if (bootstrapEntries.length === 0) {
        window.localStorage.removeItem(BOOTSTRAP_STORAGE_KEY);
      } else {
        const bootstrapData = JSON.stringify({ entries: bootstrapEntries });
        
        // Check estimated size before attempting to save
        const estimatedSizeKB = Math.round((bootstrapData.length * 2) / 1024); // Rough estimate in KB
        console.log(
          `[ReportCacheProvider] Saving bootstrap cache: ${bootstrapEntries.length} reports, ~${estimatedSizeKB}KB`
        );
        
        window.localStorage.setItem(BOOTSTRAP_STORAGE_KEY, bootstrapData);
      }
    } catch (error) {
      // If localStorage quota exceeded, try clearing old bootstrap and retry with even less data
      if (error.name === "QuotaExceededError" || error.message?.includes("quota")) {
        console.warn(
          "[ReportCacheProvider] localStorage quota exceeded, clearing bootstrap cache"
        );
        try {
          window.localStorage.removeItem(BOOTSTRAP_STORAGE_KEY);
          // Try saving with just 1 report and 25 rows as fallback
          const fallbackEntries = buildBootstrapEntries(prunedCache)
            .slice(0, 1)
            .map(({ key, value }) => ({
              key,
              value: {
                ...value,
                rows: value.rows.slice(0, 25),
              },
            }));
          
          if (fallbackEntries.length > 0) {
            window.localStorage.setItem(
              BOOTSTRAP_STORAGE_KEY,
              JSON.stringify({ entries: fallbackEntries })
            );
            console.log(
              "[ReportCacheProvider] Saved minimal bootstrap cache (1 report, 25 rows)"
            );
          }
        } catch (fallbackError) {
          console.warn(
            "[ReportCacheProvider] Failed to save even minimal bootstrap cache:",
            fallbackError
          );
        }
      } else {
        console.warn("[ReportCacheProvider] Failed to persist bootstrap cache:", error);
      }
    }
  }, [cache, isHydrated]);

  const value = React.useMemo(
    () => ({
      cache,
      setEntryForKey,
      resetEntryForKey,
      clearAllEntries,
      isHydrated,
    }),
    [cache, setEntryForKey, resetEntryForKey, clearAllEntries, isHydrated]
  );

  return (
    <ReportCacheContext.Provider value={value}>
      {children}
    </ReportCacheContext.Provider>
  );
}

export function useReportCacheEntry(reportType, variables) {
  const context = React.useContext(ReportCacheContext);
  if (!context) {
    throw new Error(
      "useReportCacheEntry must be used within a ReportCacheProvider"
    );
  }

  const { cache, setEntryForKey, resetEntryForKey, isHydrated } = context;

  const key = React.useMemo(
    () =>
      buildCacheKey(reportType, {
        limit: variables?.limit,
        startDate: variables?.startDate,
        endDate: variables?.endDate,
        filterByDate: variables?.filterByDate,
      }),
    [reportType, variables?.limit, variables?.startDate, variables?.endDate, variables?.filterByDate]
  );

  const entry = cache.get(key) ?? createEmptyEntry();

  const updateEntry = React.useCallback(
    (updater) => {
      setEntryForKey(key, (previous) => {
        const base = previous ?? createEmptyEntry();
        return typeof updater === "function" ? updater(base) : updater;
      });
    },
    [key, setEntryForKey]
  );

  const clearEntry = React.useCallback(() => {
    resetEntryForKey(key);
  }, [key, resetEntryForKey]);

  return {
    key,
    entry,
    updateEntry,
    clearEntry,
    isHydrated,
  };
}

export { createEmptyEntry };

export function useReportCacheActions() {
  const context = React.useContext(ReportCacheContext);
  if (!context) {
    throw new Error(
      "useReportCacheActions must be used within a ReportCacheProvider"
    );
  }

  return {
    clearAllEntries: context.clearAllEntries,
  };
}


