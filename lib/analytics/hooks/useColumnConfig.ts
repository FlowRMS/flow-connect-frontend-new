import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnRegular as RevoGridColumn } from "@revolist/revogrid";

export type PinSide = "left" | "right" | null;

export interface ColumnConfig {
  order: string[];
  hidden: Record<string, boolean>;
  pin: Record<string, PinSide>;
}

export type ColumnWithId = RevoGridColumn & { id: string };

export interface SavedColumnConfigEntry {
  id: string;
  name: string;
  timestamp: number;
  config: ColumnConfig;
  advancedFilters?: Record<string, unknown>;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  sorting?: Array<{ prop: string; order: string }>;
}

const MONEY_FIELDS = new Set<string>([
  "commission",
  "commissions",
  "commissionDiscount",
  "commissionReceived",
  "detailTotal",
  "expectedCommission",
  "invoiceAmount",
  "lineTotal",
  "outsideRepCommission",
  "outsideRepCommissionPrevYTD",
  "outsideRepCommissionYTD",
  "outsideRepTotalPortion",
  "outsideRepTotalPortionPrevYTD",
  "outsideRepTotalPortionYTD",
  "paidCommission",
  "revenue",
  "total",
  "unitPrice",
]);

const MONEY_FIELDS_LOWER = new Set<string>(
  Array.from(MONEY_FIELDS).map((field) => field.toLowerCase())
);

export function isMoneyField(prop?: string | null): boolean {
  if (typeof prop !== "string") {
    return false;
  }

  if (MONEY_FIELDS.has(prop)) {
    return true;
  }

  return MONEY_FIELDS_LOWER.has(prop.toLowerCase());
}

export function formatMoney(value: unknown): string {
  const numericValue =
    typeof value === "number"
      ? value
      : value != null && value !== ""
      ? Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""))
      : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return value == null ? "" : String(value);
  }

  return `$${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const moneyCellTemplate: RevoGridColumn["cellTemplate"] = (h, { value }) => {
  const display = formatMoney(value);

  return h(
    "span",
    {
      style: {
        textAlign: "right",
        display: "block",
        fontVariantNumeric: "tabular-nums",
      },
    },
    display
  );
};

function ensureColumnIds(columns: RevoGridColumn[]): ColumnWithId[] {
  const used = new Set<string>();
  return columns.map((col, idx) => {
    const baseIdCandidates = [
      typeof col.id === "string" ? col.id : undefined,
      typeof col.prop === "string" ? col.prop : undefined,
      typeof col.name === "string" ? col.name : undefined,
      `col-${idx}`,
    ].filter(Boolean) as string[];

    let id = baseIdCandidates[0] ?? `col-${idx}`;
    let suffix = 1;
    while (used.has(id)) {
      const nextCandidate = baseIdCandidates[suffix];
      if (nextCandidate && !used.has(nextCandidate)) {
        id = nextCandidate;
        break;
      }
      const tentative = `${baseIdCandidates[0]}-${suffix}`;
      if (!used.has(tentative)) {
        id = tentative;
        break;
      }
      suffix += 1;
    }
    used.add(id);

    const columnWithId: ColumnWithId = {
      ...col,
      id,
    };

    if (
      !columnWithId.cellTemplate &&
      typeof columnWithId.prop === "string" &&
      MONEY_FIELDS.has(columnWithId.prop)
    ) {
      columnWithId.cellTemplate = moneyCellTemplate;
    }

    return columnWithId;
  });
}

function readStoredConfig(key: string): ColumnConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.order) ||
      typeof parsed.hidden !== "object" ||
      typeof parsed.pin !== "object"
    ) {
      return null;
    }
    return {
      order: parsed.order.filter((item: unknown) => typeof item === "string"),
      hidden: Object.fromEntries(
        Object.entries(parsed.hidden).filter(
          ([key, value]) =>
            typeof key === "string" && (value === true || value === false)
        )
      ) as Record<string, boolean>,
      pin: Object.fromEntries(
        Object.entries(parsed.pin).filter(
          ([key, value]) =>
            typeof key === "string" &&
            (value === "left" || value === "right" || value === null)
        )
      ) as Record<string, PinSide>,
    };
  } catch (error) {
    console.warn("[useColumnConfig] Failed to parse stored config", error);
    return null;
  }
}

function writeStoredConfig(key: string, config: ColumnConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.warn("[useColumnConfig] Failed to write config", error);
  }
}

function normalizeConfig(
  config: ColumnConfig,
  columns: ColumnWithId[]
): ColumnConfig {
  const validIds = new Set(columns.map((c) => c.id));
  const normalizedOrder: string[] = [];

  config.order.forEach((id) => {
    if (validIds.has(id) && !normalizedOrder.includes(id)) {
      normalizedOrder.push(id);
    }
  });

  columns.forEach((col) => {
    if (!normalizedOrder.includes(col.id)) {
      normalizedOrder.push(col.id);
    }
  });

  const hidden: Record<string, boolean> = {};
  Object.entries(config.hidden).forEach(([id, isHidden]) => {
    if (validIds.has(id) && isHidden) {
      hidden[id] = true;
    }
  });

  const pin: Record<string, PinSide> = {};
  Object.entries(config.pin).forEach(([id, side]) => {
    if (
      validIds.has(id) &&
      (side === "left" || side === "right" || side === null)
    ) {
      pin[id] = side;
    }
  });

  return {
    order: normalizedOrder,
    hidden,
    pin,
  };
}

export function useColumnConfig(
  storageKey: string,
  baseColumns: RevoGridColumn[]
): {
  allColumns: ColumnWithId[];
  columns: RevoGridColumn[];
  config: ColumnConfig;
  applyConfig: (config: ColumnConfig | null | undefined) => void;
  setOrder: (ids: string[]) => void;
  setVisibleOrder: (visibleIds: string[]) => void;
  toggleHidden: (id: string, hidden?: boolean) => void;
  setPin: (id: string, side: PinSide) => void;
  resetToBase: () => void;
  reloadFromStorage: () => void;
  saveNow: () => void;
  saveNamedConfig: (name: string, additionalState?: { advancedFilters?: Record<string, unknown>; dateRange?: { startDate?: string; endDate?: string } }) => string | null;
  loadNamedConfig: (id: string) => SavedColumnConfigEntry | null;
  deleteNamedConfig: (id: string) => boolean;
  listNamedConfigs: () => SavedColumnConfigEntry[];
  setDefaultConfig: (id: string | null) => void;
  getDefaultConfigId: () => string | null;
  isDefaultConfig: (id: string) => boolean;
} {
  const columnsWithIds = useMemo(
    () => ensureColumnIds(baseColumns),
    [baseColumns]
  );

  const defaultConfig = useMemo<ColumnConfig>(
    () => ({
      order: columnsWithIds.map((col) => col.id),
      hidden: {},
      pin: {},
    }),
    [columnsWithIds]
  );

  const savedCollectionKey = `${storageKey}.collection`;
  const defaultConfigKey = `${storageKey}.default`;

  const [config, setConfig] = useState<ColumnConfig>(() => {
    // Check if there's a default config set by the user
    if (typeof window !== "undefined") {
      try {
        const defaultConfigId = window.localStorage.getItem(defaultConfigKey);
        if (defaultConfigId) {
          const savedConfigs = JSON.parse(window.localStorage.getItem(savedCollectionKey) || '{}');
          const defaultEntry = savedConfigs[defaultConfigId];
          if (defaultEntry && defaultEntry.config) {
            console.log("[useColumnConfig] Loading default config:", defaultConfigId);
            return normalizeConfig(defaultEntry.config, columnsWithIds);
          }
        }
      } catch (error) {
        console.warn("[useColumnConfig] Failed to load default config", error);
      }
    }
    
    // If no default config is set, use base columns (show all columns)
    return { ...defaultConfig };
  });

  useEffect(() => {
    setConfig((current) => normalizeConfig(current, columnsWithIds));
  }, [columnsWithIds]);

  const normalizedConfig = useMemo(
    () => normalizeConfig(config, columnsWithIds),
    [config, columnsWithIds]
  );

  const writeConfig = useCallback(
    (configToSave: ColumnConfig) => {
      writeStoredConfig(storageKey, configToSave);
    },
    [storageKey]
  );

  const readSavedConfigs = useCallback((): Record<string, SavedColumnConfigEntry> => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(savedCollectionKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed as Record<string, SavedColumnConfigEntry>;
    } catch (error) {
      console.warn("[useColumnConfig] Failed to read saved configs", error);
      return {};
    }
  }, [savedCollectionKey]);

  const readDefaultConfigId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(defaultConfigKey);
      return raw || null;
    } catch (error) {
      console.warn("[useColumnConfig] Failed to read default config id", error);
      return null;
    }
  }, [defaultConfigKey]);

  const writeDefaultConfigId = useCallback((id: string | null) => {
    if (typeof window === "undefined") return;
    try {
      if (id) {
        window.localStorage.setItem(defaultConfigKey, id);
      } else {
        window.localStorage.removeItem(defaultConfigKey);
      }
    } catch (error) {
      console.warn("[useColumnConfig] Failed to write default config id", error);
    }
  }, [defaultConfigKey]);

  const writeSavedConfigs = useCallback((entries: Record<string, SavedColumnConfigEntry>) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(savedCollectionKey, JSON.stringify(entries));
    } catch (error) {
      console.warn("[useColumnConfig] Failed to write saved configs", error);
    }
  }, [savedCollectionKey]);

  const setOrder = useCallback(
    (ids: string[]) => {
      setConfig((current) =>
        normalizeConfig(
          {
            ...current,
            order: ids,
          },
          columnsWithIds
        )
      );
    },
    [columnsWithIds]
  );

  const setVisibleOrder = useCallback(
    (visibleIds: string[]) => {
      setConfig((current) => {
        // Simple approach: Take the new visible order and append hidden columns at the end
        // This ensures the visible columns are in exactly the order specified by visibleIds
        const visibleSet = new Set(visibleIds);
        const hiddenColumns = current.order.filter(
          (id) => current.hidden[id] === true
        );
        
        // Build new order: visible columns first (in the new order), then hidden columns
        const newOrder = [...visibleIds, ...hiddenColumns];
        
        return normalizeConfig(
          {
            ...current,
            order: newOrder,
          },
          columnsWithIds
        );
      });
    },
    [columnsWithIds]
  );

  const toggleHidden = useCallback(
    (id: string, forcedHidden?: boolean) => {
      setConfig((current) => {
        const currentHidden = current.hidden[id] === true;
        const shouldHide =
          typeof forcedHidden === "boolean" ? forcedHidden : !currentHidden;

        const nextHidden = { ...current.hidden };
        if (shouldHide) {
          nextHidden[id] = true;
        } else {
          delete nextHidden[id];
        }

        return normalizeConfig(
          {
            ...current,
            hidden: nextHidden,
          },
          columnsWithIds
        );
      });
    },
    [columnsWithIds]
  );

  const setPin = useCallback(
    (id: string, side: PinSide) => {
      setConfig((current) => {
        const nextPin = { ...current.pin };
        if (side === null) {
          delete nextPin[id];
        } else {
          nextPin[id] = side;
        }

        return normalizeConfig(
          {
            ...current,
            pin: nextPin,
          },
          columnsWithIds
        );
      });
    },
    [columnsWithIds]
  );

  const resetToBase = useCallback(() => {
    setConfig({ ...defaultConfig });
  }, [defaultConfig]);

  const reloadFromStorage = useCallback(() => {
    const stored = readStoredConfig(storageKey);
    if (stored) {
      setConfig(normalizeConfig(stored, columnsWithIds));
    } else {
      setConfig({ ...defaultConfig });
    }
  }, [columnsWithIds, defaultConfig, storageKey]);

  const computedColumns = useMemo<RevoGridColumn[]>(() => {
    const columnsById = new Map(columnsWithIds.map((col) => [col.id, col]));

    const ordered = normalizedConfig.order
      .map((id) => columnsById.get(id))
      .filter((col): col is ColumnWithId => Boolean(col));

    const visible = ordered.filter(
      (col) => !normalizedConfig.hidden[col.id]
    );

    const pinnedLeft: RevoGridColumn[] = [];
    const middle: RevoGridColumn[] = [];
    const pinnedRight: RevoGridColumn[] = [];

    visible.forEach((col) => {
      const pinSetting = normalizedConfig.pin[col.id] ?? null;
      const normalizedPin =
        pinSetting === "left"
          ? ("colPinStart" as RevoGridColumn["pin"])
          : pinSetting === "right"
          ? ("colPinEnd" as RevoGridColumn["pin"])
          : undefined;

      const nextColumn: RevoGridColumn = {
        ...col,
        pin: normalizedPin,
      };

      if (pinSetting === "left") {
        pinnedLeft.push(nextColumn);
      } else if (pinSetting === "right") {
        pinnedRight.push(nextColumn);
      } else {
        middle.push(nextColumn);
      }
    });

    return [...pinnedLeft, ...middle, ...pinnedRight];
  }, [columnsWithIds, normalizedConfig]);

  const applyConfig = useCallback(
    (nextConfig: ColumnConfig | null | undefined) => {
      if (!nextConfig) return;
      setConfig(normalizeConfig(nextConfig, columnsWithIds));
    },
    [columnsWithIds]
  );

  return {
    allColumns: columnsWithIds,
    columns: computedColumns,
    config: normalizedConfig,
    applyConfig,
    setOrder,
    setVisibleOrder,
    toggleHidden,
    setPin,
    resetToBase,
    reloadFromStorage,
    saveNow: useCallback(() => {
      // Only save to current config storage, don't create auto-saved named configs
      writeConfig(normalizedConfig);
    }, [normalizedConfig, writeConfig]),
    saveNamedConfig: useCallback((name: string, additionalState?: { advancedFilters?: Record<string, unknown>; dateRange?: { startDate?: string; endDate?: string }; sorting?: Array<{ prop: string; order: string }> }) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const entries = readSavedConfigs();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry: SavedColumnConfigEntry = {
        id,
        name: trimmed,
        timestamp: Date.now(),
        config: normalizedConfig,
        advancedFilters: additionalState?.advancedFilters,
        dateRange: additionalState?.dateRange,
        sorting: additionalState?.sorting,
      };
      entries[id] = entry;
      writeSavedConfigs(entries);
      writeConfig(normalizedConfig);
      return id;
    }, [normalizedConfig, readSavedConfigs, writeSavedConfigs, writeConfig]),
    loadNamedConfig: useCallback((id: string) => {
      const entries = readSavedConfigs();
      const entry = entries[id];
      if (!entry) return null;
      setConfig(normalizeConfig(entry.config, columnsWithIds));
      writeConfig(entry.config);
      return entry; // Return the full entry so caller can get advancedFilters and dateRange
    }, [columnsWithIds, readSavedConfigs, writeConfig]),
    deleteNamedConfig: useCallback((id: string) => {
      const entries = readSavedConfigs();
      if (!entries[id]) return false;
      delete entries[id];
      writeSavedConfigs(entries);
      return true;
    }, [readSavedConfigs, writeSavedConfigs]),
    listNamedConfigs: useCallback(() => {
      const entries = readSavedConfigs();
      return Object.values(entries).sort((a, b) => b.timestamp - a.timestamp);
    }, [readSavedConfigs]),
    setDefaultConfig: useCallback((id: string | null) => {
      writeDefaultConfigId(id);
    }, [writeDefaultConfigId]),
    getDefaultConfigId: useCallback(() => {
      return readDefaultConfigId();
    }, [readDefaultConfigId]),
    isDefaultConfig: useCallback((id: string) => {
      return readDefaultConfigId() === id;
    }, [readDefaultConfigId]),
  };
}
