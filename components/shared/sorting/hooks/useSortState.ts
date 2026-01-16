/**
 * Generic hook for managing sort state
 * Works with any sort configuration
 */

import { useState, useMemo, useCallback } from 'react';
import type { ActiveSort, SortConfig, SortDirection } from '../types';

interface UseSortStateOptions {
  configs: SortConfig[];
  defaultSort?: ActiveSort;
}

interface UseSortStateReturn {
  // Unified state
  activeSort: ActiveSort | null;
  
  // Handlers
  setSort: (columnId: string, direction?: SortDirection) => void;
  toggleSort: (columnId: string) => void;
  clearSort: () => void;
  
  // Helpers
  getBackendColumn: (columnId: string) => string | null;
  getSortConfig: (columnId: string) => SortConfig | undefined;
  getMenuOptions: () => SortConfig[];
  getColumnOptions: () => SortConfig[];
  
  // For API
  toOrderBy: () => Array<{ columnName: string; direction: SortDirection }>;
}

export function useSortState({ 
  configs, 
  defaultSort 
}: UseSortStateOptions): UseSortStateReturn {
  const [activeSort, setActiveSort] = useState<ActiveSort | null>(defaultSort || null);
  
  // Helpers
  const getSortConfig = useCallback((columnId: string) => {
    return configs.find(c => c.id === columnId);
  }, [configs]);
  
  const getBackendColumn = useCallback((columnId: string) => {
    const config = getSortConfig(columnId);
    return config?.backendColumn || null;
  }, [getSortConfig]);
  
  const getMenuOptions = useCallback(() => {
    return configs.filter(c => c.availableInMenu !== false);
  }, [configs]);
  
  const getColumnOptions = useCallback(() => {
    return configs.filter(c => c.availableInColumns !== false);
  }, [configs]);
  
  // Handlers
  const setSort = useCallback((columnId: string, direction?: SortDirection) => {
    const config = getSortConfig(columnId);
    if (!config) return;
    
    const newDirection = direction || config.defaultDirection || 'DESC';
    setActiveSort({ columnId, direction: newDirection });
  }, [getSortConfig]);
  
  const toggleSort = useCallback((columnId: string) => {
    if (activeSort?.columnId === columnId) {
      // Toggle direction
      setActiveSort({
        columnId,
        direction: activeSort.direction === 'ASC' ? 'DESC' : 'ASC'
      });
    } else {
      // Set new sort
      const config = getSortConfig(columnId);
      if (!config) return;
      const newDirection = config.defaultDirection || 'DESC';
      setActiveSort({ columnId, direction: newDirection });
    }
  }, [activeSort, getSortConfig]);
  
  const clearSort = useCallback(() => {
    setActiveSort(null);
  }, []);
  
  // Convert to API format
  const toOrderBy = useCallback(() => {
    if (!activeSort) return [];
    const backendColumn = getBackendColumn(activeSort.columnId);
    if (!backendColumn) return [];
    return [{
      columnName: backendColumn,
      direction: activeSort.direction
    }];
  }, [activeSort, getBackendColumn]);
  
  return {
    activeSort,
    setSort,
    toggleSort,
    clearSort,
    getBackendColumn,
    getSortConfig,
    getMenuOptions,
    getColumnOptions,
    toOrderBy,
  };
}

