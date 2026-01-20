'use client';

import React, { useState } from 'react';
import type { SubmittalStakeholder } from '../../../lib/types/submittals';
import { StakeholderCard, EmptyStakeholder } from '../StakeholderHelpers';

type StakeholderRole = 'customer' | 'engineer' | 'architect';

interface AddStakeholderFormData {
  contactName: string;
  companyName: string;
  email: string;
}

interface StakeholdersTabContentProps {
  customers: SubmittalStakeholder[];
  engineers: SubmittalStakeholder[];
  architects: SubmittalStakeholder[];
  onAddStakeholder?: (role: StakeholderRole, data: AddStakeholderFormData) => Promise<void>;
  onRemoveStakeholder?: (stakeholderId: string) => void;
  isAddingStakeholder?: boolean;
}

function AddStakeholderForm({
  role,
  onSubmit,
  onCancel,
  isLoading,
}: {
  role: StakeholderRole;
  onSubmit: (data: AddStakeholderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || isLoading) return;
    onSubmit({ contactName: contactName.trim(), companyName: companyName.trim(), email: email.trim() });
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <form onSubmit={handleSubmit} className="p-3 border border-[var(--primary)] rounded-lg bg-[var(--primary)]/5 space-y-2">
      <div>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder={`${roleLabel} name *`}
          disabled={isLoading}
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
          autoFocus
        />
      </div>
      <div>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
          disabled={isLoading}
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
        />
      </div>
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={isLoading}
          className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!contactName.trim() || isLoading}
          className="flex-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            'Add'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function StakeholdersTabContent({
  customers,
  engineers,
  architects,
  onAddStakeholder,
  onRemoveStakeholder,
  isAddingStakeholder,
}: StakeholdersTabContentProps) {
  const [addingRole, setAddingRole] = useState<StakeholderRole | null>(null);

  const handleAdd = async (role: StakeholderRole, data: AddStakeholderFormData) => {
    await onAddStakeholder?.(role, data);
    setAddingRole(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Customers</h3>
            <button
              onClick={() => setAddingRole('customer')}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {addingRole === 'customer' && (
              <AddStakeholderForm
                role="customer"
                onSubmit={(data) => handleAdd('customer', data)}
                onCancel={() => setAddingRole(null)}
                isLoading={isAddingStakeholder}
              />
            )}
            {customers.length > 0 ? customers.map((s) => (
              <StakeholderCard key={s.contactId} stakeholder={s} onRemove={onRemoveStakeholder} />
            )) : (
              <EmptyStakeholder type="customer" />
            )}
          </div>
        </div>

        {/* Engineers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Engineers</h3>
            <button
              onClick={() => setAddingRole('engineer')}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {addingRole === 'engineer' && (
              <AddStakeholderForm
                role="engineer"
                onSubmit={(data) => handleAdd('engineer', data)}
                onCancel={() => setAddingRole(null)}
                isLoading={isAddingStakeholder}
              />
            )}
            {engineers.length > 0 ? engineers.map((s) => (
              <StakeholderCard key={s.contactId} stakeholder={s} onRemove={onRemoveStakeholder} />
            )) : (
              <EmptyStakeholder type="engineer" />
            )}
          </div>
        </div>

        {/* Architects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Architects</h3>
            <button
              onClick={() => setAddingRole('architect')}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {addingRole === 'architect' && (
              <AddStakeholderForm
                role="architect"
                onSubmit={(data) => handleAdd('architect', data)}
                onCancel={() => setAddingRole(null)}
                isLoading={isAddingStakeholder}
              />
            )}
            {architects.length > 0 ? architects.map((s) => (
              <StakeholderCard key={s.contactId} stakeholder={s} onRemove={onRemoveStakeholder} />
            )) : (
              <EmptyStakeholder type="architect" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
