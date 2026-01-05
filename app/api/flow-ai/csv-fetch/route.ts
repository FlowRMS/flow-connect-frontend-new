import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[flow-ai] CSV Fetch API - Request body:', body);

    const { csvUrl } = body;

    if (!csvUrl) {
      console.error('[flow-ai] Missing required fields:', { csvUrl: !!csvUrl });
      return NextResponse.json(
        { error: 'csvUrl is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    console.log('[flow-ai] Fetching CSV from URL:', csvUrl);

    // Fetch the CSV data through our backend to avoid CORS issues
    const response = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FlowRMS-Frontend/1.0',
      },
    });

    console.log('[flow-ai] CSV fetch response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[flow-ai] CSV fetch error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    // Get content type to determine file format
    const contentType = response.headers.get('content-type') || '';
    console.log('[flow-ai] Content type:', contentType);

    // Get the response as buffer first
    const buffer = await response.arrayBuffer();
    console.log('[flow-ai] Data length:', buffer.byteLength);

    // Check if this is an XLSX file
    const isXlsx = contentType.includes('spreadsheet') ||
                   contentType.includes('excel') ||
                   csvUrl.toLowerCase().includes('.xlsx') ||
                   isXlsxBuffer(buffer);

    let csvData: unknown[][];

    if (isXlsx) {
      console.log('[flow-ai] Detected XLSX file, converting to CSV...');

      try {
        // Read the workbook from buffer with RAW values
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: false,  // DON'T parse dates - keep as strings/numbers to preserve format
          cellNF: false,     // Don't use number formats
          cellText: false,   // Don't use cell text
          raw: true          // Get raw values
        });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No sheets found in XLSX file');
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON array (array of arrays) with RAW values
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,     // Return array of arrays instead of objects
          raw: false,    // Get formatted strings to preserve exact text
          defval: ''     // Default value for empty cells
        }) as unknown[][];

        // Ensure we have data
        if (!jsonData || jsonData.length === 0) {
          throw new Error('No data found in XLSX file');
        }

        // Find the maximum number of columns across all rows
        const maxCols = Math.max(...jsonData.map(row => Array.isArray(row) ? row.length : 0));

        // Normalize all rows to have the same number of columns
        csvData = jsonData.map(row => {
          const normalizedRow = Array.isArray(row) ? [...row] : [];
          while (normalizedRow.length < maxCols) {
            normalizedRow.push('');
          }
          return normalizedRow;
        });

        console.log('[flow-ai] XLSX converted to CSV successfully:', csvData.length, 'rows');
      } catch (xlsxError) {
        console.error('[flow-ai] Error converting XLSX:', xlsxError);
        throw new Error(`Failed to convert XLSX: ${xlsxError instanceof Error ? xlsxError.message : 'Unknown error'}`);
      }
    } else {
      console.log('[flow-ai] Detected CSV file, parsing with XLSX to handle quoted newlines...');

      try {
        // Read the workbook from buffer
        // XLSX.read handles CSV files automatically and correctly handles quoted newlines
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: false,
          cellNF: false,
          cellText: false,
          raw: true
        });

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No sheets found in CSV file');
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON array
        csvData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        }) as unknown[][];

        console.log('[flow-ai] CSV parsed successfully with XLSX:', csvData.length, 'rows');
      } catch (csvError) {
        console.error('[flow-ai] Error parsing CSV with XLSX:', csvError);

        // Fallback to manual parsing if XLSX fails, but try to be smarter about quotes
        console.log('[flow-ai] Falling back to manual CSV parsing...');
        const csvText = new TextDecoder('utf-8').decode(buffer);

        // Simple parser that respects quotes
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Escaped quote
              currentCell += '"';
              i++; // Skip next quote
            } else {
              // Toggle quotes
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of cell
            currentRow.push(currentCell);
            currentCell = '';
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            // End of row
            // Handle \r\n or just \n or \r
            if (char === '\r' && nextChar === '\n') {
              i++;
            }

            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }

        // Add last row if not empty
        if (currentRow.length > 0 || currentCell.length > 0) {
          currentRow.push(currentCell);
          rows.push(currentRow);
        }

        csvData = rows;
        console.log('[flow-ai] CSV parsed manually:', csvData.length, 'rows');
      }
    }

    // Normalize all cell values for consistent comparison
    // Skip header row (index 0), normalize data rows
    console.log('[flow-ai] Normalizing cell values for consistent formatting...');
    const normalizedData = csvData.map((row, rowIndex) => {
      if (rowIndex === 0) {
        // Keep headers as-is
        return row;
      }
      // Normalize all cell values in data rows
      return row.map(cell => normalizeCellValue(cell));
    });
    console.log('[flow-ai] Data normalized successfully');

    return NextResponse.json({ csvData: normalizedData }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[flow-ai] CSV Fetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSV data', details: error instanceof Error ? error.message : 'Unknown error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

/**
 * Detect if a buffer is an XLSX file based on magic bytes
 */
function isXlsxBuffer(buffer: ArrayBuffer): boolean {
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
 * Normalize a single cell value to ensure consistent formatting
 * Handles numbers, booleans, dates, and strings consistently
 * ONLY normalizes when there's actual inconsistency - preserves original format otherwise
 */
function normalizeCellValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) return '';

  // Handle booleans
  if (typeof value === 'boolean') {
    return value.toString().toLowerCase();
  }

  // Handle numbers (only if actually a number type, not string)
  if (typeof value === 'number') {
    if (isNaN(value)) return '';

    // Round to maximum 9 decimal places to avoid floating point precision issues
    const rounded = Math.round(value * 1000000000) / 1000000000;

    // For integers, don't include decimal point
    if (Number.isInteger(rounded)) {
      return rounded.toString();
    }

    // For decimals, convert to string and remove trailing zeros
    let str = rounded.toString();
    if (str.includes('.')) {
      str = str.replace(/\.?0+$/, ''); // Remove trailing zeros and decimal if integer
    }
    return str;
  }

  // Convert to string for string values
  const strValue = String(value).trim();

  // Handle empty strings
  if (strValue === '') return '';

  // Normalize booleans (case-insensitive) - always lowercase
  const lowerValue = strValue.toLowerCase();
  if (lowerValue === 'true' || lowerValue === 'false') {
    return lowerValue;
  }

  // CRITICAL: Preserve date-like and code-like strings BEFORE trying to parse as number
  const looksLikePartialDate = /^\d{4}-\d{2}$/.test(strValue);                    // YYYY-MM
  const looksLikeFullDate = /^\d{4}-\d{2}-\d{2}$/.test(strValue);                 // YYYY-MM-DD
  const looksLikeCode = /^[A-Z0-9]+-[A-Z0-9]+/.test(strValue);                    // ABC-123
  const looksLikeId = /^[A-Z]+\d+$|^\d+[A-Z]+$/.test(strValue);                   // ABC123 or 123ABC

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
  // This handles cases like 12/17/2024 -> 2024-12-17
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
      // Fall through to return original
    }
  }

  // Return as-is for everything else
  return strValue;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
