// Print styles generation utilities

import type { PrintFormat } from '../types';

/**
 * Generate CSS styles for print layout based on format
 */
export function generatePrintCSS(format: PrintFormat): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @page { margin: 0.5in; }

    .print-grid {
      display: grid;
      gap: 4px;
      ${getGridColumns(format)}
    }

    .qr-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      padding: 4px;
      page-break-inside: avoid;
      ${getItemHeight(format)}
    }

    .qr-code {
      ${getQRCodeSize(format)}
    }

    .qr-label {
      text-align: center;
      margin-top: 2px;
      ${getLabelFontSize(format)}
    }

    .qr-path {
      color: #6b7280;
      ${getPathStyles(format)}
    }

    @media print {
      .no-print { display: none !important; }
    }
  `;
}

/**
 * Get grid column configuration for format
 */
function getGridColumns(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'grid-template-columns: repeat(4, 1fr);';
    case 'labels-30':
      return 'grid-template-columns: repeat(3, 1fr);';
    case 'sheet-small':
      return 'grid-template-columns: repeat(6, 1fr);';
    case 'sheet-medium':
      return 'grid-template-columns: repeat(4, 1fr);';
    case 'sheet-large':
      return 'grid-template-columns: repeat(3, 1fr);';
    default:
      return 'grid-template-columns: repeat(3, 1fr);';
  }
}

/**
 * Get item height for format
 */
function getItemHeight(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'height: 0.5in; padding: 2px;';
    case 'labels-30':
      return 'height: 1in;';
    case 'sheet-small':
      return 'height: 1.5in;';
    case 'sheet-medium':
      return 'height: 2in;';
    case 'sheet-large':
      return 'height: 3in;';
    default:
      return 'height: 2in;';
  }
}

/**
 * Get QR code dimensions for format
 */
function getQRCodeSize(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'width: 28px; height: 28px;';
    case 'labels-30':
      return 'width: 48px; height: 48px;';
    case 'sheet-small':
      return 'width: 64px; height: 64px;';
    case 'sheet-medium':
      return 'width: 80px; height: 80px;';
    case 'sheet-large':
      return 'width: 120px; height: 120px;';
    default:
      return 'width: 80px; height: 80px;';
  }
}

/**
 * Get label font size for format
 */
function getLabelFontSize(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'font-size: 6px; line-height: 1;';
    case 'labels-30':
      return 'font-size: 8px;';
    case 'sheet-small':
      return 'font-size: 9px;';
    case 'sheet-medium':
      return 'font-size: 10px;';
    case 'sheet-large':
      return 'font-size: 12px;';
    default:
      return 'font-size: 10px;';
  }
}

/**
 * Get path styles for format
 */
function getPathStyles(format: PrintFormat): string {
  if (format === 'labels-80') {
    return 'display: none;';
  }

  switch (format) {
    case 'labels-30':
      return 'font-size: 7px;';
    case 'sheet-small':
      return 'font-size: 7px;';
    case 'sheet-medium':
      return 'font-size: 8px;';
    case 'sheet-large':
      return 'font-size: 10px;';
    default:
      return 'font-size: 8px;';
  }
}

/**
 * Get grid CSS classes for on-screen preview
 */
export function getPreviewGridClasses(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10';
    case 'labels-30':
      return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6';
    case 'sheet-small':
      return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6';
    case 'sheet-medium':
      return 'grid-cols-3 sm:grid-cols-4';
    case 'sheet-large':
      return 'grid-cols-2 sm:grid-cols-3';
    default:
      return 'grid-cols-3 sm:grid-cols-4';
  }
}

/**
 * Get QR code size classes for on-screen preview
 */
export function getPreviewQRSize(format: PrintFormat): string {
  switch (format) {
    case 'labels-80':
      return 'w-10 h-10';
    case 'labels-30':
      return 'w-14 h-14';
    case 'sheet-small':
      return 'w-16 h-16';
    case 'sheet-medium':
      return 'w-20 h-20';
    case 'sheet-large':
      return 'w-28 h-28';
    default:
      return 'w-20 h-20';
  }
}

/**
 * Get label font size classes for on-screen preview
 */
export function getPreviewLabelSize(format: PrintFormat): string {
  return format === 'labels-80' ? 'text-[10px]' : 'text-xs';
}
