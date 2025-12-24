'use client';

import React, { useRef } from 'react';
import type { WarehouseQRCodesModalProps } from './types';
import { printFormats } from './constants';
import { buildLocationList } from './utils';
import { useLocationFiltering, usePrintQRCodes } from './hooks';
import { QRCodeToolbar, QRCodeGrid } from './components';

export default function WarehouseQRCodesModal({
  isOpen,
  onClose,
  warehouseId,
  warehouseName,
  locationLevels,
}: WarehouseQRCodesModalProps) {
  const printRef = useRef<HTMLDivElement>(null!);

  const enabledLevels = locationLevels.filter((l) => l.enabled).map((l) => l.level);

  // Build flat list of all locations with paths
  const locations = buildLocationList(warehouseId, enabledLevels);

  // Filtering hook
  const {
    selectedFormat,
    setSelectedFormat,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    filteredLocations,
  } = useLocationFiltering({ locations });

  // Print hook
  const { handlePrint } = usePrintQRCodes({
    locations: filteredLocations,
    format: selectedFormat,
    warehouseName,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">QR Codes</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {warehouseName} - {filteredLocations.length} locations
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <QRCodeToolbar
          searchQuery={searchQuery}
          filterType={filterType}
          selectedFormat={selectedFormat}
          enabledLevels={enabledLevels}
          onSearchQueryChange={setSearchQuery}
          onFilterTypeChange={setFilterType}
          onFormatChange={setSelectedFormat}
          onPrint={handlePrint}
        />

        {/* Format description */}
        <div className="px-5 py-2 text-xs text-[var(--muted-foreground)] bg-[var(--background)] border-b border-[var(--border)]">
          {printFormats.find((f) => f.id === selectedFormat)?.description} -{' '}
          {printFormats.find((f) => f.id === selectedFormat)?.perPage} per page
        </div>

        {/* QR Code Grid */}
        <QRCodeGrid locations={filteredLocations} format={selectedFormat} printRef={printRef} />

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
