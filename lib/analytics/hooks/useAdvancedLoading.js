"use client";

import { useState, useMemo } from "react";

/**
 * Advanced loading state management hook with multiple loading states and skeleton presets
 */
export const useAdvancedLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [loadingStates, setLoadingStates] = useState(new Map());

  const setGlobalLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const setLoadingState = (key, isLoading) => {
    setLoadingStates((prev) => {
      const newMap = new Map(prev);
      if (isLoading) {
        newMap.set(key, true);
      } else {
        newMap.delete(key);
      }
      return newMap;
    });
  };

  const isLoading = (key) => {
    if (key) {
      return loadingStates.has(key);
    }
    return loading || loadingStates.size > 0;
  };

  const clearAllLoading = () => {
    setLoading(false);
    setLoadingStates(new Map());
  };

  const withLoading = (key, asyncFn) => {
    return async (...args) => {
      setLoadingState(key, true);
      try {
        const result = await asyncFn(...args);
        return result;
      } finally {
        setLoadingState(key, false);
      }
    };
  };

  return {
    loading,
    isLoading,
    setGlobalLoading,
    setLoadingState,
    clearAllLoading,
    withLoading,
    hasAnyLoading: loadingStates.size > 0 || loading,
  };
};

/**
 * Hook for managing skeleton configurations based on content type
 */
export const useSkeletonConfig = (
  contentType = "default",
  customConfig = {}
) => {
  const configs = useMemo(
    () => ({
      "order-dashboard": {
        grid: {
          rows: 6,
          columns: 5,
          preset: "orderDashboard",
          columnWidths: [150, 120, 180, 100, 140],
        },
        cards: {
          count: 4,
        },
      },
      "orders-report": {
        grid: {
          rows: 10,
          columns: 7,
          preset: "reportGrid",
          columnWidths: [120, 150, 100, 130, 110, 160, 120],
        },
        cards: {
          count: 3,
        },
      },
      "rep-performance": {
        grid: {
          rows: 8,
          columns: 6,
          preset: "performanceTable",
          columnWidths: [180, 120, 100, 140, 130, 150],
        },
        cards: {
          count: 4,
        },
      },
      "orders-pivot": {
        grid: {
          rows: 12,
          columns: 8,
          preset: "reportGrid",
        },
        cards: {
          count: 2,
        },
      },
      default: {
        grid: {
          rows: 5,
          columns: 4,
          preset: "simple",
        },
        cards: {
          count: 3,
        },
      },
    }),
    []
  );

  return useMemo(() => {
    const baseConfig = configs[contentType] || configs.default;
    return {
      ...baseConfig,
      ...customConfig,
      grid: {
        ...baseConfig.grid,
        ...customConfig.grid,
      },
      cards: {
        ...baseConfig.cards,
        ...customConfig.cards,
      },
    };
  }, [configs, contentType, customConfig]);
};

/**
 * Enhanced data grid hook that combines loading states with skeleton configurations
 */
export const useDataGridState = (contentType, initialData = []) => {
  const loading = useAdvancedLoading();
  const skeletonConfig = useSkeletonConfig(contentType);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const loadData = async (loadFunction, key = "default") => {
    const wrappedLoad = loading.withLoading(key, async () => {
      try {
        setError(null);
        const result = await loadFunction();
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      }
    });

    return wrappedLoad();
  };

  return {
    data,
    setData,
    error,
    setError,
    loading: loading.isLoading(),
    isLoading: loading.isLoading,
    loadData,
    skeletonConfig,
    ...loading,
  };
};

export default useAdvancedLoading;
