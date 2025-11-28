/**
 * Company Detail Header Component
 */

import React from 'react';
import type { Company } from '../types';
import type { CompanySourceType } from '../../lib/crm-graphql';

interface CompanyDetailHeaderProps {
  company: Company;
  isEditing: boolean;
  isPending: boolean;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function CompanyDetailHeader({
  company,
  isEditing,
  isPending,
  onBack,
  onDelete,
  onEdit,
  onSave,
  onCancel,
}: CompanyDetailHeaderProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Companies
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{company.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              company.companySourceType === 'MANUFACTURER' 
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
            </span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{company.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          {isEditing ? (
            <>
              <button 
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onSave}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Company
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
