/**
 * CSV Comparison Utility
 * Intelligently compares before and after CSV data to detect changes:
 * - Edited cells (yellow)
 * - New rows (green)
 * - Deleted rows (red with strikethrough) - PRESERVED in after view
 * 
 * Uses smart row matching with primary key detection and fuzzy matching
 * to correctly identify row-level changes even when rows are reordered or deleted.
 */

export type ChangeType = 'edited' | 'added' | 'deleted' | 'unchanged';

export interface CsvRowChange {
  _changeType: ChangeType;
  _changedFields: string[];
  _matchedRowIndex?: number; // Original index in before data (for debugging)
  _deletedColumns?: string[]; // Columns that existed in before but not in after
  _addedColumns?: string[]; // Columns that exist in after but not in before
}

export type CsvRowWithChanges = Record<string, unknown> & CsvRowChange;

/**
 * Detect potential primary key column(s) by analyzing uniqueness
 * PRIORITY 1: Always use flow_index if it exists
 * PRIORITY 2: Detect other unique columns
 */
function detectPrimaryKeyColumns(rows: unknown[][], headers: string[]): string[] {
  if (rows.length === 0) return [];
  
  // PRIORITY 1: Check if flow_index exists as the first column
  if (headers.includes('flow_index')) {
    console.log('🔑 Using flow_index as primary key (system-generated)');
    return ['flow_index'];
  }
  
  const potentialKeys: string[] = [];
  
  // Check each column for uniqueness
  headers.forEach((header, colIndex) => {
    const values = new Set<string>();
    let allUnique = true;
    let hasEmptyValues = false;
    
    for (const row of rows) {
      const value = normalizeValue(row[colIndex]);
      if (value === '') {
        hasEmptyValues = true;
        break;
      }
      if (values.has(value)) {
        allUnique = false;
        break;
      }
      values.add(value);
    }
    
    // Column is a potential primary key if all values are unique and non-empty
    if (allUnique && !hasEmptyValues) {
      potentialKeys.push(header);
    }
  });
  
  console.log('🔑 Detected potential primary key columns:', potentialKeys);
  return potentialKeys;
}

/**
 * Create a unique key for a row based on primary key columns
 */
function createRowKey(row: unknown[], headers: string[], pkColumns: string[]): string {
  if (pkColumns.length === 0) return '';
  
  const keyParts = pkColumns.map(col => {
    const colIndex = headers.indexOf(col);
    if (colIndex === -1) return '';
    return normalizeValue(row[colIndex]);
  });
  
  return keyParts.join('::');
}

/**
 * Create a comprehensive hash of ALL row values for exact matching
 * This ensures we match identical rows even when reordered
 */
function createRowHash(row: unknown[], headers: string[]): string {
  // Hash ALL values to ensure exact match
  const values: string[] = [];
  for (let i = 0; i < headers.length; i++) {
    const val = normalizeValue(row[i]);
    values.push(val); // Include empty values too
  }
  return values.join('::'); // Use :: as separator to avoid collisions
}

/**
 * Create a hash for only specific columns (used when comparing rows with different column structures)
 */
function createRowHashForColumns(row: unknown[], allHeaders: string[], targetColumns: string[]): string {
  const values: string[] = [];
  for (const col of targetColumns) {
    const colIndex = allHeaders.indexOf(col);
    if (colIndex !== -1) {
      const val = normalizeValue(row[colIndex]);
      values.push(val);
    } else {
      values.push(''); // Column doesn't exist, use empty
    }
  }
  return values.join('::');
}

/**
 * Calculate similarity score between two rows (0-1, where 1 is identical)
 * Used when no primary key is available - OPTIMIZED for performance
 */
function calculateRowSimilarity(
  row1: unknown[],
  row2: unknown[],
  headers: string[]
): number {
  if (headers.length === 0) return 0;
  
  let matches = 0;
  const totalFields = headers.length;
  
  // Simple exact match counting - NO expensive string comparison
  for (let i = 0; i < headers.length; i++) {
    const val1 = normalizeValue(row1[i]);
    const val2 = normalizeValue(row2[i]);
    
    if (val1 === val2) {
      matches++;
    }
  }
  
  return totalFields > 0 ? matches / totalFields : 0;
}

/**
 * Calculate similarity score between two rows for only specific columns
 * Used when comparing rows with different column structures
 */
function calculateRowSimilarityForColumns(
  row1: unknown[],
  headers1: string[],
  row2: unknown[],
  headers2: string[],
  targetColumns: string[]
): number {
  if (targetColumns.length === 0) return 0;
  
  let matches = 0;
  const totalFields = targetColumns.length;
  
  for (const col of targetColumns) {
    const colIndex1 = headers1.indexOf(col);
    const colIndex2 = headers2.indexOf(col);
    
    if (colIndex1 === -1 || colIndex2 === -1) continue;
    
    const val1 = normalizeValue(row1[colIndex1]);
    const val2 = normalizeValue(row2[colIndex2]);
    
    if (val1 === val2) {
      matches++;
    }
  }
  
  return totalFields > 0 ? matches / totalFields : 0;
}

/**
 * Normalize value for comparison (handles numbers, strings, null, undefined, dates, booleans)
 * This ensures consistent formatting across different data sources (XLSX, CSV, etc.)
 * MUST match the normalization in csv-fetch API route
 */
function normalizeValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) return '';
  
  // Handle Date objects (shouldn't happen but just in case)
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    
    // Round to maximum 9 decimal places to avoid floating point precision issues
    const rounded = Math.round(value * 1000000000) / 1000000000;
    
    if (Number.isInteger(rounded)) {
      return rounded.toString();
    }
    
    let str = rounded.toString();
    if (str.includes('.')) {
      str = str.replace(/\.?0+$/, '');
    }
    return str;
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value.toString().toLowerCase();
  }
  
  // Convert to string
  const strValue = String(value).trim();
  
  // Handle empty strings
  if (strValue === '') return '';
  
  // Normalize booleans (case-insensitive)
  const lowerValue = strValue.toLowerCase();
  if (lowerValue === 'true' || lowerValue === 'false') {
    return lowerValue;
  }
  
  // Try to parse as number if it looks like one (but not dates or IDs)
  // Exclude strings that look like dates, IDs, or codes
  const looksLikePartialDate = /^\d{4}-\d{2}$/.test(strValue);
  const looksLikeFullDate = /^\d{4}-\d{2}-\d{2}$/.test(strValue);
  const looksLikeCode = /^[A-Z0-9]+-[A-Z0-9]+/.test(strValue);
  const looksLikeId = /^[A-Z]+\d+$|^\d+[A-Z]+$/.test(strValue);
  
  // If it looks like any of these patterns, return as-is without any processing
  if (looksLikePartialDate || looksLikeFullDate || looksLikeCode || looksLikeId) {
    return strValue;
  }
  
  // For numeric strings, ONLY normalize if there's trailing zeros that need removal
  // Examples that need normalization: "23.00" -> "23", "5.10" -> "5.1"
  // Examples to preserve as-is: "2822.26537", "3.14159", "42"
  if (!isNaN(Number(strValue)) && strValue !== '') {
    // Check if it has unnecessary trailing zeros
    if (strValue.includes('.') && /\.(\d*?)0+$/.test(strValue)) {
      const num = parseFloat(strValue);
      if (!isNaN(num)) {
        // Remove trailing zeros
        let str = num.toString();
        if (str.includes('.')) {
          str = str.replace(/\.?0+$/, '');
        }
        return str;
      }
    }
    // Otherwise return the number as-is to preserve original precision
    return strValue;
  }
  
  // ONLY normalize dates that have slashes or different formats
  // PRESERVE dates that are already in YYYY-MM or YYYY-MM-DD format
  const needsDateNormalization = [
    /^\d{2}\/\d{2}\/\d{4}$/,         // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // M/D/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,     // M/D/YY (short year)
    /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
  ].some(pattern => pattern.test(strValue));
  
  if (needsDateNormalization) {
    try {
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // Fall through
    }
  }
  
  // Return as-is for everything else (including YYYY-MM, YYYY-MM-DD, codes, IDs, etc.)
  return strValue;
}

/**
 * Compare two CSV datasets and return the "after" data with change indicators
 * Uses INTELLIGENT ROW MATCHING with primary key detection and fuzzy matching
 * This correctly handles deletions, additions, edits, and COLUMN CHANGES (added/deleted columns)
 */
export function compareCsvData(
  beforeData: unknown[][] | null,
  afterData: unknown[][] | null
): CsvRowWithChanges[] {
  // Early return for empty data
  if (!afterData || afterData.length === 0) return [];
  if (!beforeData || beforeData.length === 0) {
    // All rows in after are new
    const headers = afterData[0] as string[];
    const rows = afterData.slice(1);
    return rows.map((row) => {
      const obj: CsvRowWithChanges = {
        _changeType: 'added',
        _changedFields: [],
      };
      headers.forEach((header, colIndex) => {
        obj[header] = row[colIndex];
      });
      return obj;
    });
  }

  const beforeHeaders = beforeData[0] as string[];
  const afterHeaders = afterData[0] as string[];
  
  // Detect column changes
  const beforeHeadersSet = new Set(beforeHeaders);
  const afterHeadersSet = new Set(afterHeaders);
  
  const deletedColumns = beforeHeaders.filter(h => !afterHeadersSet.has(h));
  const addedColumns = afterHeaders.filter(h => !beforeHeadersSet.has(h));
  const commonColumns = afterHeaders.filter(h => beforeHeadersSet.has(h));
  
  const hasColumnChanges = deletedColumns.length > 0 || addedColumns.length > 0;
  
  if (hasColumnChanges) {
    console.log('🔄 CSV column structure changed:');
    console.log('  Deleted columns:', deletedColumns);
    console.log('  Added columns:', addedColumns);
    console.log('  Common columns:', commonColumns.length);
  }

  // Use afterHeaders for the result structure (we're showing the "after" view)
  const headers = afterHeaders;
  const beforeRows = beforeData.slice(1);
  const afterRows = afterData.slice(1);

  console.log('📊 Comparing CSV data:');
  console.log('  Before rows:', beforeRows.length);
  console.log('  After rows:', afterRows.length);
  console.log('  Before headers:', beforeHeaders.length);
  console.log('  After headers:', afterHeaders.length);

  // Step 1: Detect primary key columns (only from common columns to avoid key mismatches)
  const pkColumns = hasColumnChanges 
    ? detectPrimaryKeyColumns([...beforeRows, ...afterRows], commonColumns)
    : detectPrimaryKeyColumns([...beforeRows, ...afterRows], headers);
  const usePrimaryKey = pkColumns.length > 0;
  
  console.log('🔍 Matching strategy:', usePrimaryKey ? `Primary Key (${pkColumns.join(', ')})` : 'Hash-based Exact Matching');
  
  // Step 2: Build lookup maps (handle duplicate rows by storing arrays)
  // When columns differ, we need to match based on COMMON columns only
  const beforeRowMap = new Map<string, Array<{ row: unknown[]; index: number }>>();
  const afterRowMap = new Map<string, Array<{ row: unknown[]; index: number }>>();
  
  if (usePrimaryKey) {
    // Use primary key for exact matching
    beforeRows.forEach((row, index) => {
      const key = createRowKey(row, beforeHeaders, pkColumns);
      if (key) {
        if (!beforeRowMap.has(key)) beforeRowMap.set(key, []);
        beforeRowMap.get(key)!.push({ row, index });
      }
    });
    
    afterRows.forEach((row, index) => {
      const key = createRowKey(row, afterHeaders, pkColumns);
      if (key) {
        if (!afterRowMap.has(key)) afterRowMap.set(key, []);
        afterRowMap.get(key)!.push({ row, index });
      }
    });
  } else {
    // Use hash-based matching - but only on COMMON columns when structure differs
    beforeRows.forEach((row, index) => {
      const hash = hasColumnChanges 
        ? createRowHashForColumns(row, beforeHeaders, commonColumns)
        : createRowHash(row, beforeHeaders);
      if (hash) {
        if (!beforeRowMap.has(hash)) beforeRowMap.set(hash, []);
        beforeRowMap.get(hash)!.push({ row, index });
      }
    });
    
    afterRows.forEach((row, index) => {
      const hash = hasColumnChanges
        ? createRowHashForColumns(row, afterHeaders, commonColumns)
        : createRowHash(row, afterHeaders);
      if (hash) {
        if (!afterRowMap.has(hash)) afterRowMap.set(hash, []);
        afterRowMap.get(hash)!.push({ row, index });
      }
    });
    
    console.log('📊 Hash map sizes - Before:', beforeRowMap.size, 'After:', afterRowMap.size);
  }

  // Step 3: Match rows and detect changes
  const result: CsvRowWithChanges[] = [];
  const matchedBeforeIndices = new Set<number>();
  const matchedAfterIndices = new Set<number>();

  // First pass: Match rows using primary key or hash
  afterRows.forEach((afterRow, afterIndex) => {
    let beforeMatch: { row: unknown[]; index: number } | null = null;
    
    if (usePrimaryKey) {
      // Exact match using primary key
      const key = createRowKey(afterRow, afterHeaders, pkColumns);
      const matches = beforeRowMap.get(key);
      if (matches && matches.length > 0) {
        // Find first unmatched row with this key
        beforeMatch = matches.find(m => !matchedBeforeIndices.has(m.index)) || null;
      }
    } else {
      // Hash-based match first (fast) - exact row match on common columns
      const hash = hasColumnChanges
        ? createRowHashForColumns(afterRow, afterHeaders, commonColumns)
        : createRowHash(afterRow, afterHeaders);
      const matches = beforeRowMap.get(hash);
      if (matches && matches.length > 0) {
        // Find first unmatched row with this hash (exact match)
        beforeMatch = matches.find(m => !matchedBeforeIndices.has(m.index)) || null;
      }
      
      // If no exact hash match, do similarity check on common columns
      if (!beforeMatch) {
        let bestSimilarity = 0;
        let bestMatch: { row: unknown[]; index: number } | null = null;
        let checked = 0;
        const maxChecks = 5; // Only check 5 nearest candidates
        
        for (let beforeIndex = 0; beforeIndex < beforeRows.length && checked < maxChecks; beforeIndex++) {
          if (matchedBeforeIndices.has(beforeIndex)) continue;
          
          checked++;
          const similarity = hasColumnChanges
            ? calculateRowSimilarityForColumns(beforeRows[beforeIndex], beforeHeaders, afterRow, afterHeaders, commonColumns)
            : calculateRowSimilarity(beforeRows[beforeIndex], afterRow, afterHeaders);
          
          // Use threshold of 0.6 (60% match) for flexibility
          if (similarity > bestSimilarity && similarity >= 0.6) {
            bestSimilarity = similarity;
            bestMatch = { row: beforeRows[beforeIndex], index: beforeIndex };
          }
        }
        
        beforeMatch = bestMatch;
      }
    }

    if (beforeMatch) {
      // Row exists in both - compare cell by cell (only common columns)
      matchedBeforeIndices.add(beforeMatch.index);
      matchedAfterIndices.add(afterIndex);
      
      // Build objects for comparison - only include common columns
      const beforeObj: Record<string, unknown> = {};
      const afterObj: Record<string, unknown> = {};
      
      // Map all columns from the AFTER row (this is what we're displaying)
      afterHeaders.forEach((header, colIndex) => {
        afterObj[header] = afterRow[colIndex];
      });
      
      // Map common columns from BEFORE row for comparison
      commonColumns.forEach((header) => {
        const beforeColIndex = beforeHeaders.indexOf(header);
        if (beforeColIndex !== -1) {
          beforeObj[header] = beforeMatch!.row[beforeColIndex];
        }
      });

      const changedFields: string[] = [];
      
      // Compare only common columns
      commonColumns.forEach((header) => {
        const beforeVal = normalizeValue(beforeObj[header]);
        const afterVal = normalizeValue(afterObj[header]);
        
        if (beforeVal !== afterVal) {
          changedFields.push(header);
        }
      });

      result.push({
        ...afterObj,
        _changeType: changedFields.length > 0 ? 'edited' : 'unchanged',
        _changedFields: changedFields,
        _matchedRowIndex: beforeMatch.index,
        _deletedColumns: hasColumnChanges ? deletedColumns : undefined,
        _addedColumns: hasColumnChanges ? addedColumns : undefined,
      });
    } else {
      // Row only exists in after - it's new
      matchedAfterIndices.add(afterIndex);
      
      const obj: CsvRowWithChanges = {
        _changeType: 'added',
        _changedFields: [],
        _deletedColumns: hasColumnChanges ? deletedColumns : undefined,
        _addedColumns: hasColumnChanges ? addedColumns : undefined,
      };
      afterHeaders.forEach((header, colIndex) => {
        obj[header] = afterRow[colIndex];
      });
      result.push(obj);
    }
  });

  // Second pass: Find deleted rows (in before but not in after)
  // NOTE: Deleted rows need special handling when columns differ
  // We should still show them, but only with columns that exist in the AFTER view
  beforeRows.forEach((beforeRow, beforeIndex) => {
    if (matchedBeforeIndices.has(beforeIndex)) return; // Already matched
    
    // This row was deleted - map it to the AFTER column structure
    const obj: CsvRowWithChanges = {
      _changeType: 'deleted',
      _changedFields: [],
      _matchedRowIndex: beforeIndex,
      _deletedColumns: hasColumnChanges ? deletedColumns : undefined,
      _addedColumns: hasColumnChanges ? addedColumns : undefined,
    };
    
    // Map values from before row to after column structure
    // For common columns, use the before value
    // For added columns, leave empty/undefined
    afterHeaders.forEach((header) => {
      const beforeColIndex = beforeHeaders.indexOf(header);
      if (beforeColIndex !== -1) {
        obj[header] = beforeRow[beforeColIndex];
      } else {
        // This column didn't exist in before, leave undefined
        obj[header] = undefined;
      }
    });
    
    // Find the best insertion position to maintain visual context
    let insertIndex = 0;
    for (let i = 0; i < result.length; i++) {
      const resultRow = result[i];
      if (resultRow._matchedRowIndex !== undefined && resultRow._matchedRowIndex < beforeIndex) {
        insertIndex = i + 1;
      }
    }
    
    result.splice(insertIndex, 0, obj);
  });

  // Log statistics
  const stats = {
    edited: result.filter(r => r._changeType === 'edited').length,
    added: result.filter(r => r._changeType === 'added').length,
    deleted: result.filter(r => r._changeType === 'deleted').length,
    unchanged: result.filter(r => r._changeType === 'unchanged').length,
    columnsChanged: hasColumnChanges,
  };
  console.log('✅ Comparison results:', stats);

  return result;
}

/**
 * Convert raw CSV array data to structured objects without change detection
 * Used for the "before" pane display
 * Note: Values are kept as-is (already normalized) to ensure consistency
 */
export function transformCsvToObjects(csvData: unknown[][] | null): Record<string, unknown>[] {
  if (!csvData || csvData.length === 0) return [];
  
  const headers = csvData[0] as string[];
  const rows = csvData.slice(1);
  
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, colIndex) => {
      // Keep values as-is since they're already normalized by the API
      obj[header] = row[colIndex];
    });
    return obj;
  });
}

/**
 * Get statistics about changes between two datasets
 */
export function getChangeStats(data: CsvRowWithChanges[]): {
  total: number;
  edited: number;
  added: number;
  deleted: number;
  unchanged: number;
} {
  const stats = {
    total: data.length,
    edited: 0,
    added: 0,
    deleted: 0,
    unchanged: 0,
  };

  data.forEach((row) => {
    switch (row._changeType) {
      case 'edited':
        stats.edited++;
        break;
      case 'added':
        stats.added++;
        break;
      case 'deleted':
        stats.deleted++;
        break;
      case 'unchanged':
        stats.unchanged++;
        break;
    }
  });

  return stats;
}

/**
 * Generate a list of detailed changes for the changes feed
 * Returns corrections in the same format as the API for CSV files
 * Uses INTELLIGENT ROW MATCHING with primary key detection and fuzzy matching
 */
export function generateCsvChanges(
  beforeData: unknown[][] | null,
  afterData: unknown[][] | null
): Array<{
  id: string;
  action: string;
  createdAt: string;
  before: unknown;
  after: unknown;
}> {
  if (!beforeData || !afterData || beforeData.length === 0 || afterData.length === 0) {
    return [];
  }

  const headers = afterData[0] as string[];
  const beforeHeaders = beforeData[0] as string[];
  
  // Validate headers match
  if (JSON.stringify(beforeHeaders) !== JSON.stringify(headers)) {
    console.warn('CSV headers do not match between before and after data');
  }

  const beforeRows = beforeData.slice(1);
  const afterRows = afterData.slice(1);

  const changes: Array<{
    id: string;
    action: string;
    createdAt: string;
    before: unknown;
    after: unknown;
  }> = [];

  const now = new Date().toISOString();

  // Detect primary key columns
  const pkColumns = detectPrimaryKeyColumns([...beforeRows, ...afterRows], headers);
  const usePrimaryKey = pkColumns.length > 0;

  // Build lookup maps (handle duplicate rows)
  const beforeRowMap = new Map<string, Array<{ row: unknown[]; index: number }>>();
  const afterRowMap = new Map<string, Array<{ row: unknown[]; index: number }>>();
  
  if (usePrimaryKey) {
    beforeRows.forEach((row, index) => {
      const key = createRowKey(row, headers, pkColumns);
      if (key) {
        if (!beforeRowMap.has(key)) beforeRowMap.set(key, []);
        beforeRowMap.get(key)!.push({ row, index });
      }
    });
    
    afterRows.forEach((row, index) => {
      const key = createRowKey(row, headers, pkColumns);
      if (key) {
        if (!afterRowMap.has(key)) afterRowMap.set(key, []);
        afterRowMap.get(key)!.push({ row, index });
      }
    });
  } else {
    // Use hash-based matching
    beforeRows.forEach((row, index) => {
      const hash = createRowHash(row, headers);
      if (hash) {
        if (!beforeRowMap.has(hash)) beforeRowMap.set(hash, []);
        beforeRowMap.get(hash)!.push({ row, index });
      }
    });
    
    afterRows.forEach((row, index) => {
      const hash = createRowHash(row, headers);
      if (hash) {
        if (!afterRowMap.has(hash)) afterRowMap.set(hash, []);
        afterRowMap.get(hash)!.push({ row, index });
      }
    });
  }

  const matchedBeforeIndices = new Set<number>();
  const matchedAfterIndices = new Set<number>();

  // Match rows and detect changes
  afterRows.forEach((afterRow, afterIndex) => {
    let beforeMatch: { row: unknown[]; index: number } | null = null;
    
    if (usePrimaryKey) {
      const key = createRowKey(afterRow, headers, pkColumns);
      const matches = beforeRowMap.get(key);
      if (matches && matches.length > 0) {
        beforeMatch = matches.find(m => !matchedBeforeIndices.has(m.index)) || null;
      }
    } else {
      // Hash-based match first
      const hash = createRowHash(afterRow, headers);
      const matches = beforeRowMap.get(hash);
      if (matches && matches.length > 0) {
        beforeMatch = matches.find(m => !matchedBeforeIndices.has(m.index)) || null;
      }
      
      // Limited similarity check if no hash match
      if (!beforeMatch) {
        let bestSimilarity = 0;
        let bestMatch: { row: unknown[]; index: number } | null = null;
        let checked = 0;
        const maxChecks = 5;
        
        for (let beforeIndex = 0; beforeIndex < beforeRows.length && checked < maxChecks; beforeIndex++) {
          if (matchedBeforeIndices.has(beforeIndex)) continue;
          
          checked++;
          const similarity = calculateRowSimilarity(beforeRows[beforeIndex], afterRow, headers);
          
          if (similarity > bestSimilarity && similarity >= 0.6) {
            bestSimilarity = similarity;
            bestMatch = { row: beforeRows[beforeIndex], index: beforeIndex };
          }
        }
        
        beforeMatch = bestMatch;
      }
    }

    if (beforeMatch) {
      // Row exists in both - check for cell-level changes
      matchedBeforeIndices.add(beforeMatch.index);
      matchedAfterIndices.add(afterIndex);
      
      const beforeObj: Record<string, unknown> = {};
      const afterObj: Record<string, unknown> = {};
      
      headers.forEach((header, colIndex) => {
        beforeObj[header] = beforeMatch!.row[colIndex];
        afterObj[header] = afterRow[colIndex];
      });

      const cellChanges: Array<{ field: string; before: unknown; after: unknown }> = [];
      
      headers.forEach((header) => {
        const beforeVal = normalizeValue(beforeObj[header]);
        const afterVal = normalizeValue(afterObj[header]);
        
        if (beforeVal !== afterVal) {
          cellChanges.push({
            field: header,
            before: beforeObj[header],
            after: afterObj[header],
          });
        }
      });

      // Create one change entry per edited cell
      cellChanges.forEach((cellChange, cellIdx) => {
        // Get a unique identifier for the row (primary key or first non-empty value)
        let rowIdentifier = '';
        if (usePrimaryKey && pkColumns.length > 0) {
          const pkColIndex = headers.indexOf(pkColumns[0]);
          rowIdentifier = String(afterRow[pkColIndex]);
        } else {
          rowIdentifier = `row ${afterIndex + 2}`; // +2 for header row
        }
        
        changes.push({
          id: `csv-edit-${beforeMatch.index}-${cellIdx}-${Date.now()}`,
          action: `Edited ${cellChange.field} in ${rowIdentifier}`,
          createdAt: now,
          before: {
            row: beforeMatch.index + 2,
            field: cellChange.field,
            value: cellChange.before,
          },
          after: {
            row: afterIndex + 2,
            field: cellChange.field,
            value: cellChange.after,
          },
        });
      });
    } else {
      // Row only exists in after - it's new
      matchedAfterIndices.add(afterIndex);
      
      const obj: Record<string, unknown> = {};
      headers.forEach((header, colIndex) => {
        obj[header] = afterRow[colIndex];
      });
      
      // Get row identifier
      let rowIdentifier = '';
      if (usePrimaryKey && pkColumns.length > 0) {
        const pkColIndex = headers.indexOf(pkColumns[0]);
        rowIdentifier = String(afterRow[pkColIndex]);
      } else {
        rowIdentifier = `row ${afterIndex + 2}`;
      }
      
      changes.push({
        id: `csv-add-${afterIndex}-${Date.now()}`,
        action: `Added ${rowIdentifier}`,
        createdAt: now,
        before: null,
        after: {
          row: afterIndex + 2,
          data: obj,
        },
      });
    }
  });

  // Find deleted rows
  beforeRows.forEach((beforeRow, beforeIndex) => {
    if (matchedBeforeIndices.has(beforeIndex)) return;
    
    const obj: Record<string, unknown> = {};
    headers.forEach((header, colIndex) => {
      obj[header] = beforeRow[colIndex];
    });
    
    // Get row identifier
    let rowIdentifier = '';
    if (usePrimaryKey && pkColumns.length > 0) {
      const pkColIndex = headers.indexOf(pkColumns[0]);
      rowIdentifier = String(beforeRow[pkColIndex]);
    } else {
      rowIdentifier = `row ${beforeIndex + 2}`;
    }
    
    changes.push({
      id: `csv-delete-${beforeIndex}-${Date.now()}`,
      action: `Deleted ${rowIdentifier}`,
      createdAt: now,
      before: {
        row: beforeIndex + 2,
        data: obj,
      },
      after: null,
    });
  });

  // Sort changes by type (edits, adds, deletes) and then by identifier
  changes.sort((a, b) => {
    const getOrder = (change: typeof a) => {
      if (change.action.includes('Edited')) return 1;
      if (change.action.includes('Added')) return 2;
      return 3; // Deleted
    };
    
    const orderA = getOrder(a);
    const orderB = getOrder(b);
    
    if (orderA !== orderB) return orderA - orderB;
    
    // Within same type, sort by action text
    return a.action.localeCompare(b.action);
  });

  return changes;
}




