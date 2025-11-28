/**
 * Company Related Entities Component
 */

import React from 'react';
import type { Company } from '../types';

interface CompanyRelatedEntitiesProps {
  company: Company;
}

export default function CompanyRelatedEntities({ company }: CompanyRelatedEntitiesProps) {
  return (
    <>
      {/* Contacts at Company - Placeholder */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Contacts at {company.name}</h2>
          <button className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            + Add Contact
          </button>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Contacts feature coming soon
          </div>
        </div>
      </div>

      {/* Active Jobs - Placeholder */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Jobs</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Jobs linked to this company will appear here
          </div>
        </div>
      </div>
    </>
  );
}
