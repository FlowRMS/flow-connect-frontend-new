/**
 * Customer List View Component
 * Displays customers in a table format
 */

'use client';

import React from 'react';
import { type CustomerLandingPage } from '../api/useCustomersApi';

interface ListViewProps {
  customers: CustomerLandingPage[];
  onCustomerClick: (customer: CustomerLandingPage) => void;
  onEditClick: (customer: CustomerLandingPage) => void;
  onDeleteClick: (customer: CustomerLandingPage) => void;
  selectedIds: Set<string>;
  excludedIds: Set<string>;
  selectAllMode: boolean;
  isItemSelected: (id: string) => boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

export function ListView({
  customers,
  onCustomerClick,
  onEditClick,
  onDeleteClick,
  isItemSelected,
  onSelectAll,
  onSelectOne,
  isAllSelected,
  isPartiallySelected,
}: ListViewProps) {
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Company Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Inside Reps
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Outside Reps
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className={`hover:bg-[var(--muted)]/30 transition-colors cursor-pointer ${
                  isItemSelected(customer.id) ? 'bg-[var(--primary)]/5' : ''
                }`}
                onClick={() => onCustomerClick(customer)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isItemSelected(customer.id)}
                    onChange={(e) => onSelectOne(customer.id, e.target.checked)}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)] cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {customer.companyName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {customer.companyName || 'Unnamed Customer'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {customer.insideReps ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {customer.insideReps}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {customer.outsideReps ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {customer.outsideReps}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {/* Hierarchy: Buying Group (top) -> Parent Customer -> Customer */}
                  {customer.isParent && !customer.parent && !customer.buyingGroup ? (
                    // This is a buying group (top of hierarchy - is parent with no parent)
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      Buying Group
                    </span>
                  ) : customer.isParent ? (
                    // This is a parent customer (middle of hierarchy)
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Parent
                    </span>
                  ) : (
                    // This is a child customer
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Child
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    customer.published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {customer.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {formatDate(customer.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditClick(customer)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteClick(customer)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete customer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
