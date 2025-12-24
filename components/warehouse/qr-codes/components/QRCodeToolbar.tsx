'use client';

import React from 'react';
import type { PrintFormat } from '../types';
import { printFormats, levelLabels } from '../constants';

interface QRCodeToolbarProps {
  searchQuery: string;
  filterType: string;
  selectedFormat: PrintFormat;
  enabledLevels: string[];
  onSearchQueryChange: (query: string) => void;
  onFilterTypeChange: (type: string) => void;
  onFormatChange: (format: PrintFormat) => void;
  onPrint: () => void;
}

export default function QRCodeToolbar({
  searchQuery,
  filterType,
  selectedFormat,
  enabledLevels,
  onSearchQueryChange,
  onFilterTypeChange,
  onFormatChange,
  onPrint,
}: QRCodeToolbarProps) {
  return (
    <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center gap-3 bg-[var(--background)]">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter by type */}
      <select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value)}
        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Types</option>
        {enabledLevels.map((level) => (
          <option key={level} value={level}>
            {levelLabels[level]}s
          </option>
        ))}
      </select>

      {/* Print format */}
      <select
        value={selectedFormat}
        onChange={(e) => onFormatChange(e.target.value as PrintFormat)}
        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {printFormats.map((format) => (
          <option key={format.id} value={format.id}>
            {format.name}
          </option>
        ))}
      </select>

      {/* Print button */}
      <button
        onClick={onPrint}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print
      </button>
    </div>
  );
}
