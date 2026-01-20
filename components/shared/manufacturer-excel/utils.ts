/**
 * Manufacturer Excel Exporters
 * Template-specific export logic using xlsx-js-style
 */

import type { WorkSheet } from 'xlsx';
import type { PDFEntityType, PDFEntityData, PDFQuote } from '@/components/lib/graphql/pdf-entities';
import { ENTITY_TYPE_LABELS } from '@/components/shared/excel-builder/types';
import type { ManufacturerTemplateId } from './types';

type ExcelCellStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number };
  fill?: { fgColor?: { rgb: string }; patternType?: 'solid' };
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
  border: 'FFCBD5E1',
  headerFill: 'FFF3F4F6',
  text: 'FF111827',
};

const thinBorder = {
  top: { style: 'thin', color: { rgb: COLORS.border } },
  bottom: { style: 'thin', color: { rgb: COLORS.border } },
  left: { style: 'thin', color: { rgb: COLORS.border } },
  right: { style: 'thin', color: { rgb: COLORS.border } },
};

const solidFill = (rgb: string) => ({
  patternType: 'solid' as const,
  fgColor: { rgb },
});

const setCellStyle = (worksheet: WorkSheet, XLSX: any, row: number, col: number, style: ExcelCellStyle) => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellAddress];
  if (!cell) return;
  cell.s = { ...(cell.s || {}), ...style };
};

const setCellNumberFormat = (worksheet: WorkSheet, XLSX: any, row: number, col: number, format: string) => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellAddress];
  if (!cell) return;
  cell.z = format;
};

function buildAmmoInternationalRows(entity: PDFQuote) {
  const headerRow = [
    'LINE #',
    'QUANTITY',
    'AMMO CATALOG NUMBER',
    'REQUESTED NET',
    'NET PER',
    'UOM',
    'VALID CATALOG NUMBER',
  ];

  const lineRows = (entity.details || []).map((detail, index) => {
    const quantity = Number(detail.quantity ?? 0);
    const unitPrice = Number(detail.unitPrice ?? 0);
    const lineTotal = Number(detail.total ?? quantity * unitPrice);
    const catalogNumber =
      detail.productNameAdhoc ||
      detail.product?.factoryPartNumber ||
      '-';
    const isValid = Boolean(detail.productId || detail.product?.id);

    return [
      detail.itemNumber ?? index + 1,
      quantity,
      catalogNumber,
      lineTotal,
      unitPrice,
      detail.uom?.title || 'EA',
      isValid ? 'Valid' : 'Invalid',
    ];
  });

  return [headerRow, ...lineRows];
}

async function exportAmmoInternationalQuote(entity: PDFQuote, entityNumber: string) {
  const XLSXModule = await import('xlsx-js-style');
  const XLSX = XLSXModule.default ?? XLSXModule;

  const rows = buildAmmoInternationalRows(entity);
  const worksheet = XLSX.utils.aoa_to_sheet(rows) as WorkSheet;

  const headerStyle: ExcelCellStyle = {
    font: { bold: true, color: { rgb: COLORS.text } },
    fill: solidFill(COLORS.headerFill),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  };

  const bodyStyle: ExcelCellStyle = {
    alignment: { vertical: 'top' },
    border: thinBorder,
  };

  const totalColumns = rows[0]?.length || 0;
  for (let col = 0; col < totalColumns; col += 1) {
    setCellStyle(worksheet, XLSX, 0, col, headerStyle);
  }

  for (let row = 1; row < rows.length; row += 1) {
    for (let col = 0; col < totalColumns; col += 1) {
      setCellStyle(worksheet, XLSX, row, col, bodyStyle);
    }
  }

  const numericColumns = {
    quantity: 1,
    requestedNet: 3,
    netPer: 4,
  };

  for (let row = 1; row < rows.length; row += 1) {
    setCellNumberFormat(worksheet, XLSX, row, numericColumns.quantity, '0.####');
    setCellNumberFormat(worksheet, XLSX, row, numericColumns.requestedNet, '0.00');
    setCellNumberFormat(worksheet, XLSX, row, numericColumns.netPer, '0.00');
    setCellStyle(worksheet, XLSX, row, numericColumns.quantity, {
      alignment: { horizontal: 'right', vertical: 'center' },
    });
    setCellStyle(worksheet, XLSX, row, numericColumns.requestedNet, {
      alignment: { horizontal: 'right', vertical: 'center' },
    });
    setCellStyle(worksheet, XLSX, row, numericColumns.netPer, {
      alignment: { horizontal: 'right', vertical: 'center' },
    });
  }

  worksheet['!cols'] = [
    { wch: 8 },  // LINE #
    { wch: 12 }, // QUANTITY
    { wch: 26 }, // AMMO CATALOG NUMBER
    { wch: 16 }, // REQUESTED NET
    { wch: 10 }, // NET PER
    { wch: 8 },  // UOM
    { wch: 22 }, // VALID CATALOG NUMBER
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Manufacturer Export');

  const baseName = `${ENTITY_TYPE_LABELS.QUOTES}_${entityNumber || 'Export'}_Ammo_International`;
  const fileName = baseName.endsWith('.xlsx') ? baseName : `${baseName}.xlsx`;
  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', cellStyles: true });
}

export async function exportManufacturerTemplate(options: {
  templateId: ManufacturerTemplateId;
  entityType: PDFEntityType;
  entityData: PDFEntityData;
}) {
  const { templateId, entityType, entityData } = options;

  if (templateId === 'ammo-international-quote') {
    if (entityType !== 'QUOTES') {
      throw new Error('Ammo International template only supports quotes.');
    }
    const quote = entityData as PDFQuote;
    const entityNumber = quote.quoteNumber || '';
    await exportAmmoInternationalQuote(quote, entityNumber);
    return;
  }

  throw new Error('Unsupported manufacturer template.');
}
