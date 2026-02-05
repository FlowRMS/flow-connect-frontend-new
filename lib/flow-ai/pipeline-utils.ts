/**
 * Pipeline utility functions for file downloads and data conversion.
 */

/**
 * Converts an array of objects to CSV format.
 */
export function jsonToCsv(rows: Record<string, unknown>[]): string {
  if (!rows || !rows.length) return '';

  const headers = Object.keys(rows[0] ?? {});

  const escape = (value: unknown): string => {
    const str = value == null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  return csvRows.join('\n');
}

/**
 * Downloads a CSV file with the given content.
 */
export function downloadCsv(filename: string, csv: string): void {
  if (!csv) return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a JSON file with the given data.
 */
export function downloadJson(filename: string, data: unknown): void {
  if (!data) return;

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Parses a node result which may come as a JSON string (double-encoded).
 */
export function parseNodeResult(result: unknown): unknown {
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

/**
 * Checks if a URL is valid (not a local /tmp path).
 */
export function isValidUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
