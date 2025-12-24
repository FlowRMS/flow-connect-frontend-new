'use client';

import React, { useState } from 'react';
import { useCreateCRMCompany, useCRMCompanyLandingPages } from './hooks/useCRMApi';

import type { CompanyInput, CompanySourceType } from './lib/crm-graphql';
import { companyToasts } from './lib/toast';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCompanyModal({ isOpen, onClose, onSuccess }: CreateCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    companySourceType: 'CUSTOMER' as CompanySourceType,
    phone: '',
    website: '',
    tags: '',
    parentCompanyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  const isConnected = true;
  const createCompanyMutation = useCreateCRMCompany();
  
  // Fetch existing companies for parent company dropdown
  const { data: existingCompanies, isLoading: companiesLoading } = useCRMCompanyLandingPages();

  // Filter companies based on search query
  const filteredCompanies = existingCompanies?.filter(company => 
    company.name.toLowerCase().includes(parentSearchQuery.toLowerCase())
  ) || [];

  // Get selected parent company name
  const selectedParentCompany = existingCompanies?.find(c => c.id === formData.parentCompanyId);

  const resetForm = () => {
    setFormData({
      name: '',
      companySourceType: 'CUSTOMER',
      phone: '',
      website: '',
      tags: '',
      parentCompanyId: '',
    });
    setError(null);
    setParentSearchQuery('');
    setShowParentDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    const input: CompanyInput = {
      name: formData.name.trim(),
      companySourceType: formData.companySourceType,
    };

    // Add optional fields if they have values
    if (formData.phone.trim()) {
      input.phone = formData.phone.trim();
    }
    if (formData.website.trim()) {
      input.website = formData.website.trim();
    }
    if (formData.tags.trim()) {
      input.tags = formData.tags.trim();
    }
    if (formData.parentCompanyId.trim()) {
      input.parentCompanyId = formData.parentCompanyId.trim();
    }

    try {
      await createCompanyMutation.mutateAsync(input);
      companyToasts.createSuccess(formData.name.trim());
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      companyToasts.createError(err instanceof Error ? err.message : undefined);
      setError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Create New Company</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {!isConnected ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">CRM Not Connected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please configure your CRM API tokens in the Auth page to create companies.
                  </p>
                  <a
                    href="/crm-auth"
                    className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:underline"
                  >
                    Go to Auth Settings →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            {/* Company Source Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Company Type <span className="text-red-500">*</span>
              </label>
              <select
                name="companySourceType"
                value={formData.companySourceType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              >
                <option value="CUSTOMER">Customer</option>
                <option value="MANUFACTURER">Manufacturer</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., (555) 123-4567"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g., www.example.com"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., Commercial, Healthcare (comma-separated)"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Enter tags separated by commas
              </p>
            </div>

            {/* Parent Company ID (optional) */}
            <div className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Parent Company
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowParentDropdown(!showParentDropdown)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] cursor-pointer flex items-center justify-between hover:border-[var(--primary)] transition-colors"
                >
                  <span className={selectedParentCompany ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
                    {selectedParentCompany ? selectedParentCompany.name : 'Select parent company (optional)'}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showParentDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {showParentDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-[var(--border)]">
                      <input
                        type="text"
                        placeholder="Search companies..."
                        value={parentSearchQuery}
                        onChange={(e) => setParentSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Options list */}
                    <div className="max-h-48 overflow-y-auto">
                      {/* None option */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, parentCompanyId: '' }));
                          setShowParentDropdown(false);
                          setParentSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
                      >
                        None (No parent company)
                      </button>
                      
                      {companiesLoading ? (
                        <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                          Loading companies...
                        </div>
                      ) : filteredCompanies.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                          No companies found
                        </div>
                      ) : (
                        filteredCompanies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, parentCompanyId: company.id }));
                              setShowParentDropdown(false);
                              setParentSearchQuery('');
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                              formData.parentCompanyId === company.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                              </div>
                            </div>
                            {formData.parentCompanyId === company.id && (
                              <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Optionally select a parent company for this company
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
