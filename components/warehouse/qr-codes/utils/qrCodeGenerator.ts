// QR code generation utilities using qrcode.react and qrcode

import * as QRCode from 'qrcode';
import type { PrintFormat } from '../types';

/**
 * QR code data structure for location encoding
 */
export interface QRCodeData {
  locationId: string;
  locationName: string;
  path: string;
  warehouseName?: string;
}

/**
 * Generate the data to encode in the QR code
 * Format: JSON string with location details
 */
export function generateQRCodeValue(data: QRCodeData): string {
  return JSON.stringify({
    id: data.locationId,
    name: data.locationName,
    path: data.path,
    warehouse: data.warehouseName,
    type: 'warehouse_location',
  });
}

/**
 * Generate QR code as SVG string for printing
 * Returns a promise that resolves to an SVG string
 */
export async function generateQRCodeSVG(value: string, size: number): Promise<string> {
  return QRCode.toString(value, {
    type: 'svg',
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Get QR code size based on print format (in pixels)
 */
export function getQRCodeSize(format: PrintFormat): number {
  switch (format) {
    case 'sheet-small':
      return 80;
    case 'sheet-medium':
      return 120;
    case 'sheet-large':
      return 160;
    case 'labels-30':
      return 60;
    case 'labels-80':
      return 40;
    default:
      return 100;
  }
}

/**
 * Get preview QR code size class
 */
export function getPreviewQRSize(format: PrintFormat): string {
  switch (format) {
    case 'sheet-small':
      return 'w-16 h-16';
    case 'sheet-medium':
      return 'w-20 h-20';
    case 'sheet-large':
      return 'w-24 h-24';
    case 'labels-30':
      return 'w-14 h-14';
    case 'labels-80':
      return 'w-10 h-10';
    default:
      return 'w-16 h-16';
  }
}

/**
 * Get preview label size class
 */
export function getPreviewLabelSize(format: PrintFormat): string {
  switch (format) {
    case 'sheet-small':
    case 'labels-30':
      return 'text-xs';
    case 'sheet-medium':
      return 'text-sm';
    case 'sheet-large':
      return 'text-base';
    case 'labels-80':
      return 'text-[10px]';
    default:
      return 'text-xs';
  }
}
