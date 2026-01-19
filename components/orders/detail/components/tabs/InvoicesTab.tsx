/**
 * InvoicesTab Component
 * Displays invoices connected to the order with beautiful UI
 */

'use client';

import React, { useState } from 'react';
import type { OrderInvoice } from '../../../api/invoicesApi';
import { formatCurrency } from '../../utils';

// Status Configuration with beautiful colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  PARTIAL: { label: 'Partial', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
};

interface InvoicesTabProps {
  invoices?: OrderInvoice[];
  isLoading?: boolean;
  error?: Error | null;
  onViewInvoice?: (invoice: OrderInvoice) => void;
  onDeleteInvoice?: (invoice: OrderInvoice) => void;
  onCreateInvoice: () => void;
}

export function InvoicesTab({
  invoices = [],
  isLoading = false,
  error = null,
  onViewInvoice,
  onDeleteInvoice,
  onCreateInvoice,
}: InvoicesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'dueDate' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!invoice.invoiceNumber?.toLowerCase().includes(search)) {
          return false;
        }
      }
      // Status filter
      if (filterStatus !== 'ALL' && invoice.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.entityDate || '').getTime() - new Date(b.entityDate || '').getTime();
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
          break;
        case 'number':
          comparison = (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16v.01"/>
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-2">Failed to load invoices</p>
          <p className="text-xs text-[var(--muted-foreground)]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Invoices</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Create Invoice from Order
        </button>
      </div>

      {/* Filters */}
      {invoices.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="6"/>
              <path d="M13 13l4 4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(status => (
              <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Invoices Display */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                <path d="M13 3v5a1 1 0 001 1h5"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              {invoices.length === 0 ? 'No Invoices Yet' : 'No Matching Invoices'}
            </h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              {invoices.length === 0
                ? 'Invoices track billing for this order. Create your first invoice to start billing customers.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {invoices.length === 0 && (
              <button
                onClick={onCreateInvoice}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Create First Invoice
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Card View for Invoices */}
          {filteredInvoices.map((invoice) => {
            const statusConfig = invoice.status ? STATUS_CONFIG[invoice.status] : null;

            return (
              <div
                key={invoice.id}
                onClick={() => onViewInvoice?.(invoice)}
                className="group bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  {/* Left Section - Invoice Info */}
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-600">
                        <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        <path d="M13 3v5a1 1 0 001 1h5"/>
                      </svg>
                    </div>

                    {/* Invoice Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-[var(--foreground)] text-lg group-hover:text-indigo-600 transition-colors">
                          {invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8)}`}
                        </span>
                        {statusConfig && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                            {statusConfig.label}
                          </span>
                        )}
                        {invoice.locked && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                            </svg>
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="14" height="14" rx="2"/>
                            <path d="M3 8h14M7 2v4M13 2v4"/>
                          </svg>
                          {formatDate(invoice.entityDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="10" r="7"/>
                            <path d="M10 6v4l3 3"/>
                          </svg>
                          Due: {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInvoice?.(invoice);
                      }}
                      className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      title="View details"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="3"/>
                        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                      </svg>
                    </button>
                    {onDeleteInvoice && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteInvoice(invoice);
                        }}
                        className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete invoice"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] group-hover:text-indigo-400 transition-colors">
                      <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round" transform="rotate(-45 10 10)"/>
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      {filteredInvoices.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-lg border border-slate-200">
          <span className="text-sm text-[var(--muted-foreground)]">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted-foreground)]">Sort by:</span>
            <button
              onClick={() => toggleSort('date')}
              className={`px-2 py-1 rounded ${sortField === 'date' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
            >
              Date {sortField === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('dueDate')}
              className={`px-2 py-1 rounded ${sortField === 'dueDate' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
            >
              Due Date {sortField === 'dueDate' && (sortDirection === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('number')}
              className={`px-2 py-1 rounded ${sortField === 'number' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
            >
              Number {sortField === 'number' && (sortDirection === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
