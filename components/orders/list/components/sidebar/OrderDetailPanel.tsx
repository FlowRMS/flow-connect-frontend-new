/**
 * OrderDetailPanel Component
 * Main sidebar panel that displays order details
 */

import type { Order, OrderSplitRate } from '@/lib/types/rms';
import { OrderStatusSection } from './OrderStatusSection';
import { OrderDetailsSection } from './OrderDetailsSection';
import { OrderLineItemsSection } from './OrderLineItemsSection';
import { OrderSplitsSection } from './OrderSplitsSection';
import { OrderTotalsSection } from './OrderTotalsSection';

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
  // Commission splits editing
  editingSplits: boolean;
  editedSplits: OrderSplitRate[];
  splitPercentageTotal: number;
  onStartEditingSplits: () => void;
  onCancelEditingSplits: () => void;
  onSaveSplits: () => void;
  onUpdateSplitPercentage: (index: number, percentage: number) => void;
  onAddNewSplit: () => void;
  onRemoveSplit: (index: number) => void;
  onUpdateSplitRep: (index: number, repId: string) => void;
}

export function OrderDetailPanel({
  order,
  onClose,
  editingSplits,
  editedSplits,
  splitPercentageTotal,
  onStartEditingSplits,
  onCancelEditingSplits,
  onSaveSplits,
  onUpdateSplitPercentage,
  onAddNewSplit,
  onRemoveSplit,
  onUpdateSplitRep,
}: OrderDetailPanelProps) {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl z-40">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {order.customerName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Section */}
        <OrderStatusSection order={order} />

        {/* Order Details */}
        <OrderDetailsSection order={order} />

        {/* Line Items */}
        <OrderLineItemsSection order={order} />

        {/* Commission Splits */}
        <OrderSplitsSection
          order={order}
          editingSplits={editingSplits}
          editedSplits={editedSplits}
          splitPercentageTotal={splitPercentageTotal}
          onStartEditing={onStartEditingSplits}
          onCancelEditing={onCancelEditingSplits}
          onSaveSplits={onSaveSplits}
          onUpdateSplitPercentage={onUpdateSplitPercentage}
          onAddNewSplit={onAddNewSplit}
          onRemoveSplit={onRemoveSplit}
          onUpdateSplitRep={onUpdateSplitRep}
        />

        {/* Totals */}
        <OrderTotalsSection order={order} />

        {/* Notes */}
        {order.notes && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              Notes
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg p-3">
              {order.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            Edit Order
          </button>
          <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
            Go to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
