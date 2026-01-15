/**
 * InvoiceRow Component
 * Individual row in the invoices table
 */

import { useRouter } from 'next/navigation';
import type { Invoice } from '@/lib/types/rms';
import { invoiceStatusColors, invoiceStatusLabels } from '../../constants';
import { formatCurrency, formatDate, isOverdue } from '../../utils';
import { AvatarInline } from '@/components/ui/CreatedByBadge';

interface InvoiceRowProps {
  invoice: Invoice;
  isSelected: boolean;
  isLinked: boolean;
  linkedReason: string;
  onToggleSelection: () => void;
  onPreview: () => void;
  gridColumns: string;
}

export function InvoiceRow({
  invoice,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
  gridColumns,
}: InvoiceRowProps) {
  const router = useRouter();
  const overdue = isOverdue(invoice);

  const handleRowClick = () => {
    router.push(`/invoices/${invoice.id}`);
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

      {/* Invoice Number */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-[var(--foreground)] truncate">
          {invoice.invoiceNumber}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center">
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${invoiceStatusColors[invoice.status]}`}>
          {invoiceStatusLabels[invoice.status]}
        </span>
      </div>

      {/* Order # */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)] truncate">
          {invoice.orderNumber}
        </span>
      </div>

      {/* Invoice Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(invoice.invoiceDate)}
        </span>
      </div>

      {/* Inv Amount */}
      <div className="flex items-center justify-end">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {formatCurrency(invoice.total)}
        </span>
      </div>

      {/* Comm Amount */}
      <div className="flex items-center justify-end">
        <span className="text-sm text-green-600">
          {formatCurrency(invoice.totalCommission)}
        </span>
      </div>

      {/* Factory - uses factoryName from API if available */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--foreground)] truncate">
          {(invoice as any).factoryName || invoice.manufacturerName || '-'}
        </span>
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-xs text-[var(--muted-foreground)]">
          {invoice.entryDate ? formatDate(invoice.entryDate) : '-'}
        </span>
      </div>

      {/* Created By */}
      <div className="flex items-center">
        <AvatarInline name={(invoice as any).createdBy} size="sm" />
      </div>

      {/* Due Date */}
      <div className="flex items-center">
        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-[var(--muted-foreground)]'}`}>
          {formatDate(invoice.dueDate)}
        </span>
      </div>

      {/* Paid */}
      <div className="flex items-center justify-center">
        {invoice.status === 'paid' || invoice.isPaid ? (
          <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      {/* Locked */}
      <div className="flex items-center justify-center">
        {(invoice as any).locked ? (
          <span title="Locked">
            <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
          </span>
        ) : (
          <span title="Unlocked">
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

