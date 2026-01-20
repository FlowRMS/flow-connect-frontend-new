/**
 * AdjustmentRow Component
 * Individual row in the adjustments table
 */

import type { AdjustmentLandingPage, AdjustmentStatus } from '@/components/orders/api/adjustmentsApi';
import { AvatarInline } from '@/components/ui/CreatedByBadge';

// Status Configuration
const STATUS_CONFIG: Record<AdjustmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface AdjustmentRowProps {
  adjustment: AdjustmentLandingPage;
  onView: (adjustment: AdjustmentLandingPage) => void;
  onEdit: (adjustment: AdjustmentLandingPage) => void;
  onDelete: (adjustment: AdjustmentLandingPage) => void;
}

export function AdjustmentRow({
  adjustment,
  onView,
  onEdit,
  onDelete,
}: AdjustmentRowProps) {
  const statusConfig = adjustment.status ? STATUS_CONFIG[adjustment.status] : null;

  return (
    <tr
      className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
      onClick={() => onView(adjustment)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--foreground)]">
              {adjustment.adjustmentNumber || `#${adjustment.id.substring(0, 8)}`}
            </p>
            {adjustment.locked && (
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Locked
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
        {formatDate(adjustment.entityDate)}
      </td>
      <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[250px] truncate" title={adjustment.reason || ''}>
        {adjustment.reason || '-'}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-indigo-600">
        {formatCurrency(parseFloat(adjustment.amount || '0'))}
      </td>
      <td className="px-4 py-3 text-center">
        {statusConfig && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {adjustment.locked ? (
          <span title="Locked">
            <svg className="w-5 h-5 text-amber-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
          </span>
        ) : (
          <span title="Unlocked">
            <svg className="w-5 h-5 text-gray-300 mx-auto" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
            </svg>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <AvatarInline name={(adjustment as any).createdBy} size="sm" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(adjustment)}
            className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="View"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="3"/>
              <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
            </svg>
          </button>
          {!adjustment.locked && (
            <>
              <button
                onClick={() => onEdit(adjustment)}
                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                title="Edit"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                </svg>
              </button>
              <button
                onClick={() => onDelete(adjustment)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                title="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
