'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockChecks,
  mockManufacturers,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import {
  CommissionCheck,
  checkStatusLabels,
  checkStatusColors,
} from '../../lib/types/rms';

interface CheckDetailContentProps {
  checkId: string;
}

interface LineItem {
  id: string;
  type: 'invoice' | 'credit' | 'expense';
  number: string;
  orderNumber: string;
  customer: string;
  salesRep: string;
  commissionRate: number;
  paidRate: number;
  expectedCommission: number;
  paidCommission: number;
  balance: number;
  isPaid: boolean;
}

type TabId = 'lines' | 'notes' | 'files' | 'activity';

export default function CheckDetailContent({ checkId }: CheckDetailContentProps) {
  const router = useRouter();
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);
  const [activeTab, setActiveTab] = useState<TabId>('lines');
  const [showSidebar, setShowSidebar] = useState(true);

  const check = useMemo(() => checks.find(c => c.id === checkId), [checks, checkId]);

  // Form state for editable fields
  const [factory, setFactory] = useState(check?.manufacturerName || '');
  const [commissionMonth, setCommissionMonth] = useState(check?.commissionMonth || '');
  const [checkNumber, setCheckNumber] = useState(check?.checkNumber || '');
  const [commissionAmount, setCommissionAmount] = useState(check?.netAmount || 0);
  const [checkDate, setCheckDate] = useState(check?.checkDate || '');

  // Mock line items based on check details
  const lineItems: LineItem[] = useMemo(() => {
    if (!check) return [];
    return check.details.map((detail, index) => ({
      id: detail.id,
      type: detail.type as 'invoice' | 'credit' | 'expense',
      number: detail.referenceNumber,
      orderNumber: detail.orderNumber || '-',
      customer: detail.customerName || '-',
      salesRep: index === 0 ? 'Jacobi Smith' : 'House Account',
      commissionRate: 4.0,
      paidRate: index === 0 ? 4.0 : 0.0,
      expectedCommission: Math.abs(detail.amount),
      paidCommission: index === 0 ? Math.abs(detail.amount) : 0,
      balance: index === 0 ? 0 : -Math.abs(detail.amount),
      isPaid: index === 0,
    }));
  }, [check]);

  // Summary calculations
  const summary = useMemo(() => {
    const paidCommissions = lineItems.reduce((sum, item) => sum + item.paidCommission, 0);
    const expectedCommission = lineItems.reduce((sum, item) => sum + item.expectedCommission, 0);
    const balance = lineItems.reduce((sum, item) => sum + item.balance, 0);
    return {
      paidCommissions,
      creditsApplied: 0,
      expensesApplied: 0,
      appliedTotal: paidCommissions,
      expectedCommission,
      adjustedExpectedCommission: expectedCommission,
      balance,
    };
  }, [lineItems]);

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
    return new Date(monthString + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'lines', label: 'Lines Items', count: lineItems.length },
    { id: 'notes', label: 'Notes', count: 0 },
    { id: 'files', label: 'Files', count: 0 },
    { id: 'activity', label: 'Activity Feed' },
  ];

  if (!check) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Check not found</h2>
          <p className="text-[var(--muted-foreground)] mt-2">The commission check you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/commissions')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Commissions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/commissions')}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l5 5M5 10l5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{check.checkNumber}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${checkStatusColors[check.status]}`}>
                {checkStatusLabels[check.status]}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{check.manufacturerName || 'Commission Check'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.status === 'draft' && (
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Post Check
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Import Items
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m8-8H4"/>
            </svg>
            Create New Items
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>
          <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            Save
          </button>
        </div>
      </div>

      {/* Check Meta Information - Quotes Style */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Check Info */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Check Details</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Factory:</label>
                <select
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select factory</option>
                  {mockManufacturers.map(mfg => (
                    <option key={mfg.id} value={mfg.name}>{mfg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Commission Month:</label>
                <input
                  type="month"
                  value={commissionMonth}
                  onChange={(e) => setCommissionMonth(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Check Number:</label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Check Date:</label>
                <input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>
          </div>

          {/* Middle Column - Amounts */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Amounts</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Commission Amount:</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                  <input
                    type="number"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Net Amount:</label>
                <p className="text-sm font-medium text-[var(--foreground)] py-1">{formatCurrency(check.netAmount)}</p>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Invoice Payments:</label>
                <p className="text-sm text-green-600 py-1">+{formatCurrency(check.invoicePayments)}</p>
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)]">Check Balance:</label>
                <p className="text-sm font-medium text-[var(--foreground)] py-1">{formatCurrency(check.checkBalance)}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Dates */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Dates</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[var(--muted-foreground)] w-20">Post Date:</label>
                <p className="text-sm text-[var(--foreground)]">{check.postDate ? formatDate(check.postDate) : '-'}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-[var(--muted-foreground)] w-20">Entry Date:</label>
                <p className="text-sm text-[var(--foreground)]">{check.entryDate ? formatDate(check.entryDate) : '-'}</p>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] space-y-1 pt-1">
                <p>Created: {formatDate(check.createdDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Lines Items Tab */}
        {activeTab === 'lines' && (
          <>
            {/* Main Content - Line Items Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30 sticky top-0">
                  <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Sales Rep</th>
                    <th className="px-4 py-3 text-right">Comm Rate</th>
                    <th className="px-4 py-3 text-right">Expected Comm</th>
                    <th className="px-4 py-3 text-right">Paid Comm</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-center">Paid</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          item.type === 'invoice' ? 'bg-blue-100 text-blue-700' :
                          item.type === 'credit' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--primary)]">{item.number}</td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.customer}</td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.salesRep}</td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">
                        {item.commissionRate}% | <span className={item.paidRate > 0 ? 'text-green-600' : 'text-red-500'}>{item.paidRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{formatCurrency(item.expectedCommission)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(item.paidCommission)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.isPaid}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)]">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z"/>
                            </svg>
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-500">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Item Button */}
              <div className="p-4 border-t border-[var(--border)]">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                  </svg>
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Right Sidebar - Summary & Progress */}
            {showSidebar && (
              <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto flex flex-col">
                <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Summary</span>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 15l5-5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Progress Bar - Moved to Sidebar */}
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Entered +/-</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted-foreground)]">Progress</span>
                      <span className={`font-medium ${summary.paidCommissions >= commissionAmount ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(summary.paidCommissions - commissionAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${summary.paidCommissions >= commissionAmount ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((summary.paidCommissions / commissionAmount) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatCurrency(summary.paidCommissions)} of {formatCurrency(commissionAmount)} entered
                    </p>
                  </div>
                </div>

                {/* Commission Summary */}
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Commission Summary</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Paid Commissions</span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.paidCommissions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Credits Applied</span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.creditsApplied)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Expenses Applied</span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.expensesApplied)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-sm font-medium text-[var(--foreground)]">Applied Total</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(summary.appliedTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Expected Commission */}
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Expected Commission</span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.expectedCommission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Adjusted Expected</span>
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.adjustedExpectedCommission)}</span>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Balance</span>
                    <span className={`text-sm font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.balance)}
                    </span>
                  </div>
                </div>

                {/* Check Totals */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Check Totals</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Invoice Payments</span>
                      <span className="text-sm text-green-600">+{formatCurrency(check.invoicePayments)}</span>
                    </div>
                    {check.expenseAdjustments !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">Expense Adjustments</span>
                        <span className="text-sm text-blue-600">{formatCurrency(check.expenseAdjustments)}</span>
                      </div>
                    )}
                    {check.creditDeductions !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">Credit Deductions</span>
                        <span className="text-sm text-red-600">-{formatCurrency(check.creditDeductions)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-sm font-semibold text-[var(--foreground)]">Net Amount</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(check.netAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-[var(--foreground)]">Check Balance</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(check.checkBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar toggle when hidden */}
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-[var(--card)] border border-[var(--border)] rounded-l-lg shadow-sm hover:bg-[var(--muted)] transition-colors z-10"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No notes yet</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Add notes to keep track of important information about this check</p>
              <button className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
                Add Note
              </button>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                  <path d="M13 2v7h7"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No files attached</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Upload files to attach them to this check</p>
              <button className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
                Upload Files
              </button>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No activity yet</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Activity will appear here as changes are made to this check</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
