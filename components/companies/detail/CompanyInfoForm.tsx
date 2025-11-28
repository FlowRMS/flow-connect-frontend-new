/**
 * Company Information Form Component
 */

import React from 'react';
import type { Company } from '../types';
import type { CompanySourceType } from '../../lib/crm-graphql';

interface CompanyInfoFormProps {
  company: Company;
  isEditing: boolean;
  editFormData: Partial<Company>;
  onFieldChange: (field: string, value: string | CompanySourceType) => void;
}

export default function CompanyInfoForm({
  company,
  isEditing,
  editFormData,
  onFieldChange,
}: CompanyInfoFormProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Company Information</h2>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Company Name</label>
          <input
            type="text"
            value={isEditing ? editFormData.name || '' : company.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Phone</label>
          <input
            type="text"
            value={isEditing ? editFormData.phone || '' : (company.phone || '-')}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Website</label>
          <input
            type="text"
            value={isEditing ? editFormData.website || '' : (company.website || '-')}
            onChange={(e) => onFieldChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Company Type</label>
          {isEditing ? (
            <select
              value={editFormData.companySourceType || company.companySourceType}
              onChange={(e) => onFieldChange('companySourceType', e.target.value as CompanySourceType)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="MANUFACTURER">Manufacturer</option>
            </select>
          ) : (
            <input
              type="text"
              value={company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              readOnly
            />
          )}
        </div>
        <div className="col-span-2">
          <label className="text-sm text-[var(--muted-foreground)] mb-2 block">Tags</label>
          <div className="flex gap-2 flex-wrap">
            {company.tags.length > 0 ? (
              company.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full text-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">No tags</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
