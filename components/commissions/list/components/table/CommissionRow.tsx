/**
 * CommissionRow Component
 * Individual row in the commissions table
 */

import { useRouter } from 'next/navigation';
import type { CommissionCheck } from '@/lib/types/rms';
import { checkStatusLabels, checkStatusColors } from '../../constants';
import { formatCurrency, formatDate, formatMonth } from '../../utils';
import { AvatarInline } from '@/components/ui/CreatedByBadge';

interface CommissionRowProps {
  check: CommissionCheck;
  isSelected: boolean;
  isLinked: boolean;
  linkedReason: string;
  onToggleSelection: () => void;
  onPreview: () => void;
}

export function CommissionRow({
  check,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
}: CommissionRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/commissions/${check.id}`);
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        isSelected ? 'bg-indigo-50' : ''
      }`}
    >
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

      {/* Check Number */}
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-indigo-600 hover:underline">
          {check.checkNumber}
        </span>
      </td>

      {/* Posted Status */}
      <td className="px-3 py-3">
        {(() => {
          const status = check.status?.toUpperCase();
          const isOpen = status === 'OPEN';
          const isPosted = status === 'POSTED';
          const isDraft = status === 'DRAFT';

          return (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
                isOpen
                  ? 'bg-yellow-100 text-yellow-700'
                  : isPosted
                  ? 'bg-green-100 text-green-700'
                  : isDraft
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOpen
                    ? 'bg-yellow-500'
                    : isPosted
                    ? 'bg-green-500'
                    : isDraft
                    ? 'bg-gray-500'
                    : 'bg-red-500'
                }`}
              ></span>
              {status || 'UNKNOWN'}
            </span>
          );
        })()}
      </td>

      {/* Commission */}
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(check.netAmount)}
        </span>
      </td>

      {/* Commission Month */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {formatMonth(check.commissionMonth)}
        </span>
      </td>

      {/* Factory */}
      <td className="px-3 py-3">
        {check.manufacturerName ? (
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              {check.manufacturerName.charAt(0)}
            </span>
            <span className="text-sm text-gray-900 truncate block" title={check.manufacturerName}>
              {check.manufacturerName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )}
      </td>

      {/* Post Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {check.postDate ? formatDate(check.postDate) : '-'}
        </span>
      </td>

      {/* Check Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {check.checkDate ? formatDate(check.checkDate) : '-'}
        </span>
      </td>

      {/* Entry Date */}
      <td className="px-3 py-3">
        <span className="text-xs text-gray-500">
          {formatDate(check.entryDate)}
        </span>
      </td>

      {/* Created By */}
      <td className="px-3 py-3">
        <AvatarInline name={(check as any).createdBy} size="sm" />
      </td>

      {/* Check Balance */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(check.checkBalance)}
        </span>
      </td>
    </tr>
  );
}

