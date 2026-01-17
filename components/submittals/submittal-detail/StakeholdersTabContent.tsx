'use client';

import React from 'react';
import type { SubmittalStakeholder } from '../../../lib/types/submittals';
import { StakeholderCard, EmptyStakeholder } from '../StakeholderHelpers';

interface StakeholdersTabContentProps {
  customers: SubmittalStakeholder[];
  engineers: SubmittalStakeholder[];
  architects: SubmittalStakeholder[];
}

export function StakeholdersTabContent({
  customers,
  engineers,
  architects,
}: StakeholdersTabContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Customers</h3>
            <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
          </div>
          <div className="space-y-2">
            {customers.length > 0 ? customers.map((s, i) => (
              <StakeholderCard key={i} stakeholder={s} />
            )) : (
              <EmptyStakeholder type="customer" />
            )}
          </div>
        </div>

        {/* Engineers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Engineers</h3>
            <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
          </div>
          <div className="space-y-2">
            {engineers.length > 0 ? engineers.map((s, i) => (
              <StakeholderCard key={i} stakeholder={s} />
            )) : (
              <EmptyStakeholder type="engineer" />
            )}
          </div>
        </div>

        {/* Architects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Architects</h3>
            <button className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Add</button>
          </div>
          <div className="space-y-2">
            {architects.length > 0 ? architects.map((s, i) => (
              <StakeholderCard key={i} stakeholder={s} />
            )) : (
              <EmptyStakeholder type="architect" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
