"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApolloClient } from "@apollo/client/react";
import { ordersPivotConfigManager } from "@/lib/analytics/lib/tableConfigManager";
import tableConfigManager from "@/lib/analytics/lib/tableConfigManager";
import {
  fetchReportTemplates,
  upsertReportTemplate,
  deleteReportTemplate as removeReportTemplate,
} from "@/lib/analytics/lib/reportTemplateManager";

const REPORT_TYPE_BY_TABLE_ID = {
  "orders-pivot": "PIVOT_ORDER_REPORT",
  "check-pivot": "PIVOT_CHECK_REPORT",
  "quote-pivot": "PIVOT_QUOTE_REPORT",
  "invoice-pivot": "PIVOT_INVOICE_REPORT",
  "commission-by-state-pivot": "COMMISSION_BY_STATE_REPORT",
};

const normalizeRemoteTemplate = (template) => {
  if (!template) return null;

  const parsed =
    template.parsedConfig && typeof template.parsedConfig === "object"
      ? template.parsedConfig
      : {};

  const timestamp =
    typeof parsed.timestamp === "number"
      ? parsed.timestamp
      : template.createdAt
      ? new Date(template.createdAt).getTime()
      : Date.now();

  return {
    ...parsed,
    id: template.id,
    name: template.reportTemplateName ?? parsed.name ?? "",
    description: parsed.description ?? "",
    timestamp,
    isDefault: Boolean(parsed.isDefault),
  };
};

/**
 * Custom hook for managing table configurations
 * Provides auto-save, load, and configuration management capabilities
 */
export function useTableConfig(gridRef, tableId = "orders-pivot", getAdditionalState = null) {
  const [configManager] = useState(() =>
    tableId === "orders-pivot"
      ? ordersPivotConfigManager
      : new tableConfigManager(tableId)
  );

  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const client = useApolloClient();
  const reportType = REPORT_TYPE_BY_TABLE_ID[tableId];
  const useRemoteStorage = Boolean(reportType && client);
  const [remoteConfigs, setRemoteConfigs] = useState({});
  const remoteConfigsRef = useRef(remoteConfigs);
  const initialConfigLoadedRef = useRef(false);

  // Auto-save timer reference
  const autoSaveTimer = useRef(null);
  const lastChangeTime = useRef(null);

  // Auto-save delay (in milliseconds)
  const AUTO_SAVE_DELAY = 5000; // 5 seconds after last change

  /**
   * Load the last saved configuration on component mount
   */
  useEffect(() => {
    if (useRemoteStorage) return;

    const loadLastConfig = async () => {
      const lastConfig = configManager.getLastConfig();
      if (lastConfig && gridRef?.current) {
        // Get setters from additional state function
        const setters = getAdditionalState ? getAdditionalState() : {};
        const applied = await configManager.applyConfig(lastConfig, gridRef, setters);
        if (applied) {
          setLastSavedConfig(lastConfig);
          setHasUnsavedChanges(false);
        }
      }
    };

    // Delay loading to ensure grid is fully initialized
    const timer = setTimeout(loadLastConfig, 1000);
    return () => clearTimeout(timer);
  }, [useRemoteStorage, configManager, gridRef]);

  useEffect(() => {
    remoteConfigsRef.current = remoteConfigs;
  }, [remoteConfigs]);

  useEffect(() => {
    if (!useRemoteStorage) return;
    let isActive = true;

    const loadTemplates = async () => {
      try {
        const templates = await fetchReportTemplates(client, reportType);
        if (!isActive) return;

        const configs = {};
        templates.forEach((template) => {
          const normalized = normalizeRemoteTemplate(template);
          if (normalized) {
            configs[normalized.id] = normalized;
          }
        });

        setRemoteConfigs(configs);
      } catch (error) {
        if (isActive) {
          console.error("[useTableConfig] Failed to load remote configs", error);
        }
      }
    };

    loadTemplates();

    return () => {
      isActive = false;
    };
  }, [useRemoteStorage, client, reportType, refreshTrigger]);

  useEffect(() => {
    if (!useRemoteStorage) return;
    if (initialConfigLoadedRef.current) return;
    if (!gridRef?.current) return;

    const configs = Object.values(remoteConfigsRef.current || {});
    if (!configs.length) return;

    const defaultConfig =
      configs.find((entry) => entry?.isDefault) ||
      configs
        .slice()
        .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))[0];

    if (!defaultConfig) return;

    const applyInitialConfig = async () => {
      const setters = getAdditionalState ? getAdditionalState() : {};
      const applied = await configManager.applyConfig(
        defaultConfig,
        gridRef,
        setters
      );

      if (applied) {
        initialConfigLoadedRef.current = true;
        setLastSavedConfig(defaultConfig);
        setHasUnsavedChanges(false);
      }
    };

    applyInitialConfig();
  }, [
    useRemoteStorage,
    gridRef,
    configManager,
    getAdditionalState,
    remoteConfigs,
  ]);

  /**
   * Set up auto-save mechanism
   */
  const scheduleAutoSave = useCallback(() => {
    if (!autoSaveEnabled || !gridRef?.current) return;

    if (useRemoteStorage) {
      setHasUnsavedChanges(true);
      lastChangeTime.current = Date.now();
      return;
    }

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Schedule new auto-save
    autoSaveTimer.current = setTimeout(async () => {
      const additionalState = getAdditionalState ? getAdditionalState() : {};

      // Extract only the data fields, not the setters
      const dataToSave = {
        advancedFilters: additionalState.advancedFilters,
        dateRange: additionalState.dateRange,
        dashboard: additionalState.dashboard,
        sorting: additionalState.sorting,
        tableSorting: additionalState.tableSorting,
      };

      const currentConfig = await configManager.getCurrentConfig(
        gridRef,
        dataToSave
      );
      if (currentConfig) {
        await configManager.autoSave(gridRef, dataToSave);
        setLastSavedConfig(currentConfig);
        setHasUnsavedChanges(false);
      }
    }, AUTO_SAVE_DELAY);

    setHasUnsavedChanges(true);
    lastChangeTime.current = Date.now();
  }, [
    autoSaveEnabled,
    configManager,
    gridRef,
    getAdditionalState,
    useRemoteStorage,
  ]);

  /**
   * Manually save current configuration
   */
  const saveCurrentConfig = useCallback(
    async (name, description = "", options = {}) => {
      const additionalState = getAdditionalState ? getAdditionalState() : {};

      // Extract only the data fields, not the setters
      const dataToSave = {
        advancedFilters: additionalState.advancedFilters,
        dateRange: additionalState.dateRange,
        dashboard: additionalState.dashboard,
        sorting: additionalState.sorting,
        tableSorting: additionalState.tableSorting,
      };

      const currentConfig = await configManager.getCurrentConfig(
        gridRef,
        dataToSave
      );
      if (!currentConfig) {
        return null;
      }

      if (useRemoteStorage) {
        const timestamp = Date.now();
        const configToPersist = {
          ...currentConfig,
          name,
          description,
          timestamp,
          isDefault: Boolean(options?.makeDefault),
          lastModifiedAt: timestamp,
        };

        try {
          const template = await upsertReportTemplate(client, {
            id: options?.templateId,
            name,
            config: configToPersist,
            reportType,
          });

          if (!template) {
            throw new Error("No template returned from save operation");
          }

          const normalized = normalizeRemoteTemplate({
            ...template,
            parsedConfig: configToPersist,
          });

          if (configToPersist.isDefault) {
            const previousDefaults = Object.values(
              remoteConfigsRef.current || {}
            ).filter(
              (entry) => entry?.isDefault && entry.id !== normalized.id
            );

            if (previousDefaults.length) {
              await Promise.all(
                previousDefaults.map((entry) =>
                  upsertReportTemplate(client, {
                    id: entry.id,
                    name: entry.name || template.reportTemplateName || name,
                    reportType,
                    config: {
                      ...entry,
                      isDefault: false,
                      lastModifiedAt: timestamp,
                    },
                  })
                )
              );
            }
          }

          setRemoteConfigs((prev) => {
            const next = { ...prev };
            if (configToPersist.isDefault) {
              Object.keys(next).forEach((key) => {
                next[key] = { ...next[key], isDefault: false };
              });
            }
            next[normalized.id] = {
              ...configToPersist,
              ...normalized,
              id: normalized.id,
            };
            return next;
          });

          const savedConfig = {
            ...configToPersist,
            ...normalized,
            id: normalized.id,
          };
          setLastSavedConfig(savedConfig);
          setHasUnsavedChanges(false);
          setRefreshTrigger((prev) => prev + 1);
          return normalized.id;
        } catch (error) {
          console.error(
            "[useTableConfig] Failed to save configuration to server",
            error
          );
          return null;
        }
      }

      const configId = configManager.saveConfig(
        currentConfig,
        name,
        description
      );
      if (configId) {
        setLastSavedConfig(currentConfig);
        setHasUnsavedChanges(false);
        setRefreshTrigger((prev) => prev + 1);
        return configId;
      }
      return null;
    },
    [
      client,
      configManager,
      gridRef,
      getAdditionalState,
      reportType,
      useRemoteStorage,
    ]
  );

  /**
   * Load a specific configuration
   */
  const loadConfig = useCallback(
    async (configId) => {
      console.log("[useTableConfig] loadConfig called with:", configId);

      const config = useRemoteStorage
        ? remoteConfigsRef.current?.[configId]
        : configManager.loadConfig(configId);

      console.log(
        "[useTableConfig] Config loaded:",
        config ? "Found" : "Not found"
      );
      console.log(
        "[useTableConfig] gridRef.current:",
        gridRef?.current ? "Available" : "Not available"
      );

      if (config && gridRef?.current) {
        console.log("[useTableConfig] Calling applyConfig...");
        const setters = getAdditionalState ? getAdditionalState() : {};
        const applied = await configManager.applyConfig(
          config,
          gridRef,
          setters
        );
        console.log("[useTableConfig] applyConfig result:", applied);
        if (applied) {
          const timestamp = Date.now();
          setLastSavedConfig(config);
          setHasUnsavedChanges(false);
          if (useRemoteStorage) {
            setRemoteConfigs((prev) => {
              const next = { ...prev };
              if (next[configId]) {
                next[configId] = {
                  ...next[configId],
                  lastAppliedAt: timestamp,
                };
              }
              return next;
            });
          }
          setRefreshTrigger((prev) => prev + 1);
          return true;
        }
      }
      console.log("[useTableConfig] loadConfig returning false");
      return false;
    },
    [
      configManager,
      gridRef,
      getAdditionalState,
      useRemoteStorage,
    ]
  );

  /**
   * Get all saved configurations
   */
  const getSavedConfigs = useCallback(() => {
    if (useRemoteStorage) {
      return remoteConfigs;
    }
    return configManager.getSavedConfigs();
  }, [configManager, remoteConfigs, useRemoteStorage]);

  /**
   * Delete a configuration
   */
  const deleteConfig = useCallback(
    async (configId) => {
      if (useRemoteStorage) {
        try {
          await removeReportTemplate(client, configId);
          setRemoteConfigs((prev) => {
            const next = { ...prev };
            delete next[configId];
            return next;
          });
          setRefreshTrigger((prev) => prev + 1);
          return true;
        } catch (error) {
          console.error(
            "[useTableConfig] Failed to delete remote configuration",
            error
          );
          return false;
        }
      }

      const result = configManager.deleteConfig(configId);
      if (result) {
        setRefreshTrigger((prev) => prev + 1);
      }
      return result;
    },
    [client, configManager, useRemoteStorage]
  );

  /**
   * Export configuration as JSON
   */
  const exportConfig = useCallback(
    (config) => {
      return configManager.exportConfig(config);
    },
    [configManager]
  );

  /**
   * Import configuration from JSON
   */
  const importConfig = useCallback(
    (jsonString) => {
      return configManager.importConfig(jsonString);
    },
    [configManager]
  );

  /**
   * Open configuration dialog
   */
  const openConfigDialog = useCallback(() => {
    setIsConfigDialogOpen(true);
  }, []);

  /**
   * Close configuration dialog
   */
  const closeConfigDialog = useCallback(() => {
    setIsConfigDialogOpen(false);
  }, []);

  /**
   * Handle configuration applied from dialog
   */
  const handleConfigApplied = useCallback((config) => {
    setLastSavedConfig(config);
    setHasUnsavedChanges(false);
  }, []);

  /**
   * Toggle auto-save
   */
  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((prev) => !prev);
  }, []);

  /**
   * Check if there are unsaved changes
   */
  const checkForChanges = useCallback(async () => {
    if (!gridRef?.current) return false;

    const additionalState = getAdditionalState ? getAdditionalState() : {};
    const currentConfig = await configManager.getCurrentConfig(gridRef, additionalState);
    if (!currentConfig || !lastSavedConfig) return false;

    // Simple comparison - in production, you might want a more sophisticated diff
    return JSON.stringify(currentConfig) !== JSON.stringify(lastSavedConfig);
  }, [configManager, gridRef, lastSavedConfig, getAdditionalState]);

  /**
   * Register event listeners for table changes
   */
  useEffect(() => {
    if (!gridRef?.current) return;

    const grid = gridRef.current;

    // RevoGrid doesn't support standard addEventListener
    // Instead, we need to get the DOM element from the ref
    // For now, we'll disable auto-save on events and rely on manual save

    // TODO: Implement proper RevoGrid event handling
    // See: https://revolist.github.io/revogrid/guide/api/events

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [gridRef, scheduleAutoSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    // Configuration management
    configManager,
    saveCurrentConfig,
    loadConfig,
    getSavedConfigs,
    deleteConfig,
    exportConfig,
    importConfig,

    // Dialog management
    isConfigDialogOpen,
    openConfigDialog,
    closeConfigDialog,
    handleConfigApplied,

    // State
    hasUnsavedChanges,
    lastSavedConfig,
    autoSaveEnabled,
    toggleAutoSave,
    checkForChanges,
    refreshTrigger, // Trigger to refresh recent configs list

    // Auto-save control
    scheduleAutoSave,
  };
}

