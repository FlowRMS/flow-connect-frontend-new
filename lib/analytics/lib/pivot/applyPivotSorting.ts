import { sumSkipNulls } from "./aggregators";
import { normalizePivotConfig, PivotConfigState } from "./pivotUtils";
import { toNumericSortValue } from "./sortHelpers";

export type SortColumnConfig = {
  prop: string;
  order: "asc" | "desc";
};

type ApplyPivotSortingArgs = {
  rows?: Record<string, unknown>[];
  sortingConfig?: SortColumnConfig[];
  pivotConfig?: Partial<PivotConfigState>;
};

type TreeNode = {
  key: string;
  rows: Record<string, unknown>[];
  aggregates: Record<string, number>;
  dimensions: Record<string, unknown>;
  children: TreeNode[];
  representativeRow: Record<string, unknown>;
};

const DEFAULT_AGGREGATOR = "sum";
const EMPTY_DIMENSION_VALUE = "__PIVOT_EMPTY_VALUE__";

const aggregatorMap: Record<string, (values: number[]) => number> = {
  sum: (values) => values.reduce((total, value) => total + value, 0),
  sumSkipNulls: (values) => sumSkipNulls(values),
  avg: (values) => {
    if (!values.length) return 0;
    const total = sumSkipNulls(values);
    return total / values.length;
  },
  max: (values) => (values.length ? Math.max(...values) : 0),
  min: (values) => (values.length ? Math.min(...values) : 0),
};

const toSortableNumber = (value: unknown): number | null => {
  const numeric = toNumericSortValue(value as number | string | Date | null);
  return typeof numeric === "number" && Number.isFinite(numeric)
    ? numeric
    : null;
};

const getRowValue = (
  row: Record<string, unknown> | null | undefined,
  prop: string
): unknown => {
  if (!row) return undefined;
  return row[prop];
};

const compareGeneralValues = (a: unknown, b: unknown): number => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const aNumeric = toSortableNumber(a);
  const bNumeric = toSortableNumber(b);

  // If both are numeric, compare numerically
  if (aNumeric !== null && bNumeric !== null) {
    if (aNumeric === bNumeric) return 0;
    return aNumeric - bNumeric;
  }

  // Fallback to string comparison with numeric option for "natural" sort order
  // This handles cases like "Item 1", "Item 2", "Item 10" correctly
  const aStr = String(a).toLowerCase();
  const bStr = String(b).toLowerCase();
  if (aStr === bStr) return 0;
  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
};

const compareNumericValues = (
  a: number | null | undefined,
  b: number | null | undefined
): number => {
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return 0;
  }
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (a === b) return 0;
  return a - b;
};

const basicSort = (
  rows: Record<string, unknown>[],
  sortingConfig: SortColumnConfig[]
): Record<string, unknown>[] => {
  if (!sortingConfig.length) {
    return rows;
  }

  const dataToSort = [...rows];
  dataToSort.sort((rowA, rowB) => {
    for (const sortCol of sortingConfig) {
      const { prop, order } = sortCol;
      const comparison = compareGeneralValues(
        getRowValue(rowA, prop),
        getRowValue(rowB, prop)
      );
      if (comparison !== 0) {
        return order === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
  return dataToSort;
};

export function applyPivotSorting({
  rows,
  sortingConfig,
  pivotConfig,
}: ApplyPivotSortingArgs): Record<string, unknown>[] {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return [];

  const normalizedPivot = normalizePivotConfig(pivotConfig);
  const rowDimensions = normalizedPivot.rows;

  if (!rowDimensions.length) {
    return basicSort(safeRows, sortingConfig || []);
  }

  const valueAggregatorMap = new Map<string, string>();
  normalizedPivot.values.forEach(({ prop, aggregator }) => {
    if (prop) {
      valueAggregatorMap.set(prop, aggregator || DEFAULT_AGGREGATOR);
    }
  });

  const measureProps = Array.from(valueAggregatorMap.keys());
  const normalizedMeasureNames = measureProps.map((measure) => ({
    measure,
    normalized: measure.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
  }));

  const resolveMeasureProp = (prop?: string): string | null => {
    if (!prop) {
      return null;
    }

    if (valueAggregatorMap.has(prop)) {
      return prop;
    }

    if (typeof prop !== "string") {
      return null;
    }

    const normalizedProp = prop.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!normalizedProp) {
      return null;
    }

    // Find all matches and pick the longest one to avoid prefix matching issues
    // e.g. "commission" matching "commission_discrepancy"
    let bestMatch: string | null = null;
    let maxLen = -1;

    for (const { measure, normalized } of normalizedMeasureNames) {
      if (normalized && normalizedProp.includes(normalized)) {
        if (normalized.length > maxLen) {
          maxLen = normalized.length;
          bestMatch = measure;
        }
      }
    }

    return bestMatch;
  };

  const buildAndSortTree = (
    currentRows: Record<string, unknown>[],
    depth: number
  ): TreeNode[] => {
    if (depth >= rowDimensions.length) {
      return [];
    }

    const dimension = rowDimensions[depth];
    const groupMap = new Map<string, TreeNode>();

    currentRows.forEach((row) => {
      const value = getRowValue(row, dimension);
      const key = value === null || value === undefined || value === ""
        ? EMPTY_DIMENSION_VALUE
        : String(value);

      let group = groupMap.get(key);
      if (!group) {
        group = {
          key,
          rows: [],
          aggregates: {},
          dimensions: { [dimension]: value },
          children: [],
          representativeRow: row,
        };
        groupMap.set(key, group);
      }
      group.rows.push(row);
    });

    const nodes = Array.from(groupMap.values());

    // Calculate aggregates for sorting
    nodes.forEach((node) => {
      normalizedPivot.values.forEach(({ prop }) => {
        const aggregatorName = valueAggregatorMap.get(prop) || DEFAULT_AGGREGATOR;

        if (aggregatorName === "count") {
          const count = node.rows.reduce((total, row) => {
            const value = getRowValue(row, prop);
            return value === null || value === undefined ? total : total + 1;
          }, 0);
          node.aggregates[prop] = count;
          return;
        }

        const numericValues: number[] = [];
        for (const row of node.rows) {
          const numeric = toSortableNumber(getRowValue(row, prop));
          if (numeric !== null) {
            numericValues.push(numeric);
          }
        }

        if (!numericValues.length) {
          node.aggregates[prop] = 0;
          return;
        }

        const aggregatorFn = aggregatorMap[aggregatorName] || aggregatorMap[DEFAULT_AGGREGATOR];
        node.aggregates[prop] = aggregatorFn(numericValues);
      });
    });

    // Sort nodes
    if (sortingConfig && sortingConfig.length > 0) {
      nodes.sort((nodeA, nodeB) => {
        for (const sortCol of sortingConfig) {
          const { prop, order } = sortCol;
          const direction = order === "desc" ? -1 : 1;

          let comparison = 0;

          const measureProp = resolveMeasureProp(prop);
          if (measureProp) {
            // Sort by measure aggregate
            comparison = compareNumericValues(
              nodeA.aggregates[measureProp],
              nodeB.aggregates[measureProp]
            );
          } else if (prop === dimension) {
            // Sort by the current dimension key
            const aValue = nodeA.dimensions[prop];
            const bValue = nodeB.dimensions[prop];
            comparison = compareGeneralValues(aValue, bValue);
          } else {
            // If sorting by a column that is NOT a measure and NOT the current dimension,
            // we try to sort by that property on the representative row.
            // This handles the case where user adds a column to the grid that isn't in pivot config
            // but wants to sort by it (assuming it's consistent within the group or they just want *some* order).
            const aValue = getRowValue(nodeA.representativeRow, prop);
            const bValue = getRowValue(nodeB.representativeRow, prop);
            comparison = compareGeneralValues(aValue, bValue);
          }

          if (comparison !== 0) {
            return comparison * direction;
          }
        }
        return 0;
      });
    } else {
      // Default sort by dimension value asc if no config
      nodes.sort((a, b) => compareGeneralValues(a.dimensions[dimension], b.dimensions[dimension]));
    }

    // Recursively process children
    nodes.forEach((node) => {
      node.children = buildAndSortTree(node.rows, depth + 1);
    });

    return nodes;
  };

  const flattenTree = (nodes: TreeNode[]): Record<string, unknown>[] => {
    const result: Record<string, unknown>[] = [];
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        result.push(...flattenTree(node.children));
      } else {
        // Leaf nodes: sort the rows within the leaf group
        const sortedRows = basicSort(node.rows, sortingConfig || []);
        result.push(...sortedRows);
      }
    });
    return result;
  };

  const rootNodes = buildAndSortTree(safeRows, 0);
  return flattenTree(rootNodes);
}
