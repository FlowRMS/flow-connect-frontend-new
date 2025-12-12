'use client';

import React, { useState, useMemo } from 'react';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockChecks,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import {
  CommissionCheck,
  checkStatusLabels,
  checkStatusColors,
} from '../../lib/types/rms';

export default function ChecksContent() {
  const [checks] = useState<CommissionCheck[]>(mockChecks);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCheck, setSelectedCheck] = useState<CommissionCheck | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const statusTabs = [
    { label: 'All', value: 'All', count: checks.length },
    { label: 'Draft', value: 'draft', count: checks.filter(c => c.status === 'draft').length },
    { label: 'Posted', value: 'posted', count: checks.filter(c => c.status === 'posted').length },
    { label: 'Void', value: 'void', count: checks.filter(c => c.status === 'void').length },
  ];

  const filteredChecks = useMemo(() => {
    let result = checks;

    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.checkNumber.toLowerCase().includes(query) ||
        c.salesRepName.toLowerCase().includes(query) ||
        c.commissionMonth.includes(query)
      );
    }

    return result;
  }, [checks, selectedStatus, searchQuery]);

  const totalAmount = useMemo(() => {
    return checks.filter(c => c.status === 'posted').reduce((sum, c) => sum + c.netAmount, 0);
  }, [checks]);

  const filterOptions = [
    { id: 'check-number', label: 'Check Number', type: 'text' as const },
    { id: 'sales-rep', label: 'Sales Rep', type: 'dropdown' as const },
    { id: 'month', label: 'Commission Month', type: 'date' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedCheck ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Commission Checks</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage and track commission payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdvancedFilters filterOptions={filterOptions} />
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Create Check
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Checks</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{checks.length}</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Posted Amount</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Draft Checks</div>
              <div className="text-2xl font-semibold text-gray-600 mt-1">
                {checks.filter(c => c.status === 'draft').length}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search checks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 border-b border-[var(--border)]">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  selectedStatus === tab.value
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">({tab.count})</span>
                {selectedStatus === tab.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Checks Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-8 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Check #
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Sales Rep
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Period
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Invoices
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Deductions
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Net Amount
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {filteredChecks.length === 0 ? (
                <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No checks found
                </div>
              ) : (
                filteredChecks.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => setSelectedCheck(check)}
                    className={`grid grid-cols-8 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                      selectedCheck?.id === check.id ? 'bg-[var(--muted)]/30' : ''
                    }`}
                  >
                    <div className="col-span-1">
                      <div className="font-medium text-[var(--foreground)]">{check.checkNumber}</div>
                      {check.postDate && (
                        <div className="text-xs text-[var(--muted-foreground)]">{formatDate(check.postDate)}</div>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <div className="text-sm text-[var(--foreground)]">{check.salesRepName}</div>
                        {check.manufacturerName && (
                          <div className="text-xs text-[var(--muted-foreground)]">{check.manufacturerName}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">{formatMonth(check.commissionMonth)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-green-600">{formatCurrency(check.invoicePayments)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-red-600">
                        -{formatCurrency(check.creditDeductions + check.expenseAdjustments)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(check.netAmount)}</span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${checkStatusColors[check.status]}`}>
                        {checkStatusLabels[check.status]}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCheck && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedCheck.checkNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedCheck.salesRepName}</p>
            </div>
            <button
              onClick={() => setSelectedCheck(null)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${checkStatusColors[selectedCheck.status]}`}>
                  {checkStatusLabels[selectedCheck.status]}
                </span>
              </div>
            </div>

            {/* Check Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Check Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Commission Period</span>
                  <span className="text-sm text-[var(--foreground)]">{formatMonth(selectedCheck.commissionMonth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Created Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.createdDate)}</span>
                </div>
                {selectedCheck.postDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Post Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.postDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Created By</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedCheck.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Check Details (Line Items) */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Details ({selectedCheck.details.length})
              </h3>
              <div className="space-y-2">
                {selectedCheck.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          detail.type === 'invoice' ? 'bg-green-100 text-green-700' :
                          detail.type === 'credit' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {detail.type}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)]">{detail.referenceNumber}</span>
                      </div>
                      <span className={`text-sm font-medium ${detail.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {detail.amount >= 0 ? '+' : ''}{formatCurrency(detail.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{detail.description}</p>
                    {detail.customerName && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Customer: {detail.customerName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Check Totals</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Invoice Payments</span>
                  <span className="text-sm text-green-600">+{formatCurrency(selectedCheck.invoicePayments)}</span>
                </div>
                {selectedCheck.expenseAdjustments !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Expense Adjustments</span>
                    <span className="text-sm text-blue-600">
                      {selectedCheck.expenseAdjustments >= 0 ? '+' : ''}{formatCurrency(selectedCheck.expenseAdjustments)}
                    </span>
                  </div>
                )}
                {selectedCheck.creditDeductions !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Credit Deductions</span>
                    <span className="text-sm text-red-600">-{formatCurrency(selectedCheck.creditDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Net Amount</span>
                  <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(selectedCheck.netAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              {selectedCheck.status === 'draft' && (
                <>
                  <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Edit Check
                  </button>
                  <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                    Post Check
                  </button>
                </>
              )}
              {selectedCheck.status === 'posted' && (
                <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Print Check
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
