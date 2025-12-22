/**
 * CheckDetailsSection Component
 * Displays check details like dates, factory, etc.
 */

import type { CommissionCheck } from '@/lib/types/rms';
import { formatDate, formatMonth } from '../../utils';

interface CheckDetailsSectionProps {
  check: CommissionCheck;
}

export function CheckDetailsSection({ check }: CheckDetailsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Check Details
      </h3>
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Commission Period
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatMonth(check.commissionMonth)}
          </span>
        </div>
        {check.manufacturerName && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Factory
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {check.manufacturerName}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Entry Date
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatDate(check.entryDate)}
          </span>
        </div>
        {check.checkDate && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Check Date
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {formatDate(check.checkDate)}
            </span>
          </div>
        )}
        {check.postDate && (
          <div className="flex justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Post Date
            </span>
            <span className="text-sm text-[var(--foreground)]">
              {formatDate(check.postDate)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Created Date
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {formatDate(check.createdDate)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[var(--muted-foreground)]">
            Created By
          </span>
          <span className="text-sm text-[var(--foreground)]">
            {check.createdBy}
          </span>
        </div>
      </div>
    </div>
  );
}

