'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

export default function CommissionsContent() {
  const router = useRouter();
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
        c.commissionMonth.includes(query) ||
        (c.manufacturerName && c.manufacturerName.toLowerCase().includes(query))
      );
    }

    return result;
  }, [checks, selectedStatus, searchQuery]);

  const totalAmount = useMemo(() => {
    return checks.filter(c => c.status === 'posted').reduce((sum, c) => sum + c.netAmount, 0);
  }, [checks]);

  const totalCommission = useMemo(() => {
    return checks.reduce((sum, c) => sum + c.netAmount, 0);
  }, [checks]);

  const totalBalance = useMemo(() => {
    return checks.reduce((sum, c) => sum + c.checkBalance, 0);
  }, [checks]);

  const draftAmount = useMemo(() => {
    return checks.filter(c => c.status === 'draft').reduce((sum, c) => sum + c.netAmount, 0);
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
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} - ${year}`;
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedCheck ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M6 9h4M6 13h12"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">Commission Check</h1>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {checks.length} checks
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add new Check
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Checks</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{checks.length}</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Commission</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">
                {formatCurrency(totalCommission)}
              </div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Posted Amount</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Balance</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">
                {formatCurrency(totalBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Checks Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 min-w-[1200px]">
              <div className="flex items-center justify-center">
                {/* Preview column header - empty */}
              </div>
              <div className="w-8">
                <input type="checkbox" className="rounded border-[var(--border)]" />
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Check Number
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Posted Status
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Commission
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Commission Month
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Factory
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Post Date
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Check Date
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Entry Date
              </div>
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Check Balance
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
                    onClick={() => router.push(`/commissions/${check.id}`)}
                    className={`grid grid-cols-[40px_auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer min-w-[1200px] ${
                      selectedCheck?.id === check.id ? 'bg-[var(--muted)]/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCheck(check);
                        }}
                        className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                        title="Quick preview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                        </svg>
                      </button>
                    </div>
                    <div className="w-8 flex items-center">
                      <input type="checkbox" className="rounded border-[var(--border)]" onClick={(e) => e.stopPropagation()} />
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-[var(--foreground)]">{check.checkNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
                        check.status === 'posted' ? 'bg-blue-100 text-blue-700' :
                        check.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          check.status === 'posted' ? 'bg-blue-500' :
                          check.status === 'draft' ? 'bg-gray-500' :
                          'bg-red-500'
                        }`}></span>
                        {check.status === 'posted' ? 'OPEN' : checkStatusLabels[check.status].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(check.netAmount)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">{formatMonth(check.commissionMonth)}</span>
                    </div>
                    <div className="flex items-center">
                      {check.manufacturerName && (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium text-[var(--muted-foreground)]">
                            {check.manufacturerName.charAt(0)}
                          </span>
                          <span className="text-sm text-[var(--foreground)]">{check.manufacturerName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {check.postDate ? formatDate(check.postDate) : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {check.checkDate ? formatDate(check.checkDate) : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {formatDate(check.entryDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(check.checkBalance)}</span>
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
                {selectedCheck.manufacturerName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Factory</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedCheck.manufacturerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Entry Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.entryDate)}</span>
                </div>
                {selectedCheck.checkDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Check Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.checkDate)}</span>
                  </div>
                )}
                {selectedCheck.postDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Post Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.postDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Created Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.createdDate)}</span>
                </div>
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
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Check Balance</span>
                  <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(selectedCheck.checkBalance)}</span>
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
