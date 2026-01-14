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
}

export function InvoiceRow({
  invoice,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
}: InvoiceRowProps) {
  const router = useRouter();
  const overdue = isOverdue(invoice);

  const handleRowClick = () => {
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        isSelected ? 'bg-indigo-50' : ''
      }`}
    >
      {/* Checkbox */}
      <td className="px-3 py-3 relative group" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isLinked}
          onChange={onToggleSelection}
          className={`w-4 h-4 rounded border-gray-300 accent-indigo-600 ${
            isLinked ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        />
        {isLinked && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
            {linkedReason}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
          </div>
        )}
      </td>

      {/* Preview button */}
      <td className="px-3 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Quick preview"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </td>

      {/* Invoice Number */}
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-indigo-600 hover:underline">
          {invoice.invoiceNumber}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${invoiceStatusColors[invoice.status]}`}>
          {invoiceStatusLabels[invoice.status]}
        </span>
      </td>

      {/* Order # */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-500 truncate block">
          {invoice.orderNumber}
        </span>
      </td>

      {/* Invoice Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {formatDate(invoice.invoiceDate)}
        </span>
      </td>

      {/* Inv Amount */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(invoice.total)}
        </span>
      </td>

      {/* Comm Amount */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm text-green-600">
          {formatCurrency(invoice.totalCommission)}
        </span>
      </td>

      {/* Factory - uses factoryName from API if available */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-900 truncate block" title={(invoice as any).factoryName || invoice.manufacturerName || '-'}>
          {(invoice as any).factoryName || invoice.manufacturerName || '-'}
        </span>
      </td>

      {/* Entry Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {invoice.entryDate ? formatDate(invoice.entryDate) : '-'}
        </span>
      </td>

      {/* Created By */}
      <td className="px-3 py-3">
        <AvatarInline name={(invoice as any).createdBy} size="sm" />
      </td>

      {/* Due Date */}
      <td className="px-3 py-3">
        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {formatDate(invoice.dueDate)}
        </span>
      </td>

      {/* Published */}
      <td className="px-3 py-3 text-center">
        {(invoice as any).published === true ? (
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
      </td>
    </tr>
  );
}

