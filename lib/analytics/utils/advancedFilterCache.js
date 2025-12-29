"use client";

const advancedFilterCache = new Map();

export const DEFAULT_EXCLUDED_COLUMNS = [
  "detailTotal",
  "unitPrice",
  "quantity",
  "discount",
  "commission",
  "commissionDiscount",
  "outsideRepCommission",
  "outsideRepSplitRate",
  "outsideRepTotalPortion",
  "customerId",
  "factoryId",
  "orderId",
  "quoteId",
  "outsideRepEmail",
  "customerPartNumber",
];

const MAX_UNIQUE_VALUES = 500;

function getFilterableColumns(columns, excludedColumns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return [];
  }

  const excludeSet = new Set(excludedColumns);
  return columns.filter(
    (column) =>
      column &&
      typeof column === "object" &&
      column.prop &&
      !excludeSet.has(column.prop)
  );
}

export function computeAdvancedFilterOptions(
  rows,
  columns,
  excludedColumns = DEFAULT_EXCLUDED_COLUMNS
) {
  const filterableColumns = getFilterableColumns(columns, excludedColumns);
  if (!Array.isArray(rows) || rows.length === 0 || filterableColumns.length === 0) {
    return {};
  }

  const valueSets = new Map();

  for (const column of filterableColumns) {
    valueSets.set(column.prop, new Set());
  }

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    for (const column of filterableColumns) {
      const { prop } = column;
      const rawValue = row[prop];

      if (rawValue === null || rawValue === undefined || rawValue === "") {
        continue;
      }

      const set = valueSets.get(prop);
      if (!set || set.size >= MAX_UNIQUE_VALUES) {
        continue;
      }

      if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        set.add(String(rawValue));
        continue;
      }

      if (typeof rawValue === "string") {
        set.add(rawValue);
        continue;
      }

      if (typeof rawValue === "boolean") {
        set.add(rawValue ? "true" : "false");
        continue;
      }

      try {
        set.add(String(rawValue));
      } catch {
        // Skip values that can't be stringified
      }
    }
  }

  const result = {};
  valueSets.forEach((set, prop) => {
    if (set.size > 0) {
      result[prop] = Array.from(set).sort((a, b) => {
        if (a === b) return 0;
        return a < b ? -1 : 1;
      });
    } else {
      result[prop] = [];
    }
  });

  return result;
}

export function readAdvancedFilterCache(cacheKey) {
  if (!cacheKey) {
    return null;
  }
  return advancedFilterCache.get(cacheKey) ?? null;
}

export function writeAdvancedFilterCache(cacheKey, version, values) {
  if (!cacheKey) {
    return;
  }
  advancedFilterCache.set(cacheKey, {
    version,
    values,
  });
}

export function clearAdvancedFilterCache(cacheKey) {
  if (!cacheKey) {
    return;
  }
  advancedFilterCache.delete(cacheKey);
}

export function clearAllAdvancedFilterCache() {
  advancedFilterCache.clear();
}
