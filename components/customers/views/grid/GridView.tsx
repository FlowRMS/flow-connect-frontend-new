/**
 * Customer Grid View Component
 * Displays customers in a card grid format
 */

'use client';

import React from 'react';
import { type CustomerLandingPage } from '../../api/useCustomersApi';
import { CustomersGridSkeleton } from './components/CustomersGridSkeleton';

interface GridViewProps {
  customers: CustomerLandingPage[];
  onCustomerClick: (customer: CustomerLandingPage) => void;
  onEditClick: (customer: CustomerLandingPage) => void;
  onDeleteClick: (customer: CustomerLandingPage) => void;
  selectedIds: Set<string>;
  excludedIds: Set<string>;
  selectAllMode: boolean;
  isItemSelected: (id: string) => boolean;
  onSelectOne: (id: string, checked: boolean) => void;
  isLoading?: boolean;
}

export function GridView({
  customers,
  onCustomerClick,
  onEditClick,
  onDeleteClick,
  isItemSelected,
  onSelectOne,
  isLoading = false,
}: GridViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return <CustomersGridSkeleton cardCount={12} />;
  }

  if (customers.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
        <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No customers found</h3>
        <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.map((customer) => (
        <div
          key={customer.id}
          className={`bg-[var(--card)] border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group ${
            isItemSelected(customer.id)
              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
              : 'border-[var(--border)]'
          }`}
          onClick={() => onCustomerClick(customer)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isItemSelected(customer.id)}
                  onChange={(e) => onSelectOne(customer.id, e.target.checked)}
                  className="absolute top-0 left-0 w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ opacity: isItemSelected(customer.id) ? 1 : undefined }}
                />
                <div className={`w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isItemSelected(customer.id) ? 'ring-2 ring-[var(--primary)]' : ''
                }`}>
                  <span className="text-lg font-semibold text-blue-600">
                    {customer.companyName?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {customer.companyName || 'Unnamed Customer'}
                </h3>
                {/* Hierarchy: Buying Group (top) -> Parent Customer -> Customer */}
                {customer.isParent && !customer.parent && !customer.buyingGroup ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    Buying Group
                  </span>
                ) : customer.isParent ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Parent
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Child
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEditClick(customer)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteClick(customer)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              customer.published
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {customer.published ? 'Published' : 'Draft'}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
