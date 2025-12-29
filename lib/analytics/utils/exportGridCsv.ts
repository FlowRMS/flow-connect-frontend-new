import type { ColumnRegular as RevoGridColumn } from "@revolist/revogrid";
import { formatMoney, isMoneyField } from "@/lib/analytics/hooks/useColumnConfig";
import { RAW_VALUES_KEY } from "./reportData";

export type ColumnForExport = RevoGridColumn & { 
  id?: string;
  formatter?: (value: unknown) => string;
};
export type ExportFormat = "csv" | "xlsx";

type RowWithRawValues = Record<string, unknown> & {
  [RAW_VALUES_KEY]?: Record<string, string>;
};

function columnKey(column: ColumnForExport): string {
  if (typeof column.id === "string" && column.id.length > 0) {
    return column.id;
  }
  if (typeof column.prop === "string" && column.prop.length > 0) {
    return column.prop;
  }
  if (typeof column.name === "string" && column.name.length > 0) {
    return column.name;
  }
  return "";
}

function columnHeader(column: ColumnForExport): string {
  if (typeof column.name === "string" && column.name.length > 0) {
    return column.name;
  }
  if (typeof column.prop === "string" && column.prop.length > 0) {
    return column.prop;
  }
  if (typeof column.id === "string" && column.id.length > 0) {
    return column.id;
  }
  return "";
}

function getRawCellValue(
  row: Record<string, unknown>,
  key: string
): string | undefined {
  if (!row || !key) {
    return undefined;
  }
  const container = (row as RowWithRawValues)[RAW_VALUES_KEY];
  if (
    container &&
    Object.prototype.hasOwnProperty.call(container, key) &&
    typeof container[key] === "string"
  ) {
    return container[key] as string;
  }
  return undefined;
}

const CURRENCY_HEADER_KEYWORDS = ["sales", "revenue", "commission", "total", "amount"];

// Keywords that indicate a column should NOT be formatted as currency, even if it contains currency keywords
const NON_CURRENCY_KEYWORDS = ["year", "month", "date", "id", "number", "count", "qty", "quantity", "pct", "percent", "%"];

// Keywords that indicate a column should be formatted as a percentage
const PERCENTAGE_KEYWORDS = ["pct", "percent", "%", "diffpct", "difference%", "diff%"];

/**
 * Check if a column should be excluded from currency formatting
 */
function isNonCurrencyColumn(column: ColumnForExport): boolean {
  const candidates = [
    typeof column.prop === "string" ? column.prop.toLowerCase() : "",
    typeof column.name === "string" ? column.name.toLowerCase() : "",
    typeof column.id === "string" ? column.id.toLowerCase() : "",
  ].filter(Boolean);

  return candidates.some((candidate) =>
    NON_CURRENCY_KEYWORDS.some((keyword) => candidate.includes(keyword))
  );
}

/**
 * Check if a column should be formatted as a percentage
 */
function isPercentageColumn(column: ColumnForExport): boolean {
  const columnType = (column as ColumnForExport & { columnType?: string })?.columnType;
  if (columnType === "percentage") return true;

  const candidates = [
    typeof column.prop === "string" ? column.prop.toLowerCase() : "",
    typeof column.name === "string" ? column.name.toLowerCase() : "",
    typeof column.id === "string" ? column.id.toLowerCase() : "",
  ].filter(Boolean);

  return candidates.some((candidate) =>
    PERCENTAGE_KEYWORDS.some((keyword) => candidate.includes(keyword))
  );
}

function collectMoneyFieldCandidates(value?: string | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const queue = [value];
  const seen = new Set<string>();

  while (queue.length) {
    const current = queue.shift();
    if (typeof current !== "string") continue;
    const trimmed = current.trim();
    if (!trimmed || seen.has(trimmed)) continue;

    seen.add(trimmed);

    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
    }

    const cleaned = lower.replace(/[^a-z0-9]/g, "");
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
    }

    const stripped = cleaned.replace(/^(sum|avg|count|min|max|total|value|measure|aggregator)+/i, "");
    if (stripped && !seen.has(stripped)) {
      seen.add(stripped);
    }

    if (trimmed.includes("|")) {
      trimmed.split("|").forEach((segment) => queue.push(segment));
    }
  }

  return Array.from(seen).filter(Boolean);
}

function matchesMoneyFieldCandidate(value?: string | null): boolean {
  return collectMoneyFieldCandidates(value).some((candidate) =>
    isMoneyField(candidate)
  );
}

function isCurrencyColumn(column: ColumnForExport): boolean {
  // First check if this is a non-currency column (year, month, etc.) or a percentage column
  if (isNonCurrencyColumn(column) || isPercentageColumn(column)) {
    return false;
  }

  const columnType = (column as ColumnForExport & { columnType?: string })
    ?.columnType;
  const metaType =
    (column as ColumnForExport & {
      meta?: { columnType?: string; type?: string };
    })?.meta?.columnType ??
    (column as ColumnForExport & {
      meta?: { columnType?: string; type?: string };
    })?.meta?.type;

  const normalizedColumnType =
    typeof columnType === "string" ? columnType.toLowerCase() : "";
  const normalizedMetaType =
    typeof metaType === "string" ? metaType.toLowerCase() : "";

  if (
    normalizedColumnType.includes("currency") ||
    normalizedMetaType.includes("currency")
  ) {
    return true;
  }

  const candidateFields: Array<string | null | undefined> = [
    typeof column.prop === "string" ? column.prop : null,
    typeof column.id === "string" ? column.id : null,
    typeof column.name === "string" ? column.name : null,
    columnKey(column),
    (column as ColumnForExport & { meta?: Record<string, unknown> })?.meta
      ?.field as string | undefined,
    (column as ColumnForExport & { meta?: Record<string, unknown> })?.meta
      ?.sourceField as string | undefined,
    (column as ColumnForExport & { meta?: Record<string, unknown> })?.meta
      ?.prop as string | undefined,
  ];

  if (candidateFields.some((value) => matchesMoneyFieldCandidate(value))) {
    return true;
  }

  const header = columnHeader(column).toLowerCase();
  if (
    header &&
    CURRENCY_HEADER_KEYWORDS.some((keyword) => header.includes(keyword))
  ) {
    return true;
  }

  return false;
}

function computeCurrencyColumnIndexes(
  columns: ColumnForExport[]
): Set<number> {
  const indexes = new Set<number>();
  columns.forEach((col, index) => {
    if (isCurrencyColumn(col)) {
      indexes.add(index);
    }
  });
  return indexes;
}

function computePercentageColumnIndexes(
  columns: ColumnForExport[]
): Set<number> {
  const indexes = new Set<number>();
  columns.forEach((col, index) => {
    if (isPercentageColumn(col)) {
      indexes.add(index);
    }
  });
  return indexes;
}

// Helper to extract headers from pivot columns with parent-child hierarchy
function extractPivotHeaders(columns: ColumnForExport[]): { 
  headers: string[][]; 
  flatColumns: ColumnForExport[];
  merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>;
} {
  console.log("[extractPivotHeaders] Received columns count:", columns.length);
  console.log("[extractPivotHeaders] First 3 columns:", columns.slice(0, 3).map((c: ColumnForExport & { children?: ColumnForExport[] }) => ({
    name: c.name,
    prop: c.prop,
    hasChildren: Array.isArray(c.children),
    childrenCount: Array.isArray(c.children) ? c.children.length : 0,
    childrenSample: Array.isArray(c.children) ? c.children.slice(0, 2).map((ch: ColumnForExport) => ({ name: ch.name, prop: ch.prop })) : []
  })));
  
  // Check if columns have hierarchical structure with children property
  const hasChildrenProperty = columns.some((col: ColumnForExport & { children?: ColumnForExport[] }) => Array.isArray(col.children) && col.children.length > 0);
  
  // Check if columns have pipe-separated props (flattened pivot structure)
  const hasPipeSeparatedProps = columns.some((col: ColumnForExport) => {
    const prop = typeof col.prop === 'string' ? col.prop : '';
    return prop.includes('|');
  });
  
  console.log("[extractPivotHeaders] Has children property:", hasChildrenProperty);
  console.log("[extractPivotHeaders] Has pipe-separated props:", hasPipeSeparatedProps);
  
  if (!hasChildrenProperty && !hasPipeSeparatedProps) {
    // No hierarchy, return simple single-row headers
    return {
      headers: [columns.map(col => columnHeader(col))],
      flatColumns: columns,
      merges: []
    };
  }
  
  // Build hierarchical headers for pivot tables
  const parentHeaders: string[] = [];
  const childHeaders: string[] = [];
  const flatColumns: ColumnForExport[] = [];
  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [];
  
  let colIndex = 0;
  
  if (hasChildrenProperty) {
    // Handle columns with children property
    columns.forEach((col: ColumnForExport & { children?: ColumnForExport[] }) => {
      if (Array.isArray(col.children) && col.children.length > 0) {
        // This is a parent column with children
        const parentName = columnHeader(col);
        const startCol = colIndex;
        
        col.children.forEach((child: ColumnForExport) => {
          parentHeaders.push(parentName);
          childHeaders.push(columnHeader(child));
          flatColumns.push(child);
          colIndex++;
        });
        
        const endCol = colIndex - 1;
        
        // Add merge range for parent column spanning its children
        // Only merge if there are multiple children
        if (endCol > startCol) {
          merges.push({
            s: { r: 0, c: startCol },
            e: { r: 0, c: endCol }
          });
        }
      } else {
        // This is a regular column (no children)
        parentHeaders.push(columnHeader(col));
        childHeaders.push("");
        flatColumns.push(col);
        
        // For non-hierarchical columns, merge parent cell across both header rows
        merges.push({
          s: { r: 0, c: colIndex },
          e: { r: 1, c: colIndex }
        });
        
        colIndex++;
      }
    });
  } else if (hasPipeSeparatedProps) {
    // Handle flattened pivot columns with pipe-separated props
    // Group consecutive columns with the same parent
    let currentParent = '';
    let parentStartCol = -1;
    
    columns.forEach((col: ColumnForExport, _index: number) => {
      const prop = typeof col.prop === 'string' ? col.prop : '';
      const name = columnHeader(col);
      
      let parentName = '';
      let childName = '';
      
      if (prop.includes('|')) {
        // Split on pipe: "Parent|child" -> parent: "Parent", child: "child"
        const parts = prop.split('|');
        parentName = parts[0];
        childName = name; // Use the column name as child name
      } else {
        // Non-pivot column
        parentName = name;
        childName = '';
      }
      
      // Check if we're starting a new parent group or if this is the first column
      if (parentName !== currentParent) {
        // If we had a previous parent with multiple columns, add merge
        if (currentParent && parentStartCol >= 0 && colIndex - 1 > parentStartCol) {
          merges.push({
            s: { r: 0, c: parentStartCol },
            e: { r: 0, c: colIndex - 1 }
          });
        }
        
        // Start new parent group
        currentParent = parentName;
        parentStartCol = colIndex;
      }
      
      parentHeaders.push(parentName);
      childHeaders.push(childName);
      flatColumns.push(col);
      
      // For non-pivot columns (no pipe), merge across both rows
      if (!prop.includes('|') && childName === '') {
        merges.push({
          s: { r: 0, c: colIndex },
          e: { r: 1, c: colIndex }
        });
      }
      
      colIndex++;
    });
    
    // Handle last parent group - add merge if it has multiple columns
    if (currentParent && parentStartCol >= 0 && colIndex - 1 > parentStartCol) {
      const lastCol = columns[columns.length - 1];
      const lastProp = typeof lastCol.prop === 'string' ? lastCol.prop : '';
      if (lastProp.includes('|')) {
        merges.push({
          s: { r: 0, c: parentStartCol },
          e: { r: 0, c: colIndex - 1 }
        });
      }
    }
  }
  
  console.log("[extractPivotHeaders] Generated merges:", merges.length, "merge ranges");
  console.log("[extractPivotHeaders] Merges:", merges);
  console.log("[extractPivotHeaders] Parent headers sample:", parentHeaders.slice(0, 10));
  console.log("[extractPivotHeaders] Child headers sample:", childHeaders.slice(0, 10));
  
  return {
    headers: [parentHeaders, childHeaders],
    flatColumns,
    merges
  };
}

/**
 * Format a percentage value with % sign
 * Handles both decimal format (0.41 = 41%) and percentage format (41 = 41%)
 * Values less than or equal to 10 in absolute value are assumed to be decimals
 * that need to be multiplied by 100
 */
function formatPercentage(value: unknown): string {
  if (value == null) return "";
  const numValue = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(numValue)) return "";
  
  // If the value is a small decimal (between -10 and 10), it's likely a decimal
  // that needs to be multiplied by 100 to get the percentage
  // E.g., 0.41 should become 41%, 1.0 should become 100%
  const percentValue = Math.abs(numValue) <= 10 ? numValue * 100 : numValue;
  
  // Format to 2 decimal places with % sign
  return `${percentValue.toFixed(2)}%`;
}

function serializeValue(column: ColumnForExport, value: unknown): string {
  if (column.formatter) {
    return column.formatter(value);
  }
  if (value == null) return "";
  // Check percentage first since it takes precedence
  if (isPercentageColumn(column)) {
    return formatPercentage(value);
  }
  if (isCurrencyColumn(column)) {
    return formatMoney(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

// New function for XLSX exports that returns raw numeric values when appropriate
function getRawValue(column: ColumnForExport, value: unknown): string | number {
  if (column.formatter) {
    const formatted = column.formatter(value);
    return formatted;
  }

  if (value == null) return "";

  // For percentage columns, return the formatted string with % sign
  // Handle both decimal format (0.41 = 41%) and percentage format (41 = 41%)
  if (isPercentageColumn(column)) {
    if (typeof value === "number") {
      // If the value is a small decimal (between -10 and 10), it's likely a decimal
      // that needs to be multiplied by 100 to get the percentage
      const percentValue = Math.abs(value) <= 10 ? value * 100 : value;
      return `${percentValue.toFixed(2)}%`;
    }
    const numValue = parseFloat(String(value));
    if (!Number.isNaN(numValue)) {
      const percentValue = Math.abs(numValue) <= 10 ? numValue * 100 : numValue;
      return `${percentValue.toFixed(2)}%`;
    }
    return String(value);
  }

  if (typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isCurrencyColumn(column)) {
    const numericValue = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }
  }

  return String(value);
}

function escapeCsvCell(value: string): string {
  if (value === "") return "";
  const needsEscaping =
    value.includes('"') ||
    value.includes(",") ||
    value.includes("\n") ||
    value.includes("\r");
  if (!needsEscaping) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsvString(
  columns: ColumnForExport[],
  rows: Record<string, unknown>[]
): string {
  const headers = columns.map((col) => escapeCsvCell(columnHeader(col)));
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const key = columnKey(col);
        const raw =
          key && Object.prototype.hasOwnProperty.call(row, key)
            ? (row as Record<string, unknown>)[key]
            : undefined;
        const rawDisplay =
          key !== "" ? getRawCellValue(row, key) : undefined;
        const displayValue =
          rawDisplay !== undefined ? rawDisplay : serializeValue(col, raw);
        return escapeCsvCell(displayValue);
      })
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadXlsx(
  filename: string,
  data: (string | number)[][],
  sheetName = "Export",
  currencyColumns: Set<number> = new Set(),
  dataStartRow = 1
) {
  if (typeof window === "undefined") return;
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Apply currency formatting to numeric cells in the specified columns
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (
        cell &&
        typeof cell.v === "number" &&
        R >= dataStartRow &&
        currencyColumns.has(C)
      ) {
        // Apply currency format to numeric cells for flagged columns
        cell.z = '$#,##0.00';
      }
    }
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function exportGridData(options: {
  filename: string;
  columns: ColumnForExport[];
  rows: Record<string, unknown>[];
  format: ExportFormat;
  sheetName?: string;
}) {
  const { filename, columns, rows, format, sheetName } = options;
  if (!columns.length) {
    console.warn("[exportGridData] No columns provided, skipping export");
    return;
  }

  if (format === "csv") {
    const csv = buildCsvString(columns, rows);
    downloadCsv(filename, csv);
    return;
  }

  const aoa = [
    columns.map((col) => columnHeader(col)),
    ...rows.map((row) =>
      columns.map((col) => {
        const key = columnKey(col);
        const raw =
          key && Object.prototype.hasOwnProperty.call(row, key)
            ? (row as Record<string, unknown>)[key]
            : undefined;
        return getRawValue(col, raw);
      })
    ),
  ];

  const currencyColumns = computeCurrencyColumnIndexes(columns);
  await downloadXlsx(filename, aoa, sheetName, currencyColumns, 1);
}

export function exportGridCsv(options: {
  filename: string;
  columns: ColumnForExport[];
  rows: Record<string, unknown>[];
}) {
  return exportGridData({ ...options, format: "csv" });
}

export function exportGridXlsx(options: {
  filename: string;
  columns: ColumnForExport[];
  rows: Record<string, unknown>[];
  sheetName?: string;
}) {
  return exportGridData({ ...options, format: "xlsx" });
}

// Helper function to format date from yyyy-MM-dd to MM-DD-YYYY
function formatDateForDisplay(dateStr: string | undefined): string {
  if (!dateStr) return "";
  
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  return `${month}-${day}-${year}`;
}

// Helper function to format filter information
function formatFilterInfo(filters: Record<string, unknown>, dateRange?: { startDate?: string; endDate?: string }): string[] {
  const filterLines: string[] = [];
  
  // Add date range filter if present
  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    let dateFilter = "Date Range: ";
    if (dateRange.startDate && dateRange.endDate) {
      dateFilter += `${formatDateForDisplay(dateRange.startDate)} to ${formatDateForDisplay(dateRange.endDate)}`;
    } else if (dateRange.startDate) {
      dateFilter += `From ${formatDateForDisplay(dateRange.startDate)}`;
    } else if (dateRange.endDate) {
      dateFilter += `Until ${formatDateForDisplay(dateRange.endDate)}`;
    }
    filterLines.push(dateFilter);
  }
  
  // Add column filters
  Object.entries(filters).forEach(([columnName, values]) => {
    if (columnName === "_year") {
      // Handle special year filter
      if (values && values !== "all") {
        let yearLabel = "";
        switch (values) {
          case "current":
            yearLabel = "Current Year";
            break;
          case "last":
            yearLabel = "Last Year";
            break;
          case "last2":
            yearLabel = "Last 2 Years";
            break;
          case "last3":
            yearLabel = "Last 3 Years";
            break;
          default:
            yearLabel = `Year: ${values}`;
        }
        filterLines.push(`Year Filter: ${yearLabel}`);
      }
    } else if (Array.isArray(values) && values.length > 0) {
      const formattedValues = values.length > 5 ? 
        `${values.slice(0, 5).join(", ")} and ${values.length - 5} more` : 
        values.join(", ");
      filterLines.push(`${columnName}: ${formattedValues}`);
    }
  });
  
  return filterLines;
}

// Helper function to format sort information
function formatSortInfo(sorting: Array<{ prop: string; order: 'asc' | 'desc' }>): string[] {
  if (!sorting || sorting.length === 0) return [];
  
  const sortLines = sorting.map(sort => {
    const direction = sort.order === 'asc' ? 'Ascending' : 'Descending';
    return `${sort.prop}: ${direction}`;
  });
  
  return [`Sort Order: ${sortLines.join("; ")}`];
}

async function downloadXlsxWithHeaders(
  filename: string,
  data: (string | number)[][],
  headerRows: (string | number)[][] = [],
  sheetName = "Export",
  merges?: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>,
  currencyColumns: Set<number> = new Set(),
  columnHeaderRowCount = 1
) {
  if (typeof window === "undefined") return;
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  
  // Combine header rows with data rows
  const separator = headerRows.length > 0 ? [[]] : [];
  const allRows = [...headerRows, ...separator, ...data];
  
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  
  // Apply cell merges if provided
  if (merges && merges.length > 0) {
    worksheet['!merges'] = merges;
  }
  
  // Apply currency formatting to numeric cells in data section
  const infoRowCount = headerRows.length > 0 ? headerRows.length + 1 : 0;
  const dataStartRow = infoRowCount + columnHeaderRowCount;
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (
        cell &&
        typeof cell.v === "number" &&
        R >= dataStartRow &&
        currencyColumns.has(C)
      ) {
        // Apply currency format to numeric cells in data section (skip header and info rows)
        cell.z = '$#,##0.00';
      }
    }
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function exportGridXlsxWithHeaders(options: {
  filename: string;
  columns: ColumnForExport[];
  rows: Record<string, unknown>[];
  sheetName?: string;
  filters?: Record<string, unknown>;
  dateRange?: { startDate?: string; endDate?: string };
  sorting?: Array<{ prop: string; order: 'asc' | 'desc' }>;
  reportTitle?: string;
  includeHeaderInfo?: boolean;
}) {
  const {
    filename,
    columns,
    rows,
    sheetName,
    filters = {},
    dateRange,
    sorting = [],
    reportTitle,
    includeHeaderInfo = true,
  } = options;
  
  if (!columns.length) {
    console.warn("[exportGridXlsxWithHeaders] No columns provided, skipping export");
    return;
  }

  // Build header information rows
  const headerRows: string[][] = [];
  
  if (includeHeaderInfo) {
    if (reportTitle) {
      headerRows.push([reportTitle]);
    }

    headerRows.push([`Export Date: ${new Date().toLocaleString()}`]);

    const filterInfo = formatFilterInfo(filters, dateRange);
    if (filterInfo.length > 0) {
      headerRows.push([]);
      headerRows.push(["Applied Filters:"]);
      filterInfo.forEach((filter) => headerRows.push([filter]));
    }

    const sortInfo = formatSortInfo(sorting);
    if (sortInfo.length > 0) {
      headerRows.push([]);
      headerRows.push(["Applied Sorting:"]);
      sortInfo.forEach((sort) => headerRows.push([sort]));
    }
  }
  
  // Extract pivot headers (handles both flat and hierarchical columns)
  const { headers: columnHeaderRows, flatColumns, merges } = extractPivotHeaders(columns);
  const columnHeaderRowCount = columnHeaderRows.length;
  
  // Calculate the row offset for the data section (after header info rows and optional separator)
  const infoRowCount =
    headerRows.length > 0 ? headerRows.length + 1 : 0;
  
  // Adjust merge ranges to account for header info rows
  const adjustedMerges = merges.map(merge => ({
    s: { r: merge.s.r + infoRowCount, c: merge.s.c },
    e: { r: merge.e.r + infoRowCount, c: merge.e.c }
  }));
  
  // Build data rows using flat columns for proper value mapping
  const dataRows = [
    ...columnHeaderRows, // Can be single row or multiple rows for hierarchy
    ...rows.map((row) =>
      flatColumns.map((col) => {
        const key = columnKey(col);
        const raw =
          key && Object.prototype.hasOwnProperty.call(row, key)
            ? (row as Record<string, unknown>)[key]
            : undefined;
        return getRawValue(col, raw);
      })
    ),
  ];

  const currencyColumns = computeCurrencyColumnIndexes(flatColumns);
  await downloadXlsxWithHeaders(
    filename,
    dataRows,
    headerRows,
    sheetName,
    adjustedMerges,
    currencyColumns,
    columnHeaderRowCount
  );
}

