/**
 * OrderRow Component
 * Individual row in the orders table
 */

import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types/rms';
import { orderStatusColors, orderStatusLabels } from '../../constants';
import { formatCurrency, formatDate, getOutsideRepsDisplay } from '../../utils';

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  isLinked: boolean;
  linkedReason: string;
  onToggleSelection: () => void;
  onPreview: () => void;
  gridColumns: string;
}

export function OrderRow({
  order,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
  gridColumns,
}: OrderRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/orders/${order.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`grid gap-2 px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
        isSelected ? 'bg-[var(--primary)]/5' : ''
      }`}
      style={{ gridTemplateColumns: gridColumns }}
    >
      {/* Checkbox */}
      <div
        className="flex items-center justify-center relative group"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isLinked}
          onChange={onToggleSelection}
          className={`w-4 h-4 accent-[var(--primary)] ${
            isLinked ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        />
        {isLinked && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
            {linkedReason}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        )}
      </div>

      {/* Preview button */}
      <div className="flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          title="Quick preview"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {/* Order Number */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-[var(--foreground)] truncate">
          {order.orderNumber}
        </span>
      </div>

      {/* Factory SO */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)] truncate">
          {order.factorySoNumber || '-'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            orderStatusColors[order.status]
          }`}
        >
          {orderStatusLabels[order.status]}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-end">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Order Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(order.orderDate)}
        </span>
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {order.entryDate ? formatDate(order.entryDate) : '-'}
        </span>
      </div>

      {/* Ship Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {order.shipDate ? formatDate(order.shipDate) : '-'}
        </span>
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {order.dueDate ? formatDate(order.dueDate) : '-'}
        </span>
      </div>

      {/* Manufacturer */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--foreground)] truncate">
          {order.manufacturerName}
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--foreground)] truncate">
          {order.customerName}
        </span>
      </div>

      {/* Inside Rep */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)] truncate">
          {order.insideRepName || '-'}
        </span>
      </div>

      {/* Outside Reps */}
      <div className="flex items-center">
        <span
          className="text-xs text-[var(--muted-foreground)] truncate"
          title={getOutsideRepsDisplay(order)}
        >
          {getOutsideRepsDisplay(order)}
        </span>
      </div>

      {/* Commission */}
      <div className="flex items-center justify-end">
        <span className="text-sm text-green-600">
          {formatCurrency(order.totalCommission)}
        </span>
      </div>

      {/* Job Name */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--foreground)] truncate">
          {order.jobName || '-'}
        </span>
      </div>

      {/* Visible */}
      <div className="flex items-center justify-center">
        {order.isVisible !== false ? (
          <svg
            className="w-5 h-5 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </div>
    </div>
  );
}
