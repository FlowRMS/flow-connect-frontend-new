/**
 * Create Contact Modal Component
 */

'use client';

import React, { useState } from 'react';
import { useCreateCRMContact, useCRMCompanyLandingPages } from '../../hooks/useCRMApi';
import { CONTACT_ROLES } from '../constants';
import type { ContactInput } from '../../lib/crm-graphql';
import { contactToasts } from '../../lib/toast';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateContactModal({ isOpen, onClose, onSuccess }: CreateContactModalProps) {
  const [formData, setFormData] = useState<ContactInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    companyId: '',
    notes: '',
    tags: '',
    territory: '',
  });

  const createContactMutation = useCreateCRMContact();
  const { data: companies, isLoading: companiesLoading } = useCRMCompanyLandingPages();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createContactMutation.mutateAsync(formData);
      contactToasts.createSuccess(`${formData.firstName} ${formData.lastName}`);
      onSuccess();
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        companyId: '',
        notes: '',
        tags: '',
        territory: '',
      });
    } catch (error) {
      console.error('Failed to create contact:', error);
      contactToasts.createError(error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Add New Contact</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="john.smith@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select a role...</option>
              {CONTACT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Company
            </label>
            {companiesLoading ? (
              <div className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] bg-[var(--background)]">
                Loading companies...
              </div>
            ) : (
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select a company...</option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Territory
            </label>
            <input
              type="text"
              value={formData.territory}
              onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="West, East, Central, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Comma-separated tags"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="Additional notes about this contact..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createContactMutation.isPending}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
