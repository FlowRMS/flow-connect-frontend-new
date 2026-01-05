/**
 * CSV Processor Utility
 * Handles conversion of XLSX files to CSV format and ensures consistent data structure
 */

import * as XLSX from 'xlsx';

/**
 * Convert XLSX file buffer to CSV data array
 * @param buffer - The XLSX file buffer
 * @returns 2D array of CSV data with headers
 */
export function xlsxToCsv(buffer: ArrayBuffer): unknown[][] {
  try {
    // Read the workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in XLSX file');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON array (array of arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,  // Return array of arrays instead of objects
      raw: false, // Format values as strings
      defval: ''  // Default value for empty cells
    }) as unknown[][];
    
    // Ensure we have data
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in XLSX file');
    }
    
    // Find the maximum number of columns across all rows
    const maxCols = Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0));
    
    // Normalize all rows to have the same number of columns
    const normalizedData = jsonData.map(row => {
      const normalizedRow = Array.isArray(row) ? [...row] : [];
      while (normalizedRow.length < maxCols) {
        normalizedRow.push('');
      }
      return normalizedRow;
    });
    
    return normalizedData;
  } catch (error) {
    console.error('Error converting XLSX to CSV:', error);
    throw error;
  }
}

/**
 * Detect if a file is XLSX based on its content type or magic bytes
 * @param buffer - File buffer to check
 * @returns true if file is XLSX format
 */
export function isXlsxFile(buffer: ArrayBuffer): boolean {
  try {
    // Check for XLSX magic bytes (PK zip header)
    const arr = new Uint8Array(buffer).subarray(0, 4);
    const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // XLSX files start with PK (50 4B 03 04)
    return header.startsWith('504b0304');
  } catch {
    return false;
  }
}

/**
 * Parse CSV text to 2D array
 * @param csvText - Raw CSV text
 * @returns 2D array of CSV data
 */
export function parseCsvText(csvText: string): unknown[][] {
  try {
    // Use XLSX to parse CSV text to handle quoted newlines correctly
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    }) as unknown[][];
  } catch (error) {
    console.error('Error parsing CSV text:', error);
    
    // Fallback to manual parsing if XLSX fails
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    if (currentRow.length > 0 || currentCell.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    
    return rows;
  }
}

/**
 * Ensure CSV data has consistent column count across all rows
 * @param data - Raw CSV data
 * @returns Normalized CSV data with consistent columns
 */
export function normalizeCsvData(data: unknown[][]): unknown[][] {
  if (!data || data.length === 0) return [];
  
  // Find maximum column count
  const maxCols = Math.max(...data.map(row => Array.isArray(row) ? row.length : 0));
  
  // Pad all rows to have the same number of columns
  return data.map(row => {
    const normalizedRow = Array.isArray(row) ? [...row] : [];
    while (normalizedRow.length < maxCols) {
      normalizedRow.push('');
    }
    return normalizedRow;
  });
}




