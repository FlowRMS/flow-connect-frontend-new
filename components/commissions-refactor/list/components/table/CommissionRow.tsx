/**
 * CommissionRow Component
 * Individual row in the commissions table
 */

import { useRouter } from 'next/navigation';
import type { CommissionCheck } from '@/lib/types/rms';
import { checkStatusLabels, checkStatusColors } from '../../constants';
import { formatCurrency, formatDate, formatMonth } from '../../utils';

interface CommissionRowProps {
  check: CommissionCheck;
  isSelected: boolean;
  isLinked: boolean;
  linkedReason: string;
  onToggleSelection: () => void;
  onPreview: () => void;
  gridColumns: string;
}

export function CommissionRow({
  check,
  isSelected,
  isLinked,
  linkedReason,
  onToggleSelection,
  onPreview,
  gridColumns,
}: CommissionRowProps) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/commissions/${check.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`grid gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer min-w-[1200px] ${
        isSelected ? 'bg-[var(--primary)]/5' : ''
      }`}
      style={{ gridTemplateColumns: gridColumns }}
    >
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

      {/* Checkbox */}
      <div
        className="w-8 flex items-center relative group"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isLinked}
          onChange={onToggleSelection}
          className={`rounded border-[var(--border)] ${
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

      {/* Check Number */}
      <div className="flex items-center">
        <span className="font-medium text-[var(--foreground)]">
          {check.checkNumber}
        </span>
      </div>

      {/* Posted Status */}
      <div className="flex items-center">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
            check.status === 'posted'
              ? 'bg-blue-100 text-blue-700'
              : check.status === 'draft'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              check.status === 'posted'
                ? 'bg-blue-500'
                : check.status === 'draft'
                ? 'bg-gray-500'
                : 'bg-red-500'
            }`}
          ></span>
          {check.status === 'posted'
            ? 'OPEN'
            : checkStatusLabels[check.status].toUpperCase()}
        </span>
      </div>

      {/* Commission */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--foreground)]">
          {formatCurrency(check.netAmount)}
        </span>
      </div>

      {/* Commission Month */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)]">
          {formatMonth(check.commissionMonth)}
        </span>
      </div>

      {/* Factory */}
      <div className="flex items-center">
        {check.manufacturerName && (
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium text-[var(--muted-foreground)]">
              {check.manufacturerName.charAt(0)}
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {check.manufacturerName}
            </span>
          </div>
        )}
      </div>

      {/* Post Date */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)]">
          {check.postDate ? formatDate(check.postDate) : ''}
        </span>
      </div>

      {/* Check Date */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)]">
          {check.checkDate ? formatDate(check.checkDate) : ''}
        </span>
      </div>

      {/* Entry Date */}
      <div className="flex items-center">
        <span className="text-sm text-[var(--muted-foreground)]">
          {formatDate(check.entryDate)}
        </span>
      </div>

      {/* Check Balance */}
      <div className="flex items-center justify-end">
        <span className="text-sm text-[var(--foreground)]">
          {formatCurrency(check.checkBalance)}
        </span>
      </div>
    </div>
  );
}

