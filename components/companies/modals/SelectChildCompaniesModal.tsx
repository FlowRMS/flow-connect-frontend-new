/**
 * Select Child Companies Modal
 * Allows users to select child companies when designating a company as Parent or Grandparent
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { ChildCompanyRef, CompanyHierarchyRole } from '../types';

// Mock companies data for selection
const mockAvailableCompanies: ChildCompanyRef[] = [
  { id: 'cust-1', name: 'Acme Electric Supply', companyTypeName: 'Customer' },
  { id: 'cust-2', name: 'Metro Lighting Co', companyTypeName: 'Customer' },
  { id: 'cust-3', name: 'Pacific Electrical', companyTypeName: 'Customer' },
  { id: 'cust-4', name: 'Sunrise Electric', companyTypeName: 'Customer' },
  { id: 'cust-5', name: 'Valley Power Systems', companyTypeName: 'Customer' },
  { id: 'cust-6', name: 'Coastal Lighting Solutions', companyTypeName: 'Customer' },
  { id: 'cust-7', name: 'Mountain Electric', companyTypeName: 'Customer' },
  { id: 'cust-8', name: 'Delta Power Corp', companyTypeName: 'Customer' },
];

// Mock parent companies (companies that are designated as parents)
const mockAvailableParentCompanies: ChildCompanyRef[] = [
  { id: 'parent-1', name: 'Eastern Regional Holdings', companyTypeName: 'Customer' },
  { id: 'parent-2', name: 'Western Distribution Group', companyTypeName: 'Customer' },
  { id: 'parent-3', name: 'Central Power Partners', companyTypeName: 'Customer' },
  { id: 'parent-4', name: 'Northern Electrical Corp', companyTypeName: 'Customer' },
  { id: 'parent-5', name: 'Southern Supply Chain', companyTypeName: 'Customer' },
];

interface SelectChildCompaniesModalProps {
  isOpen: boolean;
  hierarchyRole: CompanyHierarchyRole;
  currentChildCompanies: ChildCompanyRef[];
  onClose: () => void;
  onSave: (selectedCompanies: ChildCompanyRef[]) => void;
}

export function SelectChildCompaniesModal({
  isOpen,
  hierarchyRole,
  currentChildCompanies,
  onClose,
  onSave,
}: SelectChildCompaniesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<ChildCompanyRef[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCompanies(currentChildCompanies);
      setSearchTerm('');
    }
  }, [isOpen, currentChildCompanies]);

  // Get available companies based on hierarchy role
  const availableCompanies = useMemo(() => {
    // For parent companies, show regular customers
    // For grandparent companies, show parent companies
    return hierarchyRole === 'grandparent'
      ? mockAvailableParentCompanies
      : mockAvailableCompanies;
  }, [hierarchyRole]);

  // Filter companies by search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return availableCompanies;
    const query = searchTerm.toLowerCase();
    return availableCompanies.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  }, [availableCompanies, searchTerm]);

  // Check if a company is selected
  const isSelected = (companyId: string) => {
    return selectedCompanies.some(c => c.id === companyId);
  };

  // Toggle company selection
  const toggleCompany = (company: ChildCompanyRef) => {
    if (isSelected(company.id)) {
      setSelectedCompanies(prev => prev.filter(c => c.id !== company.id));
    } else {
      setSelectedCompanies(prev => [...prev, company]);
    }
  };

  // Remove a selected company
  const removeCompany = (companyId: string) => {
    setSelectedCompanies(prev => prev.filter(c => c.id !== companyId));
  };

  const handleSave = () => {
    onSave(selectedCompanies);
    onClose();
  };

  if (!isOpen) return null;

  const isParentRole = hierarchyRole === 'parent';
  const title = isParentRole ? 'Select Child Customers' : 'Select Child Parent Companies';
  const description = isParentRole
    ? 'Select the customer companies that belong to this parent company.'
    : 'Select the parent companies that belong to this grandparent company.';
  const entityLabel = isParentRole ? 'customers' : 'parent companies';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onMouseDown={onClose}>
      <div
        className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
          {/* Selected Companies */}
          {selectedCompanies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Selected ({selectedCompanies.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
                {selectedCompanies.map((company) => (
                  <span
                    key={company.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isParentRole
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                      {company.name.charAt(0)}
                    </span>
                    {company.name}
                    <button
                      onClick={() => removeCompany(company.id)}
                      className="ml-1 hover:bg-current/20 rounded-full p-0.5 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Search {entityLabel}
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${entityLabel} by name...`}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Company List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Available {entityLabel}
            </label>
            <div className="flex-1 border border-[var(--border)] rounded-lg overflow-y-auto">
              {filteredCompanies.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted-foreground)]">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p>{searchTerm ? 'No companies match your search' : `No ${entityLabel} available`}</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filteredCompanies.map((company) => {
                    const selected = isSelected(company.id);
                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => toggleCompany(company)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          selected
                            ? 'bg-[var(--primary)]/10'
                            : 'hover:bg-[var(--muted)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                            isParentRole ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{company.name}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">
                              {isParentRole ? 'Customer' : 'Parent Company'}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected
                            ? 'bg-[var(--primary)] border-[var(--primary)]'
                            : 'border-[var(--border)]'
                        }`}>
                          {selected && (
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-[var(--muted-foreground)]">
            {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'} selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Save Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
