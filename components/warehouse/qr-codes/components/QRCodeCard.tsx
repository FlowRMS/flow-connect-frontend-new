'use client';

import React from 'react';
import type { LocationWithPath, PrintFormat } from '../types';
import { levelColors, levelLabels } from '../constants';
import { generateQRPatternSVG, getPreviewQRSize, getPreviewLabelSize } from '../utils';

interface QRCodeCardProps {
  location: LocationWithPath;
  format: PrintFormat;
}

export default function QRCodeCard({ location, format }: QRCodeCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-3 flex flex-col items-center hover:shadow-md transition-shadow">
      {/* QR Code */}
      <div
        className={`bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mb-2 ${getPreviewQRSize(format)}`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {generateQRPatternSVG(location.id)}
        </svg>
      </div>

      {/* Location info */}
      <div className="text-center w-full">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${levelColors[location.type]}`}>
          {levelLabels[location.type]}
        </span>
        <div className={`font-medium text-[var(--foreground)] truncate ${getPreviewLabelSize(format)}`}>{location.name}</div>
        {format !== 'labels-80' && <div className="text-[10px] text-[var(--muted-foreground)] truncate">{location.path}</div>}
      </div>
    </div>
  );
}
