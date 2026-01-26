/**
 * HeaderTopBar Component
 * Top bar with back button, invoice number, and all action buttons/dropdowns
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InvoiceStatus } from '@/lib/types/rms';
import type { ViewMode, VersionInfo, ColumnKey, EditableInvoice } from '../../types';
import { invoiceStatusLabels } from '../../constants';
import { isOverdue } from '../../utils';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';
import { PDFBuilder } from '@/components/shared/pdf-builder';
import { ExcelBuilder } from '@/components/shared/excel-builder';
import { ManufacturerExcelModal } from '@/components/shared/manufacturer-excel';

interface HeaderTopBarProps {
  invoice: EditableInvoice;
  // Dropdowns state
  showActionsDropdown: boolean;
  setShowActionsDropdown: (show: boolean) => void;
  showStatusDropdown: boolean;
  setShowStatusDropdown: (show: boolean) => void;
  showVersionDropdown: boolean;
  setShowVersionDropdown: (show: boolean) => void;
  showViewModeDropdown: boolean;
  setShowViewModeDropdown: (show: boolean) => void;
  showSaveDropdown: boolean;
  setShowSaveDropdown: (show: boolean) => void;
  // Version
  currentVersion: number;
  setCurrentVersion: (version: number) => void;
  availableVersions: VersionInfo[];
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setVisibleColumns: (columns: Set<ColumnKey>) => void;
  // Actions
  updateInvoiceStatus: (status: InvoiceStatus) => void;
  handleMakeWarehouseOrder: () => void;
  handleGeneratePDF?: () => void;
  handleSave?: () => void;
  handleSaveAsNew?: () => void;
  onDelete?: () => void;
  // Unsaved changes
  isCreateMode?: boolean;
  hasChanges?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
}

const getStatusColor = (status: InvoiceStatus) => {
  const colors: Record<InvoiceStatus, string> = {
    open: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partial_paid: 'bg-yellow-100 text-yellow-700',
    void: 'bg-gray-100 text-gray-700',
    dormant: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || colors.open;
};

export function HeaderTopBar({
  invoice,
  showActionsDropdown,
  setShowActionsDropdown,
  showStatusDropdown,
  setShowStatusDropdown,
  showVersionDropdown,
  setShowVersionDropdown,
  showViewModeDropdown,
  setShowViewModeDropdown,
  showSaveDropdown,
  setShowSaveDropdown,
  currentVersion,
  setCurrentVersion,
  availableVersions,
  viewMode,
  setViewMode,
  setVisibleColumns,
  updateInvoiceStatus,
  handleMakeWarehouseOrder,
  handleGeneratePDF,
  handleSave,
  handleSaveAsNew,
  onDelete,
  isCreateMode = false,
  hasChanges = false,
  isSaving = false,
  onBack,
}: HeaderTopBarProps) {
  const router = useRouter();
  const overdue = isOverdue(invoice);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/invoices');
    }
  };
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);
  const [showExcelBuilder, setShowExcelBuilder] = useState(false);
  const [showManufacturerExcel, setShowManufacturerExcel] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Simple view columns (default)
  const defaultVisibleColumns: ColumnKey[] = [
    'partNumber',
    'custPartNumber',
    'description',
    'quantity',
    'uom',
    'divisor',
    'unitPrice',
    'sellTotal',
    'commissionPercent',
    'commission',
    'commissionTotal',
    'linkedOrder',
    'linkedCheck',
  ];

  // Overage view columns
  const overageColumns: ColumnKey[] = [
    'quantity',
    'uom',
    'unitPrice',
    'percentOver',
    'sellTotal',
    'commissionPercent',
    'commissionAmount',
    'ovgPercent',
    'ovgAmount',
    'earnPercent',
    'earnAmount',
  ];

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Back to Invoices"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              {invoice.invoiceNumber}
            </h1>
            <CreatedByBadge
              createdBy={(invoice as any).createdBy}
              createdAt={(invoice as any).createdAt}
              size="sm"
            />
            {overdue && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                Overdue
              </span>
            )}
            {invoice.isLocked && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Locked
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowActionsDropdown(!showActionsDropdown);
                setShowStatusDropdown(false);
                setShowSaveDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Actions
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 8l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showActionsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionsDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {invoice.orderId ? (
                    <>
                      <button
                        onClick={() => {
                          router.push(`/orders/${invoice.orderId}`);
                          setShowActionsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M13 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13 2v5h5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        View Order
                      </button>
                      <div className="border-t border-[var(--border)]" />
                      <button
                        disabled
                        className="w-full px-4 py-2 text-left text-sm flex items-center justify-between opacity-50 cursor-not-allowed text-gray-500"
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M3 7h14l-1.5 9H4.5L3 7z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Make Warehouse Order
                        </span>
                        <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                          Coming Soon
                        </span>
                      </button>
                      <div className="border-t border-[var(--border)]" />
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          onDelete?.();
                        }}
                        disabled={isCreateMode || !invoice.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M5 5h10M8 5V3h4v2M6 8v8a1 1 0 001 1h6a1 1 0 001-1V8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Delete Invoice
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          alert('Create order from invoice');
                          setShowActionsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M10 5v10M5 10h10"
                            strokeLinecap="round"
                          />
                        </svg>
                        Create Order
                      </button>
                      <button
                        onClick={() => {
                          alert('Connect to existing order');
                          setShowActionsDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M8 6h8M8 10h8M8 14h8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M4 6h.01M4 10h.01M4 14h.01"
                            strokeLinecap="round"
                          />
                        </svg>
                        Connect to Order
                      </button>
                      <div className="border-t border-[var(--border)]" />
                      <button
                        disabled
                        className="w-full px-4 py-2 text-left text-sm flex items-center justify-between opacity-50 cursor-not-allowed text-gray-500"
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M3 7h14l-1.5 9H4.5L3 7z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Make Warehouse Order
                        </span>
                        <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                          Coming Soon
                        </span>
                      </button>
                      <div className="border-t border-[var(--border)]" />
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          onDelete?.();
                        }}
                        disabled={isCreateMode || !invoice.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M5 5h10M8 5V3h4v2M6 8v8a1 1 0 001 1h6a1 1 0 001-1V8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Delete Invoice
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status Display (read-only) */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(
              invoice.status
            )}`}
          >
            {invoiceStatusLabels[invoice.status]}
          </div>

          {/* Version Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVersionDropdown(!showVersionDropdown);
                setShowActionsDropdown(false);
                setShowStatusDropdown(false);
                setShowSaveDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              v{currentVersion}
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 8l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showVersionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowVersionDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {availableVersions.map((v) => (
                    <button
                      key={v.version}
                      onClick={() => {
                        if (v.version === 1) return; // Disable v1
                        setCurrentVersion(v.version);
                        setShowVersionDropdown(false);
                      }}
                      disabled={v.version === 1}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        v.version === 1
                          ? 'opacity-50 cursor-not-allowed text-gray-500'
                          : currentVersion === v.version
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'hover:bg-[var(--muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>v{v.version}</span>
                        {v.isLatest && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Latest
                          </span>
                        )}
                        {v.version === 1 && (
                          <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {v.date}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowViewModeDropdown(!showViewModeDropdown);
                setShowActionsDropdown(false);
                setShowStatusDropdown(false);
                setShowVersionDropdown(false);
                setShowSaveDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="10" r="3" />
              </svg>
              {viewMode === 'simple' ? 'Simple View' : 'Overage View'}
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 8l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showViewModeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowViewModeDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      setViewMode('simple');
                      setVisibleColumns(new Set(defaultVisibleColumns));
                      setShowViewModeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center justify-between ${
                      viewMode === 'simple'
                        ? 'text-[var(--primary)] font-medium'
                        : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="14" height="14" rx="2" />
                        <path d="M3 8h14" />
                      </svg>
                      Simple View
                    </span>
                    {viewMode === 'simple' && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          d="M5 10l3 3 7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm rounded-b-lg flex items-center justify-between opacity-50 cursor-not-allowed text-gray-500"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 2v6l4-2-4-2z"
                          fill="currentColor"
                        />
                        <path d="M2 10h16M2 6h8M2 14h12" />
                      </svg>
                      Overage View
                    </span>
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                      Coming Soon
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Excel Button with Manufacturer Dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={() => {
                  setShowDownloadMenu(false);
                  setShowExcelBuilder(true);
                }}
                disabled={!invoice.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-l-lg text-sm font-medium transition-colors ${
                  !invoice.id
                    ? 'bg-emerald-600 text-white opacity-50 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={() => setShowDownloadMenu((prev) => !prev)}
                disabled={!invoice.id}
                className={`px-2 py-2 text-white rounded-r-lg transition-colors border-l border-emerald-500 ${
                  !invoice.id
                    ? 'bg-emerald-600 opacity-50 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                aria-label="Manufacturer options"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setShowManufacturerExcel(true);
                      setShowDownloadMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    Manufacturer Excel
                  </button>
                </div>
              </>
            )}
          </div>
          {/* PDF Button */}
          <button
            onClick={() => {
              setShowDownloadMenu(false);
              setShowPDFBuilder(true);
            }}
            disabled={!invoice.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !invoice.id
                ? 'bg-red-600 text-white opacity-50 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v4h4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round" />
            </svg>
            PDF
          </button>

          {/* Save Button with Dropdown */}
          <div className="relative">
            {/* Unsaved changes indicator */}
            {hasChanges && !isCreateMode && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" title="You have unsaved changes" />
            )}
            <div className="flex">
              <button
                onClick={() => handleSave?.()}
                disabled={isSaving || (!isCreateMode && !hasChanges)}
                className={`px-4 py-2 text-white rounded-l-lg transition-colors text-sm font-medium ${
                  isSaving || (!isCreateMode && !hasChanges)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                title={!isCreateMode && !hasChanges ? 'No changes to save' : undefined}
              >
                {isSaving ? 'Saving...' : isCreateMode ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowSaveDropdown(!showSaveDropdown);
                  setShowActionsDropdown(false);
                  setShowStatusDropdown(false);
                }}
                disabled={isSaving || (!isCreateMode && !hasChanges)}
                className={`px-2 py-2 text-white rounded-r-lg transition-colors border-l border-green-500 ${
                  isSaving || (!isCreateMode && !hasChanges)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {showSaveDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSaveDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      handleSave?.() || alert('Invoice saved!');
                      setShowSaveDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                  >
                    Save
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between opacity-50 cursor-not-allowed text-gray-500"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M10 5v10M5 10h10"
                          strokeLinecap="round"
                        />
                      </svg>
                      Save as New Version
                    </span>
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                      Coming Soon
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Builder */}
      <PDFBuilder
        entityId={invoice.id}
        entityType="INVOICES"
        isOpen={showPDFBuilder}
        onClose={() => setShowPDFBuilder(false)}
      />

      {/* Excel Builder */}
      <ExcelBuilder
        entityId={invoice.id}
        entityType="INVOICES"
        isOpen={showExcelBuilder}
        onClose={() => setShowExcelBuilder(false)}
      />

      <ManufacturerExcelModal
        entityId={invoice.id}
        entityType="INVOICES"
        isOpen={showManufacturerExcel}
        onClose={() => setShowManufacturerExcel(false)}
      />
    </div>
  );
}

