/**
 * Excel Builder Utilities
 * Export functions for generating Excel files
 */

import type { WorkSheet } from 'xlsx';
import type { PDFEntityType } from '@/components/lib/graphql/pdf-entities';
import type {
  PDFColumnConfig,
  PDFFieldConfig,
  PDFLineItemConfig,
} from '../pdf-builder/types';
import { ENTITY_TYPE_LABELS } from '../pdf-builder/types';
import { formatCurrency, formatDate, formatNumber, formatStatus } from '../pdf-builder/utils';

type ExcelCellStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number };
  fill?: { fgColor?: { rgb: string }; bgColor?: { rgb: string }; patternType?: 'solid' };
  border?: {
    top?: { style?: string; color?: { rgb: string } };
    bottom?: { style?: string; color?: { rgb: string } };
    left?: { style?: string; color?: { rgb: string } };
    right?: { style?: string; color?: { rgb: string } };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
    wrapText?: boolean;
  };
};

const COLORS = {
  blue: 'FF1D4ED8',
  dark: 'FF1F2937',
  light: 'FFF3F4F6',
  rowAlt: 'FFF9FAFB',
  totals: 'FFE5E7EB',
  border: 'FFD1D5DB',
  white: 'FFFFFFFF',
  muted: 'FF6B7280',
  text: 'FF111827',
  statusBlueBg: 'FFDBEAFE',
  statusBlueText: 'FF1D4ED8',
  statusGreenBg: 'FFD1FAE5',
  statusGreenText: 'FF047857',
  statusRedBg: 'FFFEE2E2',
  statusRedText: 'FFB91C1C',
  statusYellowBg: 'FFFEF3C7',
  statusYellowText: 'FFB45309',
  statusGrayBg: 'FFF3F4F6',
  statusGrayText: 'FF374151',
};

const solidFill = (rgb: string) => ({
  patternType: 'solid' as const,
  fgColor: { rgb },
});

const mergeStyleSection = <T extends object>(base?: T, patch?: T): T | undefined => {
  if (!base && !patch) return undefined;
  return { ...(base ?? {}), ...(patch ?? {}) } as T;
};

const getStatusColors = (statusValue: string | null | undefined) => {
  const status = statusValue?.toLowerCase() || '';
  if (status.includes('open') || status.includes('qualified')) {
    return { fill: COLORS.statusBlueBg, text: COLORS.statusBlueText };
  }
  if (status.includes('won') || status.includes('complete') || status.includes('paid') || status.includes('posted')) {
    return { fill: COLORS.statusGreenBg, text: COLORS.statusGreenText };
  }
  if (status.includes('lost') || status.includes('cancelled') || status.includes('void')) {
    return { fill: COLORS.statusRedBg, text: COLORS.statusRedText };
  }
  if (status.includes('partial') || status.includes('pending') || status.includes('negotiation')) {
    return { fill: COLORS.statusYellowBg, text: COLORS.statusYellowText };
  }
  return { fill: COLORS.statusGrayBg, text: COLORS.statusGrayText };
};

function formatFieldValue(field: PDFFieldConfig): string {
  const value = field.editedValue ?? field.value;
  if (field.id === 'status') {
    return value == null || value === '' ? '-' : formatStatus(String(value));
  }
  switch (field.type) {
    case 'currency':
      return formatCurrency(typeof value === 'number' ? value : Number(value));
    case 'date':
      return formatDate(typeof value === 'string' ? value : String(value ?? ''));
    case 'number':
      return formatNumber(typeof value === 'number' ? value : Number(value), 0);
    case 'percentage':
      return value == null ? '0%' : `${formatNumber(Number(value))}%`;
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return value == null ? '-' : String(value);
  }
}

function getLineItemCellValue(
  column: PDFColumnConfig,
  item: PDFLineItemConfig,
  index: number,
  showLineNumbers: boolean
): string | number {
  const editedValues = item.editedValues || {};
  switch (column.id) {
    case 'itemNumber':
      return showLineNumbers ? item.itemNumber : index + 1;
    case 'product':
      return editedValues.product ?? item.product;
    case 'description':
      return editedValues.description ?? item.description;
    case 'quantity':
      return editedValues.quantity ?? item.quantity;
    case 'unitPrice':
      return editedValues.unitPrice ?? item.unitPrice;
    case 'uom':
      return editedValues.uom ?? item.uom ?? 'EA';
    case 'total': {
      const qty = editedValues.quantity ?? item.quantity;
      const price = editedValues.unitPrice ?? item.unitPrice;
      return qty * price;
    }
    case 'source':
      return item.product;
    case 'reference':
      return item.description;
    case 'appliedAmount':
      return item.total;
    default:
      return '-';
  }
}

export async function exportEntityToExcel(options: {
  entityType: PDFEntityType;
  entityNumber: string;
  fields: PDFFieldConfig[];
  lineItems: PDFLineItemConfig[];
  columns: PDFColumnConfig[];
  showLineNumbers: boolean;
  includeHeader?: boolean;
  includeTotals?: boolean;
  filename?: string;
  organizationName?: string;
}) {
  if (typeof window === 'undefined') return;
  const XLSXModule = await import('xlsx-js-style');
  const XLSX = XLSXModule.default ?? XLSXModule;

  const {
    entityType,
    entityNumber,
    fields,
    lineItems,
    columns,
    showLineNumbers,
    includeHeader = true,
    includeTotals = true,
    filename,
    organizationName,
  } = options;

  const visibleFields = fields.filter((field) => field.visible);
  const primaryNumberFieldMap: Record<PDFEntityType, string> = {
    PRE_OPPORTUNITIES: 'entityNumber',
    QUOTES: 'quoteNumber',
    ORDERS: 'orderNumber',
    INVOICES: 'invoiceNumber',
    CHECKS: 'checkNumber',
  };
  const primaryNumberFieldId = primaryNumberFieldMap[entityType];
  const primaryNumberField = visibleFields.find((field) => field.id === primaryNumberFieldId);
  const showPrimaryNumberInTitle = Boolean(primaryNumberField && entityNumber);
  const summaryFields = visibleFields.filter((field) => field.category === 'summary');
  const headerFields = visibleFields.filter((field) => {
    if (field.category === 'summary') return false;
    if (showPrimaryNumberInTitle && field.id === primaryNumberFieldId) return false;
    return true;
  });
  const visibleColumns = columns.filter((column) => column.visible);
  const visibleLineItems = lineItems.filter((item) => item.visible);

  const lineItemsSubtotal = visibleLineItems.reduce((sum, item) => {
    const qty = item.editedValues?.quantity ?? item.quantity;
    const price = item.editedValues?.unitPrice ?? item.unitPrice;
    return sum + qty * price;
  }, 0);

  const totalColumns = Math.max(2, visibleColumns.length);

  // Build header rows (field label + value)
  const headerRows = includeHeader
    ? headerFields.map((field) => [field.label, formatFieldValue(field)])
    : [];
  const summaryRows = summaryFields.map((field) => {
    const rawValue = (() => {
      if (field.id === 'subtotal') {
        return field.editedValue !== undefined ? Number(field.editedValue) : lineItemsSubtotal;
      }
      if (field.id === 'discount') {
        return Number(field.editedValue ?? field.value ?? 0);
      }
      if (field.id === 'total') {
        if (field.editedValue !== undefined) {
          return Number(field.editedValue);
        }
        const discountValue = Number(
          summaryFields.find((summaryField) => summaryField.id === 'discount')?.editedValue ??
          summaryFields.find((summaryField) => summaryField.id === 'discount')?.value ??
          0
        );
        return lineItemsSubtotal - discountValue;
      }
      return Number(field.editedValue ?? field.value ?? 0);
    })();
    const row = new Array(totalColumns).fill('');
    row[0] = field.label;
    if (field.id === 'discount') {
      row[totalColumns - 1] = rawValue === 0 ? 0 : -Math.abs(rawValue);
    } else {
      row[totalColumns - 1] = rawValue;
    }
    return row;
  });

  // Build line items
  const lineItemHeaderRow = visibleColumns.map((column) => column.label);
  const lineItemRows = visibleLineItems.map((item, index) =>
    visibleColumns.map((column) =>
      getLineItemCellValue(column, item, index, showLineNumbers)
    )
  );

  // Build totals row
  const totalsRow: (string | number)[] = [];
  if (includeTotals && visibleLineItems.length > 0) {
    const totalQuantity = visibleLineItems.reduce((sum, item) => {
      return sum + (item.editedValues?.quantity ?? item.quantity);
    }, 0);
    const grandTotal = lineItemsSubtotal;

    visibleColumns.forEach((column, idx) => {
      if (idx === 0) {
        totalsRow.push('TOTAL');
      } else if (column.id === 'quantity') {
        totalsRow.push(totalQuantity);
      } else if (column.id === 'total' || column.id === 'appliedAmount') {
        totalsRow.push(grandTotal);
      } else {
        totalsRow.push('');
      }
    });
  }

  const titleText = showPrimaryNumberInTitle && entityNumber
    ? `${ENTITY_TYPE_LABELS[entityType]} # ${entityNumber}`
    : ENTITY_TYPE_LABELS[entityType];
  const titleLeftText = organizationName?.trim() || '';
  const showSplitTitle = Boolean(titleLeftText && showPrimaryNumberInTitle && entityNumber);
  const rightSectionWidth = Math.min(2, totalColumns - 1);
  const leftSectionWidth = totalColumns - rightSectionWidth;
  const titleRow = new Array(totalColumns).fill('');
  titleRow[0] = titleLeftText || titleText;
  if (showSplitTitle) {
    titleRow[leftSectionWidth] = titleText;
  }

  // Build sheet rows
  const sheetRows: (string | number)[][] = [];
  sheetRows.push(titleRow);

  const headerStartRow = sheetRows.length;
  if (includeHeader && headerRows.length > 0) {
    sheetRows.push(...headerRows);
    sheetRows.push([]);
  }

  const lineItemHeaderRowIndex = sheetRows.length;
  sheetRows.push(lineItemHeaderRow);
  const lineItemsStartRow = sheetRows.length;
  sheetRows.push(...lineItemRows);

  let totalsRowIndex = -1;
  if (includeTotals && totalsRow.length > 0) {
    totalsRowIndex = sheetRows.length;
    sheetRows.push(totalsRow);
  }

  let summaryStartRowIndex = -1;
  if (summaryRows.length > 0) {
    sheetRows.push([]);
    summaryStartRowIndex = sheetRows.length;
    sheetRows.push(...summaryRows);
  }

  const footerNote = 'Thank you for your business.';
  const generatedOn = `Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;
  const footerMetaRow = new Array(totalColumns).fill('');
  footerMetaRow[0] = generatedOn;
  footerMetaRow[totalColumns - 1] = 'Page 1 of 1';
  const footerTitleRow = new Array(totalColumns).fill('');
  footerTitleRow[0] = 'NOTES & TERMS';
  const footerNoteRow = new Array(totalColumns).fill('');
  footerNoteRow[0] = footerNote;
  const poweredByRow = new Array(totalColumns).fill('');
  poweredByRow[0] = 'Powered by FlowRMS';

  sheetRows.push([]);
  const footerTitleRowIndex = sheetRows.length;
  sheetRows.push(footerTitleRow);
  const footerNoteRowIndex = sheetRows.length;
  sheetRows.push(footerNoteRow);
  sheetRows.push([]);
  const footerMetaRowIndex = sheetRows.length;
  sheetRows.push(footerMetaRow);
  sheetRows.push([]);
  const poweredByRowIndex = sheetRows.length;
  sheetRows.push(poweredByRow);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows) as WorkSheet;

  // Merge title row
  const merges = showSplitTitle
    ? [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: leftSectionWidth - 1 },
        },
        {
          s: { r: 0, c: leftSectionWidth },
          e: { r: 0, c: totalColumns - 1 },
        },
      ]
    : [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: totalColumns - 1 },
        },
      ];

  // Calculate row indices
  const headerRowCount = headerRows.length;

  if (includeHeader && headerRowCount > 0) {
    for (let row = headerStartRow; row < headerStartRow + headerRowCount; row += 1) {
      merges.push({
        s: { r: row, c: 1 },
        e: { r: row, c: totalColumns - 1 },
      });
    }
  }

  merges.push(
    { s: { r: footerTitleRowIndex, c: 0 }, e: { r: footerTitleRowIndex, c: totalColumns - 1 } },
    { s: { r: footerNoteRowIndex, c: 0 }, e: { r: footerNoteRowIndex, c: totalColumns - 1 } },
    { s: { r: poweredByRowIndex, c: 0 }, e: { r: poweredByRowIndex, c: totalColumns - 1 } }
  );
  if (summaryStartRowIndex >= 0 && totalColumns > 1) {
    for (let row = summaryStartRowIndex; row < summaryStartRowIndex + summaryRows.length; row += 1) {
      merges.push({
        s: { r: row, c: 0 },
        e: { r: row, c: totalColumns - 2 },
      });
    }
  }

  worksheet['!merges'] = merges;

  const setCellStyle = (row: number, col: number, style: ExcelCellStyle) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (!cell) return;
    const existingStyle = (cell.s || {}) as ExcelCellStyle;
    const mergedFont = mergeStyleSection(existingStyle.font, style.font);
    const mergedFill = mergeStyleSection(existingStyle.fill, style.fill);
    const mergedBorder = mergeStyleSection(existingStyle.border, style.border);
    const mergedAlignment = mergeStyleSection(existingStyle.alignment, style.alignment);
    const nextStyle: ExcelCellStyle = {
      ...existingStyle,
      ...style,
    };

    if (mergedFont) nextStyle.font = mergedFont;
    if (mergedFill) nextStyle.fill = mergedFill;
    if (mergedBorder) nextStyle.border = mergedBorder;
    if (mergedAlignment) nextStyle.alignment = mergedAlignment;

    cell.s = nextStyle;
  };

  const setCellNumberFormat = (row: number, col: number, format: string) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (!cell) return;
    cell.z = format;
  };

  // Style: Title row
  const thinBorder = {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  };
  const titleStyle: ExcelCellStyle = {
    font: { bold: true, color: { rgb: COLORS.white }, sz: 14 },
    fill: solidFill(COLORS.blue),
    alignment: { horizontal: 'left', vertical: 'center' },
    border: thinBorder,
  };
  setCellStyle(0, 0, titleStyle);
  if (showSplitTitle) {
    setCellStyle(0, leftSectionWidth, {
      font: { bold: true, color: { rgb: COLORS.white }, sz: 12 },
      fill: solidFill(COLORS.blue),
      alignment: { horizontal: 'right', vertical: 'center' },
      border: thinBorder,
    });
  }

  // Style: Header fields
  for (let row = headerStartRow; row < headerStartRow + headerRowCount; row += 1) {
    const headerField = headerFields[row - headerStartRow];
    setCellStyle(row, 0, {
      font: { bold: true, color: { rgb: COLORS.dark } },
      fill: solidFill(COLORS.light),
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder,
    });
    setCellStyle(row, 1, {
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: thinBorder,
    });
    if (headerField?.category === 'dates') {
      setCellStyle(row, 1, {
        alignment: { horizontal: 'right', vertical: 'center' },
      });
    }
    if (headerField && ['currency', 'number', 'percentage'].includes(headerField.type)) {
      setCellStyle(row, 1, {
        alignment: { horizontal: 'right', vertical: 'center' },
      });
    }
    if (headerField?.id === 'status') {
      const statusColors = getStatusColors(
        String(headerField.editedValue ?? headerField.value ?? '')
      );
      setCellStyle(row, 1, {
        font: { bold: true, color: { rgb: statusColors.text } },
        fill: solidFill(statusColors.fill),
        alignment: { horizontal: 'center', vertical: 'center' },
      });
    }
  }

  // Style: Line items header
  for (let col = 0; col < totalColumns; col += 1) {
    setCellStyle(lineItemHeaderRowIndex, col, {
      font: { bold: true, color: { rgb: COLORS.white } },
      fill: solidFill(COLORS.dark),
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    });
  }

  // Style: Line item data rows
  const currencyColumns = new Set(['unitPrice', 'total', 'appliedAmount']);
  const quantityColumns = new Set(['quantity']);
  const integerColumns = new Set(['itemNumber']);
  const rightAlignedColumns = new Set([
    ...currencyColumns,
    ...quantityColumns,
    ...integerColumns,
  ]);
  const wrapTextColumns = new Set(['description', 'product', 'reference']);

  for (let rowIndex = 0; rowIndex < lineItemRows.length; rowIndex += 1) {
    const row = lineItemsStartRow + rowIndex;
    const isAlternate = rowIndex % 2 === 1;
    for (let col = 0; col < visibleColumns.length; col += 1) {
      setCellStyle(row, col, {
        border: thinBorder,
      });
      if (isAlternate) {
        setCellStyle(row, col, {
          fill: solidFill(COLORS.rowAlt),
        });
      }
      if (rightAlignedColumns.has(visibleColumns[col]?.id)) {
        setCellStyle(row, col, {
          alignment: { horizontal: 'right', vertical: 'center' },
        });
      }
      if (wrapTextColumns.has(visibleColumns[col]?.id)) {
        setCellStyle(row, col, {
          alignment: { wrapText: true, vertical: 'top' },
        });
      } else {
        setCellStyle(row, col, {
          alignment: { vertical: 'top' },
        });
      }
      const columnId = visibleColumns[col]?.id;
      if (currencyColumns.has(columnId)) {
        setCellNumberFormat(row, col, '$#,##0.00');
      } else if (quantityColumns.has(columnId)) {
        setCellNumberFormat(row, col, '0.####');
      } else if (integerColumns.has(columnId)) {
        setCellNumberFormat(row, col, '0');
      }
    }
  }

  // Style: Totals row
  if (includeTotals && totalsRow.length > 0) {
    for (let col = 0; col < visibleColumns.length; col += 1) {
      setCellStyle(totalsRowIndex, col, {
        font: { bold: true, color: { rgb: COLORS.dark } },
        fill: solidFill(COLORS.totals),
        alignment: {
          horizontal: rightAlignedColumns.has(visibleColumns[col]?.id) ? 'right' : 'left',
          vertical: 'center',
        },
        border: thinBorder,
      });
      const columnId = visibleColumns[col]?.id;
      if (currencyColumns.has(columnId)) {
        setCellNumberFormat(totalsRowIndex, col, '$#,##0.00');
      } else if (quantityColumns.has(columnId)) {
        setCellNumberFormat(totalsRowIndex, col, '0.####');
      }
    }
  }

  // Style: Summary rows
  if (summaryStartRowIndex >= 0) {
    summaryFields.forEach((field, idx) => {
      const row = summaryStartRowIndex + idx;
      const isTotal = field.id === 'total';
      const isDiscount = field.id === 'discount';
      setCellStyle(row, 0, {
        font: {
          bold: isTotal,
          color: { rgb: isDiscount ? COLORS.statusRedText : COLORS.muted },
          sz: isTotal ? 11 : 9,
        },
        alignment: { horizontal: 'right', vertical: 'center' },
      });
      setCellStyle(row, totalColumns - 1, {
        font: {
          bold: isTotal,
          color: { rgb: isDiscount ? COLORS.statusRedText : COLORS.text },
          sz: isTotal ? 11 : 9,
        },
        alignment: { horizontal: 'right', vertical: 'center' },
      });
      setCellNumberFormat(row, totalColumns - 1, '$#,##0.00');
      if (isTotal) {
        setCellStyle(row, 0, {
          border: { top: { style: 'thin', color: { rgb: COLORS.border } } },
        });
        setCellStyle(row, totalColumns - 1, {
          border: { top: { style: 'thin', color: { rgb: COLORS.border } } },
        });
      }
    });
  }

  setCellStyle(footerTitleRowIndex, 0, {
    font: { bold: true, color: { rgb: COLORS.muted }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: thinBorder,
  });
  setCellStyle(footerNoteRowIndex, 0, {
    font: { color: { rgb: COLORS.text }, sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: thinBorder,
  });
  setCellStyle(footerMetaRowIndex, 0, {
    font: { color: { rgb: COLORS.muted }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center' },
  });
  setCellStyle(footerMetaRowIndex, totalColumns - 1, {
    font: { color: { rgb: COLORS.muted }, sz: 9 },
    alignment: { horizontal: 'right', vertical: 'center' },
  });
  setCellStyle(poweredByRowIndex, 0, {
    font: { color: { rgb: COLORS.muted }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
  });

  // Column widths
  const widthByColumnId: Record<string, number> = {
    itemNumber: 8,
    product: 18,
    description: 40,
    unitPrice: 12,
    quantity: 8,
    uom: 8,
    total: 12,
    source: 16,
    reference: 24,
    appliedAmount: 14,
  };

  const labelLengths = headerFields.map((field) => field.label.length);
  const valueLengths = headerFields.map((field) =>
    String(formatFieldValue(field)).length
  );
  const maxLabelLength = labelLengths.length
    ? Math.max(...labelLengths, 12)
    : 12;
  const maxValueLength = valueLengths.length
    ? Math.max(...valueLengths, 16)
    : 16;
  const headerLabelWidth = Math.min(maxLabelLength + 2, 32);
  const headerValueWidth = Math.min(maxValueLength + 2, 50);

  const lineItemWidths = visibleColumns.map((column) => ({
    wch: widthByColumnId[column.id] ?? Math.max(column.label.length + 2, 12),
  }));

  if (lineItemWidths.length < totalColumns) {
    while (lineItemWidths.length < totalColumns) {
      lineItemWidths.push({ wch: 12 });
    }
  }

  if (includeHeader && headerRows.length > 0) {
    lineItemWidths[0] = {
      wch: Math.max(lineItemWidths[0]?.wch ?? 12, headerLabelWidth),
    };
    lineItemWidths[1] = {
      wch: Math.max(lineItemWidths[1]?.wch ?? 16, headerValueWidth),
    };
  }

  worksheet['!cols'] = lineItemWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

  const baseName =
    filename || `${ENTITY_TYPE_LABELS[entityType]}_${entityNumber || 'Export'}`;
  const fullName = baseName.endsWith('.xlsx')
    ? baseName
    : `${baseName}.xlsx`;
  XLSX.writeFile(workbook, fullName, { bookType: 'xlsx', cellStyles: true });
}
