'use client';

import React from 'react';
import type { LocationWithPath, PrintFormat } from '../types';
import QRCodeCard from './QRCodeCard';
import EmptyState from './EmptyState';
import { getPreviewGridClasses } from '../utils';

interface QRCodeGridProps {
  locations: LocationWithPath[];
  format: PrintFormat;
  printRef: React.RefObject<HTMLDivElement>;
}

export default function QRCodeGrid({ locations, format, printRef }: QRCodeGridProps) {
  if (locations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-5" ref={printRef}>
      <div id="qr-print-content" className={`grid gap-3 ${getPreviewGridClasses(format)}`}>
        {locations.map((location) => (
          <QRCodeCard key={location.id} location={location} format={format} />
        ))}
      </div>
    </div>
  );
}
