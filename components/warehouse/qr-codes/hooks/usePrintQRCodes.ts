// Print QR codes hook

import { useCallback } from 'react';
import type { LocationWithPath, PrintFormat } from '../types';
import { printFormats } from '../constants';
import { generateQRPattern, generatePrintCSS } from '../utils';

interface UsePrintQRCodesProps {
  locations: LocationWithPath[];
  format: PrintFormat;
  warehouseName: string;
}

export function usePrintQRCodes({ locations, format, warehouseName }: UsePrintQRCodesProps) {
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatConfig = printFormats.find((f) => f.id === format);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - ${warehouseName}</title>
          <style>
            ${generatePrintCSS(format)}
          </style>
        </head>
        <body>
          <div class="print-grid">
            ${locations
              .map(
                (loc) => `
              <div class="qr-item">
                <svg class="qr-code" viewBox="0 0 100 100">
                  ${generateQRPattern(loc.id)}
                </svg>
                <div class="qr-label">${loc.name}</div>
                ${format !== 'labels-80' ? `<div class="qr-path">${loc.path}</div>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [locations, format, warehouseName]);

  return { handlePrint };
}
