/**
 * OrdersTableHeader Component
 * Table header with column labels, sorting, and filters
 */

import type { Order } from '@/lib/types/rms';

interface OrdersTableHeaderProps {
  // Selection
  filteredOrders: Order[];
  areAllEligibleSelected: boolean;
  onSelectAll: () => void;
  // Grid columns
  gridColumns: string;
}

export function OrdersTableHeader({
  filteredOrders,
  areAllEligibleSelected,
  onSelectAll,
  gridColumns,
}: OrdersTableHeaderProps) {
  return (
    <div
      className="grid gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 sticky top-0"
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Checkbox column */}
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={areAllEligibleSelected}
          onChange={onSelectAll}
          className="w-4 h-4 accent-[var(--primary)]"
        />
      </div>

      {/* Preview column header - empty */}
      <div className="flex items-center justify-center" />

      {/* Order # */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Order #
        </span>
      </div>

      {/* Commission */}
      <div className="flex items-center justify-end">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Commission
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Status
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-end">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Amount
        </span>
      </div>

      {/* Order Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Order Date
        </span>
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Entry Date
        </span>
      </div>

      {/* Created By */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Created By
        </span>
      </div>

      {/* Ship Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Ship Date
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Due Date
        </span>
      </div>

      {/* Factory */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Factory
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Customer
        </span>
      </div>

      {/* Job Name */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Job Name
        </span>
      </div>

      {/* Visible */}
      <div className="flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Visible
        </span>
      </div>
    </div>
  );
}
