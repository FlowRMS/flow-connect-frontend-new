/**
 * InvoiceDetailPanel Component
 * Main sidebar panel that displays invoice details
 */

import type { Invoice } from '@/lib/types/rms';
import type { OrderSplitRate } from '@/lib/types/rms';
import { InvoiceStatusSection } from './InvoiceStatusSection';
import { InvoiceDetailsSection } from './InvoiceDetailsSection';
import { InvoiceLineItemsSection } from './InvoiceLineItemsSection';
import { InvoiceSplitsSection } from './InvoiceSplitsSection';
import { InvoiceTotalsSection } from './InvoiceTotalsSection';

interface InvoiceDetailPanelProps {
  invoice: Invoice;
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
  onRecordPayment?: () => void;
  onCreateCredit?: () => void;
  onPrint?: () => void;
}

export function InvoiceDetailPanel({
  invoice,
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
  onRecordPayment,
  onCreateCredit,
  onPrint,
}: InvoiceDetailPanelProps) {
  // Record Payment: only show if status is open or partial_paid AND balance > 0
  const canRecordPayment =
    (invoice.status === 'open' || invoice.status === 'partial_paid') &&
    invoice.balance > 0;
  
  // Create Credit: show if status is not void and not paid
  const canCreateCredit =
    invoice.status !== 'void' && invoice.status !== 'paid';

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl z-40">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {invoice.customerName}
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
        <InvoiceStatusSection invoice={invoice} />

        {/* Invoice Details */}
        <InvoiceDetailsSection invoice={invoice} />

        {/* Line Items */}
        <InvoiceLineItemsSection invoice={invoice} />

        {/* Commission Splits */}
        <InvoiceSplitsSection
          invoice={invoice}
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
        <InvoiceTotalsSection invoice={invoice} />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          {canRecordPayment && (
            <button
              onClick={() => onRecordPayment?.()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Record Payment
            </button>
          )}
          {canCreateCredit && (
            <button
              onClick={() => onCreateCredit?.()}
              className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Create Credit
            </button>
          )}
          <button
            onClick={() => onPrint?.()}
            className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

