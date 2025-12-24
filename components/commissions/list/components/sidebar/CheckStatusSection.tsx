/**
 * CheckStatusSection Component
 * Displays the status of the commission check
 */

import type { CommissionCheck } from '@/lib/types/rms';
import { checkStatusLabels, checkStatusColors } from '../../constants';

interface CheckStatusSectionProps {
  check: CommissionCheck;
}

export function CheckStatusSection({ check }: CheckStatusSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Status
      </h3>
      <div className="flex flex-wrap gap-2">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${checkStatusColors[check.status]}`}
        >
          {checkStatusLabels[check.status]}
        </span>
      </div>
    </div>
  );
}

