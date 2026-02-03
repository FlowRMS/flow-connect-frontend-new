/**
 * ExportExcelButton Component
 * Reusable button component for Excel export
 */

'use client';

import { useState } from 'react';
import type { ExportContext, ExportOptions } from './types';
import { useListExport } from './useListExport';

interface ExportExcelButtonProps<T = Record<string, unknown>> {
  context: ExportContext<T>;
  options?: ExportOptions;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  disabled?: boolean;
  /** Fetch ALL records for export (overrides context.data with full dataset) */
  fetchAllData?: () => Promise<Record<string, unknown>[]>;
}

export function ExportExcelButton<T = Record<string, unknown>>({
  context,
  options,
  className = '',
  variant = 'outline',
  size = 'md',
  showIcon = true,
  disabled: externalDisabled,
  fetchAllData,
}: ExportExcelButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const { exportToExcel, exportData, canExport } = useListExport(context, options);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (fetchAllData) {
        // Fetch all records then export with full dataset
        const allData = await fetchAllData();
        await exportData(allData);
      } else {
        await exportToExcel();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const disabled = externalDisabled || (!canExport && !fetchAllData) || isExporting;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
    outline: 'bg-white border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]',
    ghost: 'text-[var(--foreground)] hover:bg-[var(--muted)]',
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className={`
        flex items-center gap-2 rounded-lg font-medium transition-colors
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={disabled ? 'No data to export' : 'Export to Excel'}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          {showIcon && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          <span>Export Excel</span>
        </>
      )}
    </button>
  );
}
