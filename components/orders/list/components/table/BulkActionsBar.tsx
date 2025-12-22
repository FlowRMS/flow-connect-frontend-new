/**
 * BulkActionsBar Component
 * Displays when orders are selected, shows count and bulk actions menu
 */

import type { OrderStatus } from '@/lib/types/rms';
import { orderStatusLabels, orderStatusColors } from '../../constants';

interface BulkActionsBarProps {
  selectedCount: number;
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;
  onClearSelection: () => void;
  onBulkSetStatus: (status: OrderStatus) => void;
  onBulkDelete: () => void;
}

export function BulkActionsBar({
  selectedCount,
  showBulkActionsMenu,
  setShowBulkActionsMenu,
  onClearSelection,
  onBulkSetStatus,
  onBulkDelete,
}: BulkActionsBarProps) {
  const orderStatuses: OrderStatus[] = [
    'draft',
    'open',
    'partial_shipped',
    'shipped',
    'cancelled',
    'dormant',
  ];

  return (
    <div className="px-4 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center justify-between">
      <span className="text-sm text-[var(--foreground)]">
        <strong>{selectedCount}</strong> order{selectedCount !== 1 ? 's' : ''}{' '}
        selected
      </span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Bulk Actions
            <svg
              width="14"
              height="14"
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
          {showBulkActionsMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowBulkActionsMenu(false)}
              />
              <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                {/* Set Status submenu */}
                <div className="relative group">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="10" cy="10" r="8" />
                        <path
                          d="M10 6v4l2 2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Set Status
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M8 6l4 4-4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {orderStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => onBulkSetStatus(status)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      >
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${orderStatusColors[status]}`}
                        >
                          {orderStatusLabels[status]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[var(--border)] my-1"></div>
                <button
                  onClick={onBulkDelete}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
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
                      d="M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M5 6v11a2 2 0 002 2h6a2 2 0 002-2V6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
