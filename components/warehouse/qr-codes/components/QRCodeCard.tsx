'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { LocationWithPath, PrintFormat } from '../types';
import { levelColors, levelLabels } from '../constants';
import { generateQRCodeValue, getPreviewQRSize, getPreviewLabelSize, getQRCodeSize } from '../utils';

interface QRCodeCardProps {
  location: LocationWithPath;
  format: PrintFormat;
  warehouseName?: string;
}

export default function QRCodeCard({ location, format, warehouseName }: QRCodeCardProps) {
  const qrValue = generateQRCodeValue({
    locationId: location.id,
    locationName: location.name,
    path: location.path,
    warehouseName,
  });

  const qrSize = getQRCodeSize(format);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-3 flex flex-col items-center hover:shadow-md transition-shadow">
      {/* QR Code */}
      <div
        className={`bg-white rounded flex items-center justify-center mb-2 p-1 ${getPreviewQRSize(format)}`}
      >
        <QRCodeSVG
          value={qrValue}
          size={qrSize}
          level="M"
          includeMargin={false}
          className="w-full h-full"
        />
      </div>

      {/* Location info */}
      <div className="text-center w-full">
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${levelColors[location.type]}`}
        >
          {levelLabels[location.type]}
        </span>
        <div className={`font-medium text-[var(--foreground)] truncate ${getPreviewLabelSize(format)}`}>
          {location.name}
        </div>
        {format !== 'labels-80' && (
          <div className="text-[10px] text-[var(--muted-foreground)] truncate">{location.path}</div>
        )}
      </div>
    </div>
  );
}
