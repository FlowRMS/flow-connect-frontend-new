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
import { formatCurrency, formatDate, formatNumber } from '../pdf-builder/utils';

type ExcelCellStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number };
  fill?: { fgColor?: { rgb: string } };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
    wrapText?: boolean;
  };
};

function formatFieldValue(field: PDFFieldConfig): string {
  const value = field.editedValue ?? field.value;
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
}) {
  if (typeof window === 'undefined') return;
  const XLSXModule = await import('xlsx');
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
  } = options;

  const visibleFields = fields.filter((field) => field.visible);
  const visibleColumns = columns.filter((column) => column.visible);
  const visibleLineItems = lineItems.filter((item) => item.visible);

  // Build header rows (field label + value)
  const headerRows = includeHeader
    ? visibleFields.map((field) => [field.label, formatFieldValue(field)])
    : [];

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
    const grandTotal = visibleLineItems.reduce((sum, item) => {
      const qty = item.editedValues?.quantity ?? item.quantity;
      const price = item.editedValues?.unitPrice ?? item.unitPrice;
      return sum + qty * price;
    }, 0);

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

  const titleText = entityNumber
    ? `${ENTITY_TYPE_LABELS[entityType]} # ${entityNumber}`
    : ENTITY_TYPE_LABELS[entityType];

  // Build sheet rows
  const sheetRows: (string | number)[][] = [
    [titleText],
    ...headerRows,
  ];

  // Add empty row before line items if we have header
  if (includeHeader && headerRows.length > 0) {
    sheetRows.push([]);
  }

  sheetRows.push(lineItemHeaderRow);
  sheetRows.push(...lineItemRows);

  if (includeTotals && totalsRow.length > 0) {
    sheetRows.push(totalsRow);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows) as WorkSheet;
  const totalColumns = Math.max(2, lineItemHeaderRow.length);

  // Merge title row
  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: totalColumns - 1 },
    },
  ];

  // Calculate row indices
  const headerStartRow = 1;
  const headerRowCount = headerRows.length;
  const emptyRowAfterHeader = includeHeader && headerRowCount > 0 ? 1 : 0;
  const lineItemHeaderRowIndex = headerStartRow + headerRowCount + emptyRowAfterHeader;
  const lineItemsStartRow = lineItemHeaderRowIndex + 1;
  const totalsRowIndex = lineItemsStartRow + lineItemRows.length;

  const setCellStyle = (row: number, col: number, style: ExcelCellStyle) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (!cell) return;
    const existingStyle = (cell.s || {}) as ExcelCellStyle;
    cell.s = {
      ...existingStyle,
      ...style,
      font: {
        ...existingStyle.font,
        ...style.font,
      },
      fill: {
        ...existingStyle.fill,
        ...style.fill,
      },
      alignment: {
        ...existingStyle.alignment,
        ...style.alignment,
      },
    };
  };

  const setCellNumberFormat = (row: number, col: number, format: string) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (!cell) return;
    cell.z = format;
  };

  // Style: Title row
  const titleStyle: ExcelCellStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
    fill: { fgColor: { rgb: '1D4ED8' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  setCellStyle(0, 0, titleStyle);

  // Style: Header fields
  for (let row = headerStartRow; row < headerStartRow + headerRowCount; row += 1) {
    setCellStyle(row, 0, {
      font: { bold: true, color: { rgb: '1F2937' } },
      fill: { fgColor: { rgb: 'F3F4F6' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    });
    setCellStyle(row, 1, {
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    });
  }

  // Style: Line items header
  for (let col = 0; col < totalColumns; col += 1) {
    setCellStyle(lineItemHeaderRowIndex, col, {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F2937' } },
      alignment: { horizontal: 'center', vertical: 'center' },
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
  const wrapTextColumns = new Set(['description']);

  for (let rowIndex = 0; rowIndex < lineItemRows.length; rowIndex += 1) {
    const row = lineItemsStartRow + rowIndex;
    const isAlternate = rowIndex % 2 === 1;
    for (let col = 0; col < visibleColumns.length; col += 1) {
      if (isAlternate) {
        setCellStyle(row, col, {
          fill: { fgColor: { rgb: 'F9FAFB' } },
        });
      }
      if (rightAlignedColumns.has(visibleColumns[col]?.id)) {
        setCellStyle(row, col, {
          alignment: { horizontal: 'right', vertical: 'center' },
        });
      }
      if (wrapTextColumns.has(visibleColumns[col]?.id)) {
        setCellStyle(row, col, {
          alignment: { wrapText: true, vertical: 'center' },
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
        font: { bold: true, color: { rgb: '1F2937' } },
        fill: { fgColor: { rgb: 'E5E7EB' } },
        alignment: {
          horizontal: rightAlignedColumns.has(visibleColumns[col]?.id) ? 'right' : 'left',
          vertical: 'center',
        },
      });
      const columnId = visibleColumns[col]?.id;
      if (currencyColumns.has(columnId)) {
        setCellNumberFormat(totalsRowIndex, col, '$#,##0.00');
      } else if (quantityColumns.has(columnId)) {
        setCellNumberFormat(totalsRowIndex, col, '0.####');
      }
    }
  }

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

  const labelLengths = visibleFields.map((field) => field.label.length);
  const valueLengths = visibleFields.map((field) =>
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

  lineItemWidths[0] = {
    wch: Math.max(lineItemWidths[0]?.wch ?? 12, headerLabelWidth),
  };
  lineItemWidths[1] = {
    wch: Math.max(lineItemWidths[1]?.wch ?? 16, headerValueWidth),
  };

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
