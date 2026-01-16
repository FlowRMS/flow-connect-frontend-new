/**
 * OrderRow Component
 * Individual row in the orders table
 */

import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types/rms';
import { orderStatusColors, orderStatusLabels } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';
import { AvatarInline } from '@/components/ui/CreatedByBadge';

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  isLinked: boolean;
  linkedReason: string;
  onToggleSelection: () => void;
  onPreview: () => void;
}

export function OrderRow({
  order,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
}: OrderRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/orders/${order.id}`);
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

      {/* Order Number */}
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-indigo-600 hover:underline">
          {order.orderNumber}
        </span>
      </td>

      {/* Commission */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm text-green-600">
          {formatCurrency(order.totalCommission)}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            orderStatusColors[order.status]
          }`}
        >
          {orderStatusLabels[order.status]}
        </span>
      </td>

      {/* Amount */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(order.total)}
        </span>
      </td>

      {/* Order Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {formatDate(order.orderDate)}
        </span>
      </td>

      {/* Entry Date (createdAt) */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {order.createdAt ? formatDate(order.createdAt) : '-'}
        </span>
      </td>

      {/* Created By */}
      <td className="px-3 py-3">
        <AvatarInline name={order.createdBy} size="sm" />
      </td>

      {/* Ship Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {order.shipDate ? formatDate(order.shipDate) : '-'}
        </span>
      </td>

      {/* Due Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {order.dueDate ? formatDate(order.dueDate) : '-'}
        </span>
      </td>

      {/* Manufacturer/Factory - uses factoryName from API if available */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-900 truncate block" title={(order as any).factoryName || order.manufacturerName || '-'}>
          {(order as any).factoryName || order.manufacturerName || '-'}
        </span>
      </td>

      {/* Customer - uses soldToCustomerName from API if available */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-900 truncate block" title={(order as any).soldToCustomerName || order.customerName || '-'}>
          {(order as any).soldToCustomerName || order.customerName || '-'}
        </span>
      </td>

      {/* Job Name - uses jobName from API if available */}
      <td className="px-3 py-3">
        <span className="text-sm text-gray-900 truncate block" title={(order as any).jobName || order.jobName || '-'}>
          {(order as any).jobName || order.jobName || '-'}
        </span>
      </td>

      {/* Visible */}
      <td className="px-3 py-3 text-center">
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
      </td>
    </tr>
  );
}
