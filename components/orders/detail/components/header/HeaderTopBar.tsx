/**
 * HeaderTopBar Component
 * Top bar with back button, order number, and all action buttons/dropdowns
 */

import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types/rms';
import type { ViewMode, VersionInfo } from '../../types';
import { orderStatusLabels } from '../../constants';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';

interface HeaderTopBarProps {
  order: Order;
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
  setAvailableVersions: (versions: VersionInfo[]) => void;
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setVisibleColumns: (columns: any) => void;
  setActiveView: (view: string) => void;
  // Actions
  onSave: () => void;
  isCreateMode?: boolean;
  updateOrderStatus: (status: Order['status']) => void;
  setShowQuoteLookupModal: (show: boolean) => void;
  handleMakeWarehouseOrder: () => void;
  handleGenerateFulfillmentRequest: () => void;
  onCreateInvoice?: () => void;
  onDuplicateOrder?: () => void;
}

const getStatusColor = (status: Order['status']) => {
  const colors: Record<Order['status'], string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    PARTIAL_SHIPPED: 'bg-yellow-100 text-yellow-700',
    SHIPPED_COMPLETE: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    OVER_SHIPPED: 'bg-orange-100 text-orange-700',
    PARTIAL_CANCELLED: 'bg-red-100 text-red-600',
    OVER_CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.OPEN;
};

export function HeaderTopBar({
  order,
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
  setAvailableVersions,
  viewMode,
  setViewMode,
  setVisibleColumns,
  setActiveView,
  onSave,
  isCreateMode = false,
  updateOrderStatus,
  setShowQuoteLookupModal,
  handleMakeWarehouseOrder,
  handleGenerateFulfillmentRequest,
  onCreateInvoice,
  onDuplicateOrder,
}: HeaderTopBarProps) {
  const router = useRouter();

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/orders')}
              className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Back to Orders"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{order.orderNumber}</h1>
            <CreatedByBadge
              createdBy={order.createdBy}
              createdAt={order.createdAt}
              size="sm"
            />
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
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showActionsDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    onCreateInvoice?.();
                  }}
                  disabled={isCreateMode || !order.id}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Create Invoice
                </button>
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    onDuplicateOrder?.();
                  }}
                  disabled={isCreateMode || !order.id}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                    <path d="M4 14V4a2 2 0 012-2h10"/>
                  </svg>
                  Duplicate Order
                </button>
                <button
                  disabled
                  className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add New Lines from Quotes
                  <span className="ml-auto px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
                </button>
                <div className="border-t border-[var(--border)]" />
                <button
                  disabled
                  className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h14l-1.5 9H4.5L3 7z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Convert Products to Warehouse
                  <span className="ml-auto px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
                </button>
              </div>
            )}
          </div>

          {/* Fulfillment Request Button */}
          {(order.lineItems || []).some(item => item.isWarehouseConsignment && !item.isCredit) && (
            <button
              onClick={handleGenerateFulfillmentRequest}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12h8M8 16h5" strokeLinecap="round"/>
              </svg>
              Fulfillment Request
            </button>
          )}

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowActionsDropdown(false);
                setShowSaveDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(order.status)}`}
            >
              {orderStatusLabels[order.status]}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                {(['OPEN', 'PARTIAL_SHIPPED', 'SHIPPED_COMPLETE', 'CANCELLED', 'OVER_SHIPPED', 'PARTIAL_CANCELLED', 'OVER_CANCELLED'] as Order['status'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateOrderStatus(status);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                      order.status === status ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                    }`}
                  >
                    {orderStatusLabels[status]}
                    {order.status === status && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version Dropdown */}
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
            >
              v{currentVersion}
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
            </button>
          </div>

          {/* View Mode Dropdown */}
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="3"/>
              </svg>
              Simple View
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
            </button>
          </div>

          {/* Generate PDF Button */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
            </svg>
            PDF
            <span className="px-1.5 py-0.5 bg-red-400 text-white rounded text-xs">Soon</span>
          </button>

          {/* Save/Create Button with Dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={onSave}
                className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {isCreateMode ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowSaveDropdown(!showSaveDropdown);
                  setShowActionsDropdown(false);
                  setShowStatusDropdown(false);
                }}
                className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {showSaveDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSaveDropdown(false)} />
                <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { onSave(); setShowSaveDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                  >
                    Save
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                    </svg>
                    Save as New Version
                    <span className="ml-auto px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
