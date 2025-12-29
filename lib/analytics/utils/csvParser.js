"use client";

/**
 * Minimal CSV parser that supports quoted values and embedded commas.
 * Returns a tuple of header row and data rows (as arrays of strings).
 */
export function parseCsv(text) {
  if (typeof text !== "string") {
    return { header: [], rows: [] };
  }

  const input = text.replace(/^\ufeff/, ""); // strip BOM if present
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\r") {
      // Skip and rely on the following \n to complete the row
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  // Push the final value/row
  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Remove trailing empty rows
  while (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const hasData = lastRow.some((value) => value && value.trim() !== "");
    if (hasData) break;
    rows.pop();
  }

  if (rows.length === 0) {
    return { header: [], rows: [] };
  }

  const header = rows[0].map((value) => value.trim());
  const dataRows = rows.slice(1).map((row) =>
    row.map((value) => (typeof value === "string" ? value.trim() : value))
  );

  return { header, rows: dataRows };
}
