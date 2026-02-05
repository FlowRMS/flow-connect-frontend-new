'use client';

import React from 'react';
import type { SubmittalStakeholder } from '../../lib/types/submittals';

interface StakeholderCardProps {
  stakeholder: SubmittalStakeholder;
  onRemove?: (stakeholderId: string) => void;
}

export function StakeholderCard({ stakeholder, onRemove }: StakeholderCardProps) {
  return (
    <div className="p-3 border border-[var(--border)] rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[var(--foreground)]">{stakeholder.contactName}</span>
        <button
          onClick={() => onRemove?.(stakeholder.contactId)}
          className="p-1 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)] hover:text-red-500"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {stakeholder.companyName && (
        <p className="text-xs text-[var(--muted-foreground)]">{stakeholder.companyName}</p>
      )}
      {stakeholder.email && (
        <p className="text-xs text-[var(--muted-foreground)]">{stakeholder.email}</p>
      )}
    </div>
  );
}

interface EmptyStakeholderProps {
  type: string;
}

export function EmptyStakeholder({ type }: EmptyStakeholderProps) {
  return (
    <div className="p-4 border border-dashed border-[var(--border)] rounded-lg text-center">
      <p className="text-xs text-[var(--muted-foreground)]">No {type}s added yet</p>
    </div>
  );
}
