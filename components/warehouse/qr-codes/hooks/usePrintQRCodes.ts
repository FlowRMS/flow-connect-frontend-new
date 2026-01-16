// Print QR codes hook

import { useCallback } from 'react';
import type { LocationWithPath, PrintFormat } from '../types';
import { printFormats } from '../constants';
import { generateQRCodeValue, generateQRCodeSVG, getQRCodeSize, generatePrintCSS } from '../utils';

interface UsePrintQRCodesProps {
  locations: LocationWithPath[];
  format: PrintFormat;
  warehouseName: string;
}

export function usePrintQRCodes({ locations, format, warehouseName }: UsePrintQRCodesProps) {
  const handlePrint = useCallback(async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSize = getQRCodeSize(format);

    // Generate all QR codes as SVG strings
    const qrCodePromises = locations.map(async (loc) => {
      const qrValue = generateQRCodeValue({
        locationId: loc.id,
        locationName: loc.name,
        path: loc.path,
        warehouseName,
      });
      const svgString = await generateQRCodeSVG(qrValue, qrSize);
      return { location: loc, svg: svgString };
    });

    const qrCodes = await Promise.all(qrCodePromises);

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
            ${qrCodes
              .map(
                ({ location, svg }) => `
              <div class="qr-item">
                <div class="qr-code">${svg}</div>
                <div class="qr-label">${location.name}</div>
                ${format !== 'labels-80' ? `<div class="qr-path">${location.path}</div>` : ''}
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
