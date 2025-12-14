'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockChecks,
  mockManufacturers,
} from '../../lib/data/rms-mock';
import {
  CommissionCheck,
  checkStatusLabels,
} from '../../lib/types/rms';

interface CheckDetailContentProps {
  checkId: string;
}

type TabType = 'line-items' | 'deductions' | 'notes' | 'tasks' | 'activity' | 'linked-objects' | 'settings';

interface Adjustment {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}
type CheckStatus = 'posted' | 'unposted';

const statusLabels: Record<CheckStatus, string> = {
  posted: 'Posted',
  unposted: 'Unposted',
};

// Column definitions for the line items table
type ColumnKey = 'number' | 'orderNumber' | 'customer' | 'salesRep' | 'commissionRate' | 'expectedCommission' | 'paidCommission' | 'balance' | 'paid';

const columnLabels: Record<ColumnKey, string> = {
  number: 'Number',
  orderNumber: 'Order Number',
  customer: 'Customer',
  salesRep: 'Sales Rep',
  commissionRate: 'Commission Rate',
  expectedCommission: 'Expected Commission',
  paidCommission: 'Stated Commission',
  balance: 'Balance',
  paid: 'On Check',
};

const defaultVisibleColumns: ColumnKey[] = [
  'number',
  'orderNumber',
  'customer',
  'salesRep',
  'commissionRate',
  'expectedCommission',
  'paidCommission',
  'balance',
  'paid',
];

interface LineItem {
  id: string;
  type: 'invoice' | 'credit';
  number: string;
  orderNumber: string;
  customer: string;
  salesRep: string;
  commissionRateExpected: number;
  commissionRateActual: number;
  expectedCommission: number;
  paidCommission: number;
  balance: number;
  paid: boolean;
}

export default function CheckDetailContent({ checkId }: CheckDetailContentProps) {
  const router = useRouter();
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(defaultVisibleColumns));
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Views state
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [activeView, setActiveView] = useState('default');
  const savedViews = [
    { id: 'default', name: 'Default', columns: defaultVisibleColumns },
    { id: 'compact', name: 'Compact', columns: ['number', 'orderNumber', 'expectedCommission', 'paidCommission', 'balance'] as ColumnKey[] },
    { id: 'full', name: 'Full Details', columns: Object.keys(columnLabels) as ColumnKey[] },
  ];

  // Sections state
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [showSections, setShowSections] = useState(false);

  // Settings state
  const [commissionSource, setCommissionSource] = useState<'invoice' | 'order'>('invoice');

  // Lines to Reconcile state
  const [selectedCheckNumbers, setSelectedCheckNumbers] = useState<string[]>([checkId]);
  const [showCheckNumbersDropdown, setShowCheckNumbersDropdown] = useState(false);
  const [checkNumberSearch, setCheckNumberSearch] = useState('');
  const [unpaidInvoicesAfterDate, setUnpaidInvoicesAfterDate] = useState('');
  const [includeAllUnpaid, setIncludeAllUnpaid] = useState(false);
  const [ordersWithoutInvoicesAfterDate, setOrdersWithoutInvoicesAfterDate] = useState('');
  const [includeAllOrdersWithoutInvoices, setIncludeAllOrdersWithoutInvoices] = useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<{version: number; date: string; isLatest: boolean}[]>([
    { version: 1, date: '12/14/2024', isLatest: true }
  ]);

  const check = useMemo(() => checks.find(c => c.id === checkId), [checks, checkId]);

  // Mock checks with unposted lines for dropdown
  const checksWithUnpostedLines = useMemo(() => [
    { id: checkId, checkNumber: check?.checkNumber || checkId, hasUnpostedLines: true },
    { id: 'CHK-001', checkNumber: 'CHK-001', hasUnpostedLines: true },
    { id: 'CHK-002', checkNumber: 'CHK-002', hasUnpostedLines: true },
    { id: 'CHK-003', checkNumber: 'CHK-003', hasUnpostedLines: true },
  ], [checkId, check?.checkNumber]);

  const filteredChecks = checksWithUnpostedLines.filter(c =>
    c.checkNumber.toLowerCase().includes(checkNumberSearch.toLowerCase())
  );

  // Form state for editable fields
  const [factory, setFactory] = useState(check?.manufacturerName || '');
  const [commissionMonth, setCommissionMonth] = useState(check?.commissionMonth || '');
  const [checkNumber, setCheckNumber] = useState(check?.checkNumber || '');
  const [commissionAmount, setCommissionAmount] = useState(check?.netAmount || 0);
  const [checkDate, setCheckDate] = useState(check?.checkDate || '');
  const [status, setStatus] = useState<CheckStatus>(check?.status === 'posted' ? 'posted' : 'unposted');
  const [isTotalStatedCommission, setIsTotalStatedCommission] = useState(false);
  const [isTiedToCommissionUpload, setIsTiedToCommissionUpload] = useState(true); // Default to true if check is associated

  // Adjustments state
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const addAdjustment = () => {
    const newId = `adj-${Date.now()}`;
    setAdjustments(prev => [...prev, {
      id: newId,
      description: '',
      amount: 0,
      type: 'debit',
    }]);
  };

  const deleteAdjustment = (id: string) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const updateAdjustment = (id: string, field: keyof Adjustment, value: string | number) => {
    setAdjustments(prev => prev.map(adj =>
      adj.id === id ? { ...adj, [field]: value } : adj
    ));
  };

  const totalAdjustments = useMemo(() => {
    return adjustments.reduce((sum, adj) => {
      return sum + (adj.type === 'debit' ? -adj.amount : adj.amount);
    }, 0);
  }, [adjustments]);

  // Mock line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 'li-1',
      type: 'invoice',
      number: '124827047283',
      orderNumber: 'APC66579-0926',
      customer: '-',
      salesRep: 'Outside Rep',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 663.55,
      paidCommission: 663.55,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-2',
      type: 'invoice',
      number: '124827053754',
      orderNumber: '4500926810',
      customer: '-',
      salesRep: 'Outside Rep',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 604.68,
      paidCommission: 604.68,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-3',
      type: 'invoice',
      number: '124827055807',
      orderNumber: '4500988293',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 725.05,
      paidCommission: 725.05,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-4',
      type: 'invoice',
      number: '124827056113',
      orderNumber: '4500975453',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 534.43,
      paidCommission: 534.43,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-5',
      type: 'invoice',
      number: '124827056124',
      orderNumber: '4500988293',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 252.79,
      paidCommission: 252.79,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-6',
      type: 'invoice',
      number: '124827056355',
      orderNumber: '01225542 R-00529/000',
      customer: '-',
      salesRep: 'David Carnaggio',
      commissionRateExpected: 1.440,
      commissionRateActual: 1.440,
      expectedCommission: 55.53,
      paidCommission: 55.53,
      balance: 0,
      paid: true,
    },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (s: CheckStatus) => {
    const colors: Record<CheckStatus, string> = {
      posted: 'bg-blue-100 text-blue-700',
      unposted: 'bg-gray-100 text-gray-700',
    };
    return colors[s];
  };

  const toggleAllLineItems = () => {
    if (lineItems.length > 0 && lineItems.every(item => selectedLineItems.has(item.id))) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(new Set(lineItems.map(li => li.id)));
    }
  };

  const toggleLineItemSelection = (id: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const addNewLine = () => {
    const newId = `li-${Date.now()}`;
    setLineItems(prev => [...prev, {
      id: newId,
      type: 'invoice',
      number: '',
      orderNumber: '',
      customer: '-',
      salesRep: '',
      commissionRateExpected: 0,
      commissionRateActual: 0,
      expectedCommission: 0,
      paidCommission: 0,
      balance: 0,
      paid: false,
    }]);
  };

  const deleteLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const togglePaid = (id: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, paid: !item.paid } : item
    ));
  };

  // Summary calculations
  const summary = useMemo(() => {
    const expectedTotal = lineItems.reduce((sum, item) => sum + item.expectedCommission, 0);
    const paidTotal = lineItems.reduce((sum, item) => sum + item.paidCommission, 0);
    const balanceTotal = lineItems.reduce((sum, item) => sum + item.balance, 0);
    return { expectedTotal, paidTotal, balanceTotal, lineCount: lineItems.length };
  }, [lineItems]);

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
    <main className="flex-1 overflow-auto bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/commissions')}
              className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{check.checkNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Actions
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showActionsDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActionsDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg">Import Items</button>
                    <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors">Export</button>
                    <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg">Duplicate Check</button>
                  </div>
                </>
              )}
            </div>

            {/* Version Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                v{currentVersion}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showVersionDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVersionDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    {availableVersions.map((v) => (
                      <button
                        key={v.version}
                        onClick={() => { setCurrentVersion(v.version); setShowVersionDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${currentVersion === v.version ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>v{v.version}</span>
                          {v.isLatest && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Latest</span>}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{v.date}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(status)}`}
              >
                {statusLabels[status]}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-36 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
                    {(['unposted', 'posted'] as CheckStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setShowStatusDropdown(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${status === s ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium' : 'hover:bg-[var(--muted)]'}`}
                      >
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Save Button */}
            <div className="relative">
              <div className="flex">
                <button onClick={() => alert('Saved!')} className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                  className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {showSaveDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSaveDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    <button onClick={() => setShowSaveDropdown(false)} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg">Save</button>
                    <button onClick={() => { setShowSaveDropdown(false); router.push('/commissions'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors">Save & Close</button>
                    <button onClick={() => setShowSaveDropdown(false)} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg border-t border-[var(--border)]">Save as New Version</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Header Fields */}
      <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
        <button
          onClick={() => setShowHeaderFields(!showHeaderFields)}
          className="w-full px-6 py-2 flex items-center justify-between text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <span className="font-medium">Check Details</span>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showHeaderFields ? 'rotate-180' : ''}`}>
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showHeaderFields && (
          <div className="px-6 pb-4">
            <div className="flex gap-6">
              {/* Left side - Form fields */}
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Factory</label>
                    <input
                      type="text"
                      value={check?.manufacturerName || '-'}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Number</label>
                    <input type="text" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"/>
                    <div className="relative inline-block group">
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="checkbox"
                          checked={isTiedToCommissionUpload}
                          readOnly
                          className="w-3.5 h-3.5 accent-[var(--primary)] pointer-events-none"
                        />
                        <span className="text-xs text-[var(--muted-foreground)] border-b border-dashed border-[var(--muted-foreground)] cursor-help">Tied to commission upload</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        Check is associated with a specific commission statement upload
                        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Date</label>
                    <input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Amount<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        value={isTotalStatedCommission ? summary.paidTotal : commissionAmount}
                        onChange={(e) => !isTotalStatedCommission && setCommissionAmount(Number(e.target.value))}
                        readOnly={isTotalStatedCommission}
                        className={`w-full pl-7 pr-3 py-2 border border-[var(--border)] rounded-md text-sm ${isTotalStatedCommission ? 'bg-gray-50 text-[var(--muted-foreground)] cursor-not-allowed' : 'bg-white'}`}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTotalStatedCommission}
                        onChange={(e) => setIsTotalStatedCommission(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[var(--primary)]"
                      />
                      <span className="text-xs text-[var(--muted-foreground)]">Is Total Stated Commission</span>
                    </label>
                  </div>
                </div>

                {/* Lines to Reconcile Section */}
                <div className="mt-4">
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">Lines to Reconcile</span>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                {/* Check Number Multi-Select */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Number</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCheckNumbersDropdown(!showCheckNumbersDropdown)}
                      className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-left flex items-center justify-between"
                    >
                      <span className={selectedCheckNumbers.length > 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
                        {selectedCheckNumbers.length > 0
                          ? `${selectedCheckNumbers.length} check${selectedCheckNumbers.length > 1 ? 's' : ''} selected`
                          : 'Select checks...'}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showCheckNumbersDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCheckNumbersDropdown(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                          <div className="p-2 border-b border-[var(--border)]">
                            <input
                              type="text"
                              placeholder="Search checks..."
                              value={checkNumberSearch}
                              onChange={(e) => setCheckNumberSearch(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[var(--muted)] border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredChecks.map(chk => {
                              const isCurrentCheck = chk.id === checkId;
                              return (
                                <label
                                  key={chk.id}
                                  className={`flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] ${isCurrentCheck ? 'cursor-not-allowed bg-[var(--muted)]/50' : 'cursor-pointer'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCheckNumbers.includes(chk.id)}
                                    disabled={isCurrentCheck}
                                    onChange={() => {
                                      if (!isCurrentCheck) {
                                        setSelectedCheckNumbers(prev =>
                                          prev.includes(chk.id)
                                            ? prev.filter(c => c !== chk.id)
                                            : [...prev, chk.id]
                                        );
                                      }
                                    }}
                                    className="accent-[var(--primary)]"
                                  />
                                  <span className="text-sm">{chk.checkNumber}</span>
                                  {isCurrentCheck && <span className="text-xs text-[var(--muted-foreground)]">(current)</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Unpaid Invoices After */}
                <div>
                  <div className="relative inline-block group">
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1 cursor-help border-b border-dashed border-[var(--muted-foreground)] inline-block">
                      Invoices after:
                    </label>
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      Does not include invoices marked "dormant" or on other checks
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={unpaidInvoicesAfterDate}
                    onChange={(e) => setUnpaidInvoicesAfterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAllUnpaid}
                      onChange={(e) => setIncludeAllUnpaid(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--primary)]"
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">All</span>
                  </label>
                </div>

                {/* Orders Without Invoices After */}
                <div>
                  <div className="relative inline-block group">
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1 cursor-help border-b border-dashed border-[var(--muted-foreground)] inline-block">
                      Orders without invoices after:
                    </label>
                    <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      Does not include orders marked "dormant" or on other checks
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={ordersWithoutInvoicesAfterDate}
                    onChange={(e) => setOrdersWithoutInvoicesAfterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                  />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAllOrdersWithoutInvoices}
                      onChange={(e) => setIncludeAllOrdersWithoutInvoices(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--primary)]"
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">All</span>
                  </label>
                </div>
              </div>
            </div>
              </div>

              {/* Right side - Reconciliation Summary */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-[var(--border)] p-4">
                  {(() => {
                    const checkAmt = isTotalStatedCommission ? summary.paidTotal : commissionAmount;
                    const balance = checkAmt - summary.paidTotal + totalAdjustments;
                    return (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-[var(--muted-foreground)]">Check Amount</span>
                            <span className="text-sm font-medium text-[var(--foreground)]">${checkAmt.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-[var(--muted-foreground)]">Stated Commissions</span>
                            <span className="text-sm font-medium text-[var(--foreground)]">-${summary.paidTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-[var(--muted-foreground)]">Adjustments</span>
                            <span className={`text-sm font-medium ${totalAdjustments === 0 ? 'text-[var(--foreground)]' : totalAdjustments < 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {totalAdjustments < 0 ? '-' : totalAdjustments > 0 ? '+' : ''}${Math.abs(totalAdjustments).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Balance to Reconcile</span>
                            <span className={`text-sm font-semibold ${balance === 0 ? 'text-green-600' : balance > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                              ${balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {balance !== 0 && (
                          <div className="mt-3">
                            <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--primary)] rounded-full transition-all"
                                style={{ width: `${Math.min(checkAmt > 0 ? ((summary.paidTotal - totalAdjustments) / checkAmt) * 100 : 0, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1 text-center">
                              {checkAmt > 0 ? (((summary.paidTotal - totalAdjustments) / checkAmt) * 100).toFixed(0) : 0}% reconciled
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {[
                { id: 'line-items', label: 'Line Items', count: lineItems.length },
                { id: 'deductions', label: 'Deductions', count: adjustments.length > 0 ? adjustments.length : undefined },
                { id: 'notes', label: 'Notes' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'activity', label: 'Activity' },
                { id: 'linked-objects', label: 'Linked Objects' },
                { id: 'settings', label: 'Settings' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Controls */}
            {activeTab === 'line-items' && (
              <div className="flex items-center gap-3 pb-2">
                {/* Views Dropdown (Custom) */}
                <div className="relative">
                  <button
                    onClick={() => setShowViewsMenu(!showViewsMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M8 8v9"/>
                    </svg>
                    {savedViews.find(v => v.id === activeView)?.name || 'Custom'}
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showViewsMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowViewsMenu(false)} />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                        <div className="p-2 border-b border-[var(--border)]">
                          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Saved Views</p>
                        </div>
                        {savedViews.map(view => (
                          <button
                            key={view.id}
                            onClick={() => { setVisibleColumns(new Set(view.columns)); setActiveView(view.id); setShowViewsMenu(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${activeView === view.id ? 'text-[var(--primary)] font-medium' : ''}`}
                          >
                            {view.name}
                            {activeView === view.id && (
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Sections Button */}
                <button
                  onClick={() => setShowSectionsModal(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${showSections ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] hover:bg-[var(--muted)]'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="14" height="4" rx="1"/>
                    <rect x="3" y="10" width="14" height="7" rx="1"/>
                  </svg>
                  Sections
                </button>

                {/* Columns Button */}
                <button
                  onClick={() => setShowColumnsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                  </svg>
                  Columns
                  <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{visibleColumns.size}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'line-items' && (
            <div className="space-y-4">
              {/* Line Items Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-[var(--card)] sticky top-0 z-20">
                    <tr className="border-b border-[var(--border)]">
                      {visibleColumns.has('number') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Number</th>
                      )}
                      {visibleColumns.has('orderNumber') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Order Number</th>
                      )}
                      {visibleColumns.has('customer') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Customer</th>
                      )}
                      {visibleColumns.has('salesRep') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Sales Rep</th>
                      )}
                      {visibleColumns.has('commissionRate') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Commission Rate</th>
                      )}
                      {visibleColumns.has('expectedCommission') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                          <div className="relative inline-block group">
                            <span className="cursor-help border-b border-dashed border-[var(--muted-foreground)]">
                              Expected Commission
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              Totaled from {commissionSource === 'invoice' ? 'Invoices' : 'Orders'}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('paidCommission') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Stated Commission</th>
                      )}
                      {visibleColumns.has('balance') && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Balance</th>
                      )}
                      {visibleColumns.has('paid') && (
                        <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">On Check</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors"
                      >
                        {visibleColumns.has('number') && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 border border-blue-200">
                                {item.type === 'invoice' ? 'Invoice' : 'Credit'}
                              </span>
                              <span className="text-sm text-[var(--foreground)]">{item.number}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('orderNumber') && (
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.orderNumber}</td>
                        )}
                        {visibleColumns.has('customer') && (
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.customer}</td>
                        )}
                        {visibleColumns.has('salesRep') && (
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.salesRep}</td>
                        )}
                        {visibleColumns.has('commissionRate') && (
                          <td className="px-4 py-3 text-sm">
                            <span className="text-[var(--foreground)]">{item.commissionRateExpected.toFixed(3)}%</span>
                            <span className="mx-1 text-[var(--muted-foreground)]">|</span>
                            <span className="text-[var(--primary)]">{item.commissionRateActual.toFixed(3)}%</span>
                          </td>
                        )}
                        {visibleColumns.has('expectedCommission') && (
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">${item.expectedCommission.toFixed(4)}</td>
                        )}
                        {visibleColumns.has('paidCommission') && (
                          <td className="px-4 py-3 text-sm text-[var(--foreground)]">${item.paidCommission.toFixed(4)}</td>
                        )}
                        {visibleColumns.has('balance') && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {item.balance === 0 && (
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-green-500">
                                  <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              <span className="text-green-600">${item.balance.toFixed(4)}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('paid') && (
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.paid}
                              onChange={() => togglePaid(item.id)}
                              className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Line Button */}
                <div className="border-t border-[var(--border)]">
                  <button onClick={addNewLine} className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Line
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">No notes yet</p>
            </div>
          )}

          {activeTab === 'deductions' && (
            <div className="space-y-4">
              {/* Adjustments Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                {adjustments.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] w-32">Type</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)] w-40">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustments.map(adj => (
                        <tr key={adj.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={adj.description}
                              onChange={(e) => updateAdjustment(adj.id, 'description', e.target.value)}
                              placeholder="Enter description..."
                              className="w-full px-2 py-1 bg-transparent border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={adj.type}
                              onChange={(e) => updateAdjustment(adj.id, 'type', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            >
                              <option value="debit">Debit (-)</option>
                              <option value="credit">Credit (+)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                              <input
                                type="number"
                                value={adj.amount}
                                onChange={(e) => updateAdjustment(adj.id, 'amount', Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-1 bg-transparent border border-[var(--border)] rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteAdjustment(adj.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6h8M8 6V4h4v2M4 6h12v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {adjustments.length > 0 && (
                      <tfoot>
                        <tr className="bg-[var(--muted)]/30">
                          <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]" colSpan={2}>Total Adjustments</td>
                          <td className={`px-4 py-3 text-sm font-semibold text-right ${totalAdjustments < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {totalAdjustments < 0 ? '-' : ''}${Math.abs(totalAdjustments).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[var(--muted-foreground)] text-sm">No adjustments yet</p>
                  </div>
                )}

                {/* Add Adjustment Button */}
                <div className="border-t border-[var(--border)]">
                  <button onClick={addAdjustment} className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Adjustment
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">No tasks yet</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">No activity yet</p>
            </div>
          )}

          {activeTab === 'linked-objects' && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">No linked objects</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Commission Settings</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">Configure how commissions are calculated for this check.</p>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Expected Commission Source
                      </label>
                      <p className="text-sm text-[var(--muted-foreground)] mb-3">
                        Choose whether expected commission totals are calculated from invoices or orders.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCommissionSource('invoice')}
                          className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                            commissionSource === 'invoice'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'border-[var(--border)] hover:bg-[var(--muted)]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h12v14H4zM7 8h6M7 11h6M7 14h4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            From Invoices
                          </div>
                        </button>
                        <button
                          onClick={() => setCommissionSource('order')}
                          className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                            commissionSource === 'order'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'border-[var(--border)] hover:bg-[var(--muted)]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 3h14v4H3zM3 10h14v7H3zM7 7v3M13 7v3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            From Orders
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columns Modal */}
      {showColumnsModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowColumnsModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[var(--card)] rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold">Toggle Columns</h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {(Object.keys(columnLabels) as ColumnKey[]).map(col => (
                <label key={col} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-[var(--muted)] px-2 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col)}
                    onChange={() => {
                      setVisibleColumns(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(col)) newSet.delete(col);
                        else newSet.add(col);
                        return newSet;
                      });
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm">{columnLabels[col]}</span>
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end">
              <button onClick={() => setShowColumnsModal(false)} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm">Done</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
