'use client';

import React, { useState, useRef } from 'react';
import { WarehouseLocationLevelConfig } from '@/lib/types/warehouse';
import {
  mockSections,
  mockAisles,
  mockShelves,
  mockBays,
  mockRows,
  mockBins,
} from '@/lib/data/warehouse-mock';

interface LocationWithPath {
  id: string;
  name: string;
  type: string;
  path: string;
  fullPath: string[];
}

type PrintFormat = 'sheet-small' | 'sheet-medium' | 'sheet-large' | 'labels-30' | 'labels-80';

const printFormats: { id: PrintFormat; name: string; description: string; perPage: number }[] = [
  { id: 'labels-80', name: 'Small Labels (80/page)', description: 'Avery 5267 - 0.5" x 1.75"', perPage: 80 },
  { id: 'labels-30', name: 'Address Labels (30/page)', description: 'Avery 5160 - 1" x 2.625"', perPage: 30 },
  { id: 'sheet-small', name: 'Small Grid (24/page)', description: '1.5" x 1.5" codes', perPage: 24 },
  { id: 'sheet-medium', name: 'Medium Grid (12/page)', description: '2" x 2" codes with labels', perPage: 12 },
  { id: 'sheet-large', name: 'Large Grid (6/page)', description: '3" x 3" codes with full path', perPage: 6 },
];

const levelLabels: Record<string, string> = {
  section: 'Section',
  aisle: 'Aisle',
  shelf: 'Shelf',
  bay: 'Bay',
  row: 'Row',
  bin: 'Bin',
};

const levelColors: Record<string, string> = {
  section: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  aisle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shelf: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  bay: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  row: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  bin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface WarehouseQRCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  warehouseName: string;
  locationLevels: WarehouseLocationLevelConfig[];
}

export default function WarehouseQRCodesModal({
  isOpen,
  onClose,
  warehouseId,
  warehouseName,
  locationLevels,
}: WarehouseQRCodesModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<PrintFormat>('sheet-medium');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const enabledLevels = locationLevels.filter(l => l.enabled).map(l => l.level);

  // Build flat list of all locations with paths
  const locations = buildLocationList(warehouseId, enabledLevels);

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    const matchesType = filterType === 'all' || loc.type === filterType;
    const matchesSearch = searchQuery === '' ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handlePrint = () => {
    const printContent = document.getElementById('qr-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const format = printFormats.find(f => f.id === selectedFormat);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - ${warehouseName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            @page { margin: 0.5in; }

            .print-grid {
              display: grid;
              gap: 4px;
              ${selectedFormat === 'labels-80' ? 'grid-template-columns: repeat(4, 1fr);' : ''}
              ${selectedFormat === 'labels-30' ? 'grid-template-columns: repeat(3, 1fr);' : ''}
              ${selectedFormat === 'sheet-small' ? 'grid-template-columns: repeat(6, 1fr);' : ''}
              ${selectedFormat === 'sheet-medium' ? 'grid-template-columns: repeat(4, 1fr);' : ''}
              ${selectedFormat === 'sheet-large' ? 'grid-template-columns: repeat(3, 1fr);' : ''}
            }

            .qr-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e7eb;
              padding: 4px;
              page-break-inside: avoid;
              ${selectedFormat === 'labels-80' ? 'height: 0.5in; padding: 2px;' : ''}
              ${selectedFormat === 'labels-30' ? 'height: 1in;' : ''}
              ${selectedFormat === 'sheet-small' ? 'height: 1.5in;' : ''}
              ${selectedFormat === 'sheet-medium' ? 'height: 2in;' : ''}
              ${selectedFormat === 'sheet-large' ? 'height: 3in;' : ''}
            }

            .qr-code {
              ${selectedFormat === 'labels-80' ? 'width: 28px; height: 28px;' : ''}
              ${selectedFormat === 'labels-30' ? 'width: 48px; height: 48px;' : ''}
              ${selectedFormat === 'sheet-small' ? 'width: 64px; height: 64px;' : ''}
              ${selectedFormat === 'sheet-medium' ? 'width: 80px; height: 80px;' : ''}
              ${selectedFormat === 'sheet-large' ? 'width: 120px; height: 120px;' : ''}
            }

            .qr-label {
              text-align: center;
              margin-top: 2px;
              ${selectedFormat === 'labels-80' ? 'font-size: 6px; line-height: 1;' : ''}
              ${selectedFormat === 'labels-30' ? 'font-size: 8px;' : ''}
              ${selectedFormat === 'sheet-small' ? 'font-size: 9px;' : ''}
              ${selectedFormat === 'sheet-medium' ? 'font-size: 10px;' : ''}
              ${selectedFormat === 'sheet-large' ? 'font-size: 12px;' : ''}
            }

            .qr-path {
              color: #6b7280;
              ${selectedFormat === 'labels-80' ? 'display: none;' : ''}
              ${selectedFormat === 'labels-30' ? 'font-size: 7px;' : ''}
              ${selectedFormat === 'sheet-small' ? 'font-size: 7px;' : ''}
              ${selectedFormat === 'sheet-medium' ? 'font-size: 8px;' : ''}
              ${selectedFormat === 'sheet-large' ? 'font-size: 10px;' : ''}
            }

            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">
            ${filteredLocations.map(loc => `
              <div class="qr-item">
                <svg class="qr-code" viewBox="0 0 100 100">
                  ${generateQRPattern(loc.id)}
                </svg>
                <div class="qr-label">${loc.name}</div>
                ${selectedFormat !== 'labels-80' ? `<div class="qr-path">${loc.path}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">QR Codes</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{warehouseName} - {filteredLocations.length} locations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center gap-3 bg-[var(--background)]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {enabledLevels.map(level => (
              <option key={level} value={level}>{levelLabels[level]}s</option>
            ))}
          </select>

          {/* Print format */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as PrintFormat)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {printFormats.map(format => (
              <option key={format.id} value={format.id}>{format.name}</option>
            ))}
          </select>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>

        {/* Format description */}
        <div className="px-5 py-2 text-xs text-[var(--muted-foreground)] bg-[var(--background)] border-b border-[var(--border)]">
          {printFormats.find(f => f.id === selectedFormat)?.description} - {printFormats.find(f => f.id === selectedFormat)?.perPage} per page
        </div>

        {/* QR Code Grid */}
        <div className="flex-1 overflow-y-auto p-5" ref={printRef}>
          <div id="qr-print-content" className={`grid gap-3 ${
            selectedFormat === 'labels-80' ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10' :
            selectedFormat === 'labels-30' ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6' :
            selectedFormat === 'sheet-small' ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6' :
            selectedFormat === 'sheet-medium' ? 'grid-cols-3 sm:grid-cols-4' :
            'grid-cols-2 sm:grid-cols-3'
          }`}>
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-3 flex flex-col items-center hover:shadow-md transition-shadow"
              >
                {/* QR Code Placeholder */}
                <div className={`bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mb-2 ${
                  selectedFormat === 'labels-80' ? 'w-10 h-10' :
                  selectedFormat === 'labels-30' ? 'w-14 h-14' :
                  selectedFormat === 'sheet-small' ? 'w-16 h-16' :
                  selectedFormat === 'sheet-medium' ? 'w-20 h-20' :
                  'w-28 h-28'
                }`}>
                  <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    {generateQRPatternSVG(location.id)}
                  </svg>
                </div>

                {/* Location info */}
                <div className="text-center w-full">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${levelColors[location.type]}`}>
                    {levelLabels[location.type]}
                  </span>
                  <div className={`font-medium text-[var(--foreground)] truncate ${
                    selectedFormat === 'labels-80' ? 'text-[10px]' : 'text-xs'
                  }`}>
                    {location.name}
                  </div>
                  {selectedFormat !== 'labels-80' && (
                    <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {location.path}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] opacity-50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm text-[var(--muted-foreground)]">No locations found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
          <div className="text-sm text-[var(--muted-foreground)]">
            {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Build flat list of all locations
function buildLocationList(warehouseId: string, enabledLevels: string[]): LocationWithPath[] {
  const locations: LocationWithPath[] = [];

  const sections = mockSections.filter(s => s.warehouseId === warehouseId);

  for (const section of sections) {
    if (enabledLevels.includes('section')) {
      locations.push({
        id: section.id,
        name: section.name,
        type: 'section',
        path: section.name,
        fullPath: [section.name],
      });
    }

    const aisles = mockAisles.filter(a => a.sectionId === section.id);
    for (const aisle of aisles) {
      if (enabledLevels.includes('aisle')) {
        locations.push({
          id: aisle.id,
          name: aisle.name,
          type: 'aisle',
          path: `${section.name} > ${aisle.name}`,
          fullPath: [section.name, aisle.name],
        });
      }

      const shelves = mockShelves.filter(s => s.aisleId === aisle.id);
      for (const shelf of shelves) {
        if (enabledLevels.includes('shelf')) {
          locations.push({
            id: shelf.id,
            name: shelf.name,
            type: 'shelf',
            path: `${section.name} > ${aisle.name} > ${shelf.name}`,
            fullPath: [section.name, aisle.name, shelf.name],
          });
        }

        const bays = mockBays.filter(b => b.shelfId === shelf.id);
        for (const bay of bays) {
          if (enabledLevels.includes('bay')) {
            locations.push({
              id: bay.id,
              name: bay.code,
              type: 'bay',
              path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code}`,
              fullPath: [section.name, aisle.name, shelf.name, bay.code],
            });
          }

          const rows = mockRows.filter(r => r.bayId === bay.id);
          for (const row of rows) {
            if (enabledLevels.includes('row')) {
              locations.push({
                id: row.id,
                name: `Row ${row.rowNumber}`,
                type: 'row',
                path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code} > Row ${row.rowNumber}`,
                fullPath: [section.name, aisle.name, shelf.name, bay.code, `Row ${row.rowNumber}`],
              });
            }

            const bins = mockBins.filter(b => b.rowId === row.id);
            for (const bin of bins) {
              if (enabledLevels.includes('bin')) {
                locations.push({
                  id: bin.id,
                  name: `Bin ${bin.letterCode}`,
                  type: 'bin',
                  path: `${section.name} > ${aisle.name} > ${shelf.name} > ${bay.code} > Row ${row.rowNumber} > Bin ${bin.letterCode}`,
                  fullPath: [section.name, aisle.name, shelf.name, bay.code, `Row ${row.rowNumber}`, `Bin ${bin.letterCode}`],
                });
              }
            }
          }
        }
      }
    }
  }

  return locations;
}

// Generate a deterministic QR-like pattern based on ID (for visual representation)
function generateQRPattern(id: string): string {
  const hash = hashCode(id);
  let svg = '';

  // Corner markers
  svg += `<rect x="5" y="5" width="20" height="20" fill="black"/>`;
  svg += `<rect x="8" y="8" width="14" height="14" fill="white"/>`;
  svg += `<rect x="11" y="11" width="8" height="8" fill="black"/>`;

  svg += `<rect x="75" y="5" width="20" height="20" fill="black"/>`;
  svg += `<rect x="78" y="8" width="14" height="14" fill="white"/>`;
  svg += `<rect x="81" y="11" width="8" height="8" fill="black"/>`;

  svg += `<rect x="5" y="75" width="20" height="20" fill="black"/>`;
  svg += `<rect x="8" y="78" width="14" height="14" fill="white"/>`;
  svg += `<rect x="11" y="81" width="8" height="8" fill="black"/>`;

  // Data pattern based on hash
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (hash >> (i * 8 + j)) & 1;
      if (bit || ((i + j) % 3 === 0)) {
        const x = 30 + i * 5;
        const y = 30 + j * 5;
        svg += `<rect x="${x}" y="${y}" width="4" height="4" fill="black"/>`;
      }
    }
  }

  return svg;
}

function generateQRPatternSVG(id: string): React.ReactNode {
  const hash = hashCode(id);
  const elements: React.ReactNode[] = [];

  // Corner markers
  elements.push(<rect key="c1" x="5" y="5" width="20" height="20" fill="currentColor"/>);
  elements.push(<rect key="c1w" x="8" y="8" width="14" height="14" fill="white"/>);
  elements.push(<rect key="c1b" x="11" y="11" width="8" height="8" fill="currentColor"/>);

  elements.push(<rect key="c2" x="75" y="5" width="20" height="20" fill="currentColor"/>);
  elements.push(<rect key="c2w" x="78" y="8" width="14" height="14" fill="white"/>);
  elements.push(<rect key="c2b" x="81" y="11" width="8" height="8" fill="currentColor"/>);

  elements.push(<rect key="c3" x="5" y="75" width="20" height="20" fill="currentColor"/>);
  elements.push(<rect key="c3w" x="8" y="78" width="14" height="14" fill="white"/>);
  elements.push(<rect key="c3b" x="11" y="81" width="8" height="8" fill="currentColor"/>);

  // Data pattern
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const bit = (hash >> (i * 8 + j)) & 1;
      if (bit || ((i + j) % 3 === 0)) {
        const x = 30 + i * 5;
        const y = 30 + j * 5;
        elements.push(<rect key={`d${i}${j}`} x={x} y={y} width="4" height="4" fill="currentColor"/>);
      }
    }
  }

  return <>{elements}</>;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
