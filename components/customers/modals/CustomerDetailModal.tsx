/**
 * Customer Detail Modal Component
 * Modal for viewing customer details
 */

'use client';

import React from 'react';
import { useCustomer, type CustomerLandingPage } from '../api/useCustomersApi';

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: CustomerLandingPage;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerDetailModal({ isOpen, customer, onClose, onEdit, onDelete }: CustomerDetailModalProps) {
  // Fetch full customer details to get split rates
  const { data: fullCustomer, isLoading } = useCustomer(customer.id);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-[var(--muted)]/30 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {customer.companyName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{customer.companyName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    customer.isParent
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {customer.isParent ? 'Parent' : 'Child'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    customer.published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {customer.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Contact Information */}
          <div className="bg-[var(--muted)]/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact Information
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Email</p>
                  <p className="text-sm text-[var(--foreground)]">{customer.contactEmail || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Phone</p>
                  <p className="text-sm text-[var(--foreground)]">{customer.contactNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reps Information */}
          <div className="bg-[var(--muted)]/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Sales Representatives
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-5 w-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {/* Inside Reps */}
                <div className="bg-[var(--card)] rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-700">Inside Reps</span>
                  </div>
                  {fullCustomer?.insideReps && fullCustomer.insideReps.length > 0 ? (
                    <div className="space-y-1.5">
                      {fullCustomer.insideReps.map((rep) => (
                        <div key={rep.id} className="flex items-center justify-between bg-blue-50 rounded-md px-3 py-2">
                          <span className="text-sm text-[var(--foreground)]">
                            {rep.user?.fullName || rep.user?.email || 'Unknown'}
                          </span>
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                            {parseFloat(rep.splitRate).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)] italic">No inside reps assigned</p>
                  )}
                </div>

                {/* Outside Reps */}
                <div className="bg-[var(--card)] rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-purple-700">Outside Reps</span>
                  </div>
                  {fullCustomer?.outsideReps && fullCustomer.outsideReps.length > 0 ? (
                    <div className="space-y-1.5">
                      {fullCustomer.outsideReps.map((rep) => (
                        <div key={rep.id} className="flex items-center justify-between bg-purple-50 rounded-md px-3 py-2">
                          <span className="text-sm text-[var(--foreground)]">
                            {rep.user?.fullName || rep.user?.email || 'Unknown'}
                          </span>
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                            {parseFloat(rep.splitRate).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)] italic">No outside reps assigned</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-[var(--muted)]/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Created</p>
                <p className="text-sm text-[var(--foreground)]">{formatDate(customer.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">Created By</p>
                <p className="text-sm text-[var(--foreground)]">{customer.createdBy || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--muted)]/30 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
