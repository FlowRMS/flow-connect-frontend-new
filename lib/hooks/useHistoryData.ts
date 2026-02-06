'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAccessToken } from '@/lib/auth';
import type { HistoryDataTypeFilter } from '@/components/history';

/**
 * Generic entity type for history deliveries
 */
export interface HistoryEntity {
  id: string;
  name: string;
  status: string;
  recordCount: number;
}

/**
 * Generic month send record
 */
export interface GenericMonthSend {
  id: string;
  period: string;
  dataType: string;
  sendMethod: string;
  fileName?: string;
  totalRecords: number;
  sentAt: string;
}

/**
 * Configuration for the history data page behavior
 */
export interface HistoryConfig<T extends GenericMonthSend> {
  /** Function to fetch history data */
  fetchHistory: (params: object, token?: string) => Promise<T[]>;
  /** Function to get overall status from entities */
  getOverallStatus: (send: T) => string;
  /** Function to fetch entity options for filter (optional) */
  fetchEntityOptions?: (token?: string) => Promise<{ id: string; name: string }[]>;
  /** Static entity options if not fetching dynamically */
  staticEntityOptions?: { id: string; name: string }[];
  /** Extract entity names from a send record for filtering */
  getEntityNames: (send: T) => string[];
  /** Filter entities within a send record by name, returns new send with only matching entities */
  filterEntitiesByName: (send: T, entityName: string) => T;
  /** UI labels and routes */
  labels: {
    pageTitle: string;
    pageDescription: string;
    entityFilterLabel: string;
    entityFilterPlaceholder: string;
    sendLink: string;
    emptyTitle: string;
    emptyDescription: string;
  };
}

export interface UseHistoryDataOptions<T extends GenericMonthSend> {
  config: HistoryConfig<T>;
}

export interface UseHistoryDataReturn<T extends GenericMonthSend> {
  // Filter states
  filterPeriod: string;
  setFilterPeriod: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterEntity: string;
  setFilterEntity: (value: string) => void;
  filterDataType: HistoryDataTypeFilter;
  setFilterDataType: (value: HistoryDataTypeFilter) => void;

  // Expansion state
  expandedMonths: Set<string>;
  toggleMonth: (id: string) => void;

  // Data states
  historySends: T[];
  filteredSends: T[];
  entityOptions: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;

  // Computed
  hasNoHistory: boolean;

  // Config
  config: HistoryConfig<T>;
}

const STATUS_MAP: Record<string, string> = {
  'Delivered': 'sent',
  'Sent with warnings': 'sent_with_warnings',
  'Failed': 'failed',
};

/**
 * Unified hook for history page logic.
 * Handles state management, data fetching, and filtering for both
 * distributor and manufacturer history pages.
 */
export function useHistoryData<T extends GenericMonthSend>({
  config,
}: UseHistoryDataOptions<T>): UseHistoryDataReturn<T> {
  // Filter states
  const [filterPeriod, setFilterPeriod] = useState<string>('All periods');
  const [filterStatus, setFilterStatus] = useState<string>('All statuses');
  const [filterEntity, setFilterEntity] = useState<string>(config.labels.entityFilterLabel);
  const [filterDataType, setFilterDataType] = useState<HistoryDataTypeFilter>('All types');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['hist-1']));

  // Data states
  const [historySends, setHistorySends] = useState<T[]>([]);
  const [entityOptions, setEntityOptions] = useState<{ id: string; name: string }[]>(
    config.staticEntityOptions || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();

        const fetchPromises: Promise<any>[] = [config.fetchHistory({}, token || undefined)];

        if (config.fetchEntityOptions) {
          fetchPromises.push(config.fetchEntityOptions(token || undefined));
        }

        const results = await Promise.all(fetchPromises);
        const historyData = results[0] as T[];
        setHistorySends(historyData);

        // Extract unique entity names from history data for accurate filtering
        // Store original names but use trimmed versions for deduplication
        const historyEntityNames = new Map<string, string>(); // normalized -> original
        historyData.forEach((send) => {
          config.getEntityNames(send).forEach((name) => {
            const trimmedName = name.trim();
            if (trimmedName && !historyEntityNames.has(trimmedName.toLowerCase())) {
              historyEntityNames.set(trimmedName.toLowerCase(), trimmedName);
            }
          });
        });

        if (results[1]) {
          // Merge API options with history data entities
          const apiOptions = results[1] as { id: string; name: string }[];
          const mergedOptions = new Map<string, { id: string; name: string }>();

          // Add entities from history data first (these names are used in filtering)
          historyEntityNames.forEach((originalName, normalizedName) => {
            const apiMatch = apiOptions.find((o) => o.name.trim().toLowerCase() === normalizedName);
            mergedOptions.set(originalName, { id: apiMatch?.id || originalName, name: originalName });
          });

          // Add remaining API options that aren't in history
          apiOptions.forEach((opt) => {
            const normalizedOptName = opt.name.trim().toLowerCase();
            if (!historyEntityNames.has(normalizedOptName)) {
              mergedOptions.set(opt.name, opt);
            }
          });

          setEntityOptions(Array.from(mergedOptions.values()));
        } else {
          // If no fetchEntityOptions, use entities from history data
          setEntityOptions(
            Array.from(historyEntityNames.values()).map((name) => ({ id: name, name }))
          );
        }
      } catch (err) {
        console.error('Failed to load history data:', err);
        setError('Failed to load send history. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [config]);

  // Filter logic - filters both the records AND entities within each record
  const filteredSends = useMemo(() => {
    const isEntityFilterActive = filterEntity !== config.labels.entityFilterLabel;
    const normalizedFilterEntity = filterEntity.trim().toLowerCase();

    return historySends
      .map((send) => {
        // If entity filter is active, filter the entities within this record
        if (isEntityFilterActive) {
          return config.filterEntitiesByName(send, normalizedFilterEntity);
        }
        return send;
      })
      .filter((send) => {
        // Check if record has any entities left after filtering
        const entityNames = config.getEntityNames(send);
        if (entityNames.length === 0) return false;

        const matchesPeriod = filterPeriod === 'All periods' || send.period === filterPeriod;

        const overallStatus = config.getOverallStatus(send);
        const matchesStatus =
          filterStatus === 'All statuses' || overallStatus === STATUS_MAP[filterStatus];

        const matchesDataType =
          filterDataType === 'All types' ||
          (filterDataType === 'POS' && send.dataType === 'POS') ||
          (filterDataType === 'POT' && send.dataType === 'POT') ||
          (filterDataType === 'POS + POT' && send.dataType === 'POS + POT');

        return matchesPeriod && matchesStatus && matchesDataType;
      });
  }, [historySends, filterPeriod, filterStatus, filterEntity, filterDataType, config]);

  const toggleMonth = useCallback((id: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const hasNoHistory = historySends.length === 0;

  return {
    filterPeriod,
    setFilterPeriod,
    filterStatus,
    setFilterStatus,
    filterEntity,
    setFilterEntity,
    filterDataType,
    setFilterDataType,
    expandedMonths,
    toggleMonth,
    historySends,
    filteredSends,
    entityOptions,
    isLoading,
    error,
    hasNoHistory,
    config,
  };
}
