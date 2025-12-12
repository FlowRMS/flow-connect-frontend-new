'use client';

import React, { useState, useMemo } from 'react';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockCredits,
  mockCreditReasons,
  mockManufacturers,
  mockCustomers,
} from '../../lib/data/rms-mock';
import {
  Credit,
  creditStatusLabels,
  creditStatusColors,
} from '../../lib/types/rms';
import CreateCreditModal from './CreateCreditModal';

export default function CreditsContent() {
  const [credits, setCredits] = useState<Credit[]>(mockCredits);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusTabs = [
    { label: 'All', value: 'All', count: credits.length },
    { label: 'Open', value: 'open', count: credits.filter(c => c.status === 'open').length },
    { label: 'Applied', value: 'applied', count: credits.filter(c => c.status === 'applied').length },
    { label: 'Void', value: 'void', count: credits.filter(c => c.status === 'void').length },
  ];

  const filteredCredits = useMemo(() => {
    let result = credits;

    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.creditNumber.toLowerCase().includes(query) ||
        c.orderNumber.toLowerCase().includes(query) ||
        c.customerName.toLowerCase().includes(query) ||
        c.manufacturerName.toLowerCase().includes(query) ||
        c.reasonDescription.toLowerCase().includes(query)
      );
    }

    return result;
  }, [credits, selectedStatus, searchQuery]);

  const totalCreditAmount = useMemo(() => {
    return credits.reduce((sum, c) => sum + c.totalAmount, 0);
  }, [credits]);

  const filterOptions = [
    { id: 'credit-number', label: 'Credit Number', type: 'text' as const },
    { id: 'customer', label: 'Customer', type: 'dropdown' as const },
    { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' as const },
    { id: 'reason', label: 'Reason', type: 'dropdown' as const },
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

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedCredit ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Credits</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage customer credits and adjustments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdvancedFilters filterOptions={filterOptions} />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                New Credit
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Credits</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{credits.length}</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Amount</div>
              <div className="text-2xl font-semibold text-red-600 mt-1">
                {formatCurrency(totalCreditAmount)}
              </div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Open Credits</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">
                {credits.filter(c => c.status === 'open').length}
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
                placeholder="Search credits..."
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

        {/* Credits Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-9 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Credit
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Customer
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Reason
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Date
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Amount
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
                Comm Ded.
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {filteredCredits.length === 0 ? (
                <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No credits found
                </div>
              ) : (
                filteredCredits.map((credit) => (
                  <div
                    key={credit.id}
                    onClick={() => setSelectedCredit(credit)}
                    className={`grid grid-cols-9 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                      selectedCredit?.id === credit.id ? 'bg-[var(--muted)]/30' : ''
                    }`}
                  >
                    <div className="col-span-2">
                      <div className="font-medium text-[var(--foreground)]">{credit.creditNumber}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Order: {credit.orderNumber}</div>
                      {credit.invoiceNumber && (
                        <div className="text-xs text-[var(--muted-foreground)]">Invoice: {credit.invoiceNumber}</div>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <span className="text-sm text-[var(--foreground)]">{credit.customerName}</span>
                        <div className="text-xs text-[var(--muted-foreground)]">{credit.manufacturerName}</div>
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">{credit.reasonDescription}</span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">{formatDate(credit.creditDate)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm font-medium text-red-600">{formatCurrency(credit.totalAmount)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-red-500">{formatCurrency(credit.totalCommissionDeduction)}</span>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${creditStatusColors[credit.status]}`}>
                        {creditStatusLabels[credit.status]}
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
      {selectedCredit && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedCredit.creditNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedCredit.customerName}</p>
            </div>
            <button
              onClick={() => setSelectedCredit(null)}
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
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${creditStatusColors[selectedCredit.status]}`}>
                  {creditStatusLabels[selectedCredit.status]}
                </span>
              </div>
            </div>

            {/* Credit Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Credit Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Credit Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCredit.creditDate)}</span>
                </div>
                {selectedCredit.appliedDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Applied Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCredit.appliedDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Reason</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedCredit.reasonDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Order</span>
                  <span className="text-sm text-[var(--primary)] cursor-pointer hover:underline">
                    {selectedCredit.orderNumber}
                  </span>
                </div>
                {selectedCredit.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Invoice</span>
                    <span className="text-sm text-[var(--primary)] cursor-pointer hover:underline">
                      {selectedCredit.invoiceNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedCredit.manufacturerName}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Line Items ({selectedCredit.lineItems.length})
              </h3>
              <div className="space-y-2">
                {selectedCredit.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(item.amount)}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}</span>
                      <span className="text-red-500">Comm Ded: {formatCurrency(item.commissionDeduction)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Deductions by Rep */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Deductions</h3>
              <div className="space-y-2">
                {selectedCredit.splitRates.map((split, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-medium text-[var(--foreground)]">{split.salesRepName}</span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">{split.splitPercentage}%</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(split.commissionAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Credit Totals</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Total Credit</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(selectedCredit.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-500">Total Commission Deduction</span>
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(selectedCredit.totalCommissionDeduction)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedCredit.notes && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg p-3">
                  {selectedCredit.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              {selectedCredit.status === 'open' && (
                <>
                  <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Edit Credit
                  </button>
                  <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                    Apply Credit
                  </button>
                </>
              )}
              <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Credit Modal */}
      {showCreateModal && (
        <CreateCreditModal
          onClose={() => setShowCreateModal(false)}
          onSave={(newCredit) => {
            setCredits([newCredit, ...credits]);
            setShowCreateModal(false);
          }}
        />
      )}
    </main>
  );
}
