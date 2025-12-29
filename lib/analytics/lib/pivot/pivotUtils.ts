import { commonAggregators } from "@revolist/revogrid-pro";
import { sumSkipNulls } from "./aggregators";

export type PivotValueConfig = {
  prop: string;
  aggregator?: string;
};

export type PivotConfigState = {
  rows: string[];
  columns: string[];
  values: PivotValueConfig[];
};

const DEFAULT_AGGREGATOR = "sum";

const aggregatorMap: Record<string, (values: number[]) => number> = {
  sum: commonAggregators.sum,
  sumSkipNulls,
  avg: commonAggregators.avg,
  count: commonAggregators.count,
  max: commonAggregators.max,
  min: commonAggregators.min,
};

function toStringArray(items?: Array<string | { prop?: string }>): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object" && typeof item.prop === "string") {
        return item.prop;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}

function toValueArray(values?: Array<string | PivotValueConfig | (PivotValueConfig & { dimension?: string })>): PivotValueConfig[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const result: PivotValueConfig[] = [];
  
  for (const value of values) {
    if (typeof value === "string") {
      result.push({ prop: value, aggregator: DEFAULT_AGGREGATOR });
    } else if (value && typeof value === "object" && typeof value.prop === "string") {
      result.push({
        prop: value.prop,
        aggregator: value.aggregator || DEFAULT_AGGREGATOR,
      });
    }
  }
  
  return result;
}

export function normalizePivotConfig(config?: Partial<PivotConfigState>): PivotConfigState {
  const safeConfig = config || {};
  return {
    rows: toStringArray(safeConfig.rows),
    columns: toStringArray(safeConfig.columns),
    values: toValueArray(safeConfig.values),
  };
}

export function pivotConfigsEqual(a: PivotConfigState, b: PivotConfigState): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const arraysEqual = (first: string[], second: string[]) =>
    first.length === second.length && first.every((value, index) => value === second[index]);

  const valuesEqual = (first: PivotValueConfig[], second: PivotValueConfig[]) =>
    first.length === second.length &&
    first.every((value, index) => {
      const compare = second[index];
      return value.prop === compare.prop && (value.aggregator || DEFAULT_AGGREGATOR) === (compare.aggregator || DEFAULT_AGGREGATOR);
    });

  return arraysEqual(a.rows, b.rows) && arraysEqual(a.columns, b.columns) && valuesEqual(a.values, b.values);
}

function buildBucketKey(columnKey: string, prop: string) {
  return `${columnKey}|${prop}`;
}

export function computePivotValueTotals(sortedRows: Record<string, unknown>[], pivotConfig?: Partial<PivotConfigState>): Record<string, number> {
  if (!Array.isArray(sortedRows) || sortedRows.length === 0) {
    return {};
  }

  const normalizedConfig = normalizePivotConfig(pivotConfig);

  if (!normalizedConfig.values.length) {
    return {};
  }

  const valueAggregatorMap = new Map<string, string>();
  normalizedConfig.values.forEach(({ prop, aggregator }) => {
    valueAggregatorMap.set(prop, aggregator || DEFAULT_AGGREGATOR);
  });

  const buckets = new Map<string, number[]>();

  for (const row of sortedRows) {
    const columnKey = normalizedConfig.columns.length
      ? normalizedConfig.columns
          .map((column) => {
            const value = row?.[column];
            return value === null || value === undefined ? "" : String(value);
          })
          .join("|")
      : "";

    for (const { prop } of normalizedConfig.values) {
      const bucketKey = buildBucketKey(columnKey, prop);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }

      const bucket = buckets.get(bucketKey)!;
      const aggregatorName = valueAggregatorMap.get(prop) || DEFAULT_AGGREGATOR;

      if (aggregatorName === "count") {
        bucket.push(1);
        continue;
      }

      const rawValue = row?.[prop];
      const numericValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string"
          ? Number(rawValue.replace(/[^0-9.-]/g, ""))
          : Number(rawValue);

      if (Number.isFinite(numericValue)) {
        bucket.push(numericValue);
      }
    }
  }

  const totals: Record<string, number> = {};

  for (const [bucketKey, values] of buckets.entries()) {
    const prop = bucketKey.split("|").pop() || "";
    const aggregatorName = valueAggregatorMap.get(prop) || DEFAULT_AGGREGATOR;
    const aggregatorFn = aggregatorMap[aggregatorName] || sumSkipNulls;

    if (aggregatorName === "count") {
      totals[bucketKey] = commonAggregators.count(values);
    } else if (!values.length) {
      totals[bucketKey] = 0;
    } else {
      const result = aggregatorFn(values);
      totals[bucketKey] = Number.isFinite(result) ? result : 0;
    }
  }

  return totals;
}


