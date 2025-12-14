'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

interface LineItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customer: string;
  manufacturer: string;
  quantity: number;
  uom: string;
  divisor: number;
  unitPrice: number;
  sellTotal: number;
  commissionPercent: number;
  commissionAmount: number;
}

type TabId = 'lines' | 'notes' | 'files' | 'activity';
type CheckStatus = 'draft' | 'pending' | 'posted' | 'reconciled' | 'disputed';
type SortColumn = 'invoiceNumber' | 'orderNumber' | 'customer' | 'manufacturer' | 'quantity' | 'unitPrice' | 'sellTotal' | 'commissionPercent';
type SortDirection = 'asc' | 'desc';

// Mock invoice/order data for dropdown
const mockInvoices = [
  { id: 'inv-1', number: 'INV-2024-001', orderNumber: 'ORD-1001', customer: 'Turner Construction' },
  { id: 'inv-2', number: 'INV-2024-002', orderNumber: 'ORD-1002', customer: 'Hensel Phelps' },
  { id: 'inv-3', number: 'INV-2024-003', orderNumber: 'ORD-1003', customer: 'McCarthy Building' },
  { id: 'inv-4', number: 'INV-2024-004', orderNumber: 'ORD-1004', customer: 'Skanska USA' },
  { id: 'inv-5', number: 'INV-2024-005', orderNumber: 'ORD-1005', customer: 'Clark Construction' },
];

export default function CheckDetailContent({ checkId }: CheckDetailContentProps) {
  const router = useRouter();
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);
  const [activeTab, setActiveTab] = useState<TabId>('lines');
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<{version: number; date: string; isLatest: boolean}[]>([
    { version: 1, date: '12/14/2024', isLatest: true }
  ]);

  // Table state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());

  // Invoice search dropdown state
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState<string | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Manufacturer dropdown state
  const [manufacturerDropdown, setManufacturerDropdown] = useState<string | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  const check = useMemo(() => checks.find(c => c.id === checkId), [checks, checkId]);

  // Form state for editable fields
  const [factory, setFactory] = useState(check?.manufacturerName || '');
  const [commissionMonth, setCommissionMonth] = useState(check?.commissionMonth || '');
  const [checkNumber, setCheckNumber] = useState(check?.checkNumber || '');
  const [commissionAmount, setCommissionAmount] = useState(check?.netAmount || 0);
  const [checkDate, setCheckDate] = useState(check?.checkDate || '');
  const [status, setStatus] = useState<CheckStatus>(check?.status || 'draft');

  // Line items state (editable)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 'li-1',
      invoiceNumber: 'INV-2024-001',
      orderNumber: 'ORD-1001',
      customer: 'Turner Construction',
      manufacturer: 'Acuity Brands',
      quantity: 400,
      uom: 'EA',
      divisor: 1,
      unitPrice: 220,
      sellTotal: 88000,
      commissionPercent: 0.09,
      commissionAmount: 7920,
    },
    {
      id: 'li-2',
      invoiceNumber: 'INV-2024-002',
      orderNumber: 'ORD-1002',
      customer: 'Hensel Phelps',
      manufacturer: 'Finelite',
      quantity: 600,
      uom: 'EA',
      divisor: 1,
      unitPrice: 96,
      sellTotal: 57600,
      commissionPercent: 0.07,
      commissionAmount: 4032,
    },
    {
      id: 'li-3',
      invoiceNumber: 'INV-2024-003',
      orderNumber: 'ORD-1003',
      customer: 'McCarthy Building',
      manufacturer: 'Lutron',
      quantity: 50,
      uom: 'EA',
      divisor: 1,
      unitPrice: 1437.5,
      sellTotal: 71875,
      commissionPercent: 0.08,
      commissionAmount: 5750,
    },
  ]);

  // Summary calculations
  const summary = useMemo(() => {
    const sellTotal = lineItems.reduce((sum, item) => sum + item.sellTotal, 0);
    const commissionTotal = lineItems.reduce((sum, item) => sum + item.commissionAmount, 0);
    return {
      sellTotal,
      commissionTotal,
      lineCount: lineItems.length,
    };
  }, [lineItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (s: CheckStatus) => {
    const colors: Record<CheckStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      posted: 'bg-blue-100 text-blue-700',
      reconciled: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
    };
    return colors[s];
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: number | string) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      // Recalculate sell total and commission when relevant fields change
      if (field === 'quantity' || field === 'unitPrice' || field === 'divisor') {
        updated.sellTotal = (updated.quantity * updated.unitPrice) / updated.divisor;
        updated.commissionAmount = updated.sellTotal * updated.commissionPercent;
      }
      if (field === 'commissionPercent') {
        updated.commissionAmount = updated.sellTotal * (value as number);
      }
      return updated;
    }));
  };

  const addNewLine = () => {
    const newId = `li-${Date.now()}`;
    setLineItems(prev => [...prev, {
      id: newId,
      invoiceNumber: '',
      orderNumber: '',
      customer: '',
      manufacturer: '',
      quantity: 1,
      uom: 'EA',
      divisor: 1,
      unitPrice: 0,
      sellTotal: 0,
      commissionPercent: 0.08,
      commissionAmount: 0,
    }]);
  };

  const selectInvoice = (lineId: string, invoice: typeof mockInvoices[0]) => {
    setLineItems(prev => prev.map(item =>
      item.id === lineId
        ? { ...item, invoiceNumber: invoice.number, orderNumber: invoice.orderNumber, customer: invoice.customer }
        : item
    ));
    setInvoiceSearchOpen(null);
    setInvoiceSearchQuery('');
  };

  const filteredInvoices = mockInvoices.filter(inv =>
    inv.number.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    inv.orderNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    inv.customer.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
  );

  const filteredManufacturers = mockManufacturers.filter(mfr =>
    mfr.name.toLowerCase().includes(manufacturerSearch.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (invoiceSearchOpen && !(e.target as Element).closest('.invoice-search-container')) {
        setInvoiceSearchOpen(null);
        setInvoiceSearchQuery('');
      }
      if (manufacturerDropdown && !(e.target as Element).closest('.manufacturer-dropdown-container')) {
        setManufacturerDropdown(null);
        setManufacturerSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [invoiceSearchOpen, manufacturerDropdown]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'lines', label: 'Line Items', count: lineItems.length },
    { id: 'notes', label: 'Notes' },
    { id: 'files', label: 'Files' },
    { id: 'activity', label: 'Activity' },
  ];

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'invoiceNumber', 'orderNumber', 'customer', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commissionAmount'
  ]));

  const columnDefinitions = [
    { key: 'invoiceNumber', label: 'Invoice #', filterable: true, sortable: true },
    { key: 'orderNumber', label: 'Order #', filterable: true, sortable: true },
    { key: 'customer', label: 'Customer', filterable: true, sortable: true },
    { key: 'manufacturer', label: 'Manufacturer', filterable: true, sortable: true },
    { key: 'quantity', label: 'QTY', filterable: false, sortable: true },
    { key: 'uom', label: 'UOM', filterable: false, sortable: false },
    { key: 'divisor', label: 'Divisor', filterable: false, sortable: false },
    { key: 'unitPrice', label: 'Unit Price', filterable: false, sortable: true },
    { key: 'sellTotal', label: 'Sell Total', filterable: false, sortable: true },
    { key: 'commissionPercent', label: 'Commission %', filterable: false, sortable: true },
    { key: 'commissionAmount', label: 'Commission $', filterable: false, sortable: true },
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
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/commissions')}
                className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
                title="Back to Commissions"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{check.checkNumber}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowActionsDropdown(!showActionsDropdown);
                  setShowStatusDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Actions
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showActionsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Import Items
                  </button>
                  <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Export
                  </button>
                  <button onClick={() => setShowActionsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                      <path d="M4 14V4a2 2 0 012-2h10"/>
                    </svg>
                    Duplicate Check
                  </button>
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowActionsDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(status)}`}
              >
                {checkStatusLabels[status]}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {(['draft', 'pending', 'posted', 'reconciled', 'disputed'] as CheckStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatus(s);
                        setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status: s } : c));
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        status === s ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      {checkStatusLabels[s]}
                      {status === s && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Version Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowVersionDropdown(!showVersionDropdown);
                  setShowActionsDropdown(false);
                  setShowStatusDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                v{currentVersion}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showVersionDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVersionDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                    {availableVersions.map((v) => (
                      <button
                        key={v.version}
                        onClick={() => {
                          setCurrentVersion(v.version);
                          setShowVersionDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                          currentVersion === v.version ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>v{v.version}</span>
                          {v.isLatest && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Latest</span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{v.date}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Post Check Button */}
            {status === 'draft' && (
              <button
                onClick={() => {
                  setStatus('posted');
                  setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status: 'posted' } : c));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Post Check
              </button>
            )}

            {/* PDF Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PDF
            </button>

            {/* Save Button with Dropdown */}
            <div className="relative">
              <div className="flex">
                <button onClick={() => alert('Check saved!')} className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDropdown(!showSaveDropdown);
                    setShowActionsDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                  className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {showSaveDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                  <button onClick={() => { alert('Check saved!'); setShowSaveDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg">
                    Save
                  </button>
                  <button onClick={() => { alert('Saved and closed!'); setShowSaveDropdown(false); router.push('/commissions'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors">
                    Save & Close
                  </button>
                  <button
                    onClick={() => {
                      const newVersion = availableVersions.length + 1;
                      setAvailableVersions(prev => [
                        ...prev.map(v => ({ ...v, isLatest: false })),
                        { version: newVersion, date: new Date().toLocaleDateString(), isLatest: true }
                      ]);
                      setCurrentVersion(newVersion);
                      alert(`Saved as version ${newVersion}!`);
                      setShowSaveDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg border-t border-[var(--border)]"
                  >
                    Save as New Version
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--muted-foreground)]">
            Commission Amount: <span className="font-medium text-[var(--foreground)]">{formatCurrency(commissionAmount)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Sell Total: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(summary.sellTotal)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Commission: <span className="font-semibold text-green-600">{formatCurrency(summary.commissionTotal)}</span>
          </span>
        </div>
      </div>

      {/* Collapsible Header Fields Section */}
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
            <div className="grid grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Factory<span className="text-red-500">*</span></label>
                <select value={factory} onChange={(e) => setFactory(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer">
                  <option value="">Select factory...</option>
                  {mockManufacturers.map(mfg => (<option key={mfg.id} value={mfg.name}>{mfg.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Commission Month<span className="text-red-500">*</span></label>
                <input type="month" value={commissionMonth} onChange={(e) => setCommissionMonth(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Number</label>
                <input type="text" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Check Date</label>
                <input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Commission Amount<span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                  <input type="number" value={commissionAmount} onChange={(e) => setCommissionAmount(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Entry Progress</label>
                <div className="h-10 flex items-center">
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${summary.commissionTotal >= commissionAmount ? 'text-green-600' : 'text-orange-500'}`}>
                        {commissionAmount > 0 ? ((summary.commissionTotal / commissionAmount) * 100).toFixed(0) : 0}%
                      </span>
                      <span className={`font-medium ${summary.commissionTotal >= commissionAmount ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(summary.commissionTotal - commissionAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${summary.commissionTotal >= commissionAmount ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(commissionAmount > 0 ? (summary.commissionTotal / commissionAmount) * 100 : 0, 100)}%` }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--border)] flex-shrink-0 bg-white px-6">
            <div className="flex gap-0 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-[var(--primary)] border border-[var(--border)] border-b-white bg-white rounded-t-lg -mb-px'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      activeTab === tab.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-gray-100 text-gray-500'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Actions - Earnings View, Sections, Columns like Quotes */}
            {activeTab === 'lines' && (
              <div className="flex items-center gap-2">
                {/* Views Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowViewsDropdown(!showViewsDropdown); setShowColumnsDropdown(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="14" height="14" rx="2"/>
                      <path d="M3 8h14M8 8v9"/>
                    </svg>
                    Earnings View
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showViewsDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-lg z-20">
                      <button onClick={() => setShowViewsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors rounded-t-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        Earnings View
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline ml-2">
                          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button onClick={() => setShowViewsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">Compact View</button>
                      <button onClick={() => setShowViewsDropdown(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors rounded-b-lg">Full Details</button>
                    </div>
                  )}
                </div>

                {/* Sections Button */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="14" height="4" rx="1"/>
                    <rect x="3" y="10" width="14" height="7" rx="1"/>
                  </svg>
                  Sections
                </button>

                {/* Columns Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowColumnsDropdown(!showColumnsDropdown); setShowViewsDropdown(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 4v12M10 4v12M16 4v12" strokeLinecap="round"/>
                    </svg>
                    Columns
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{visibleColumns.size}</span>
                  </button>
                  {showColumnsDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                      <div className="p-2 border-b border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Toggle Columns</p>
                      </div>
                      {columnDefinitions.map(col => (
                        <label key={col.key} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visibleColumns.has(col.key)}
                            onChange={() => {
                              setVisibleColumns(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(col.key)) newSet.delete(col.key);
                                else newSet.add(col.key);
                                return newSet;
                              });
                            }}
                            className="rounded border-gray-300 text-[var(--primary)]"
                          />
                          <span className="text-sm">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto bg-white">
            {/* Lines Items Tab */}
            {activeTab === 'lines' && (
              <div className="flex-1 flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full">
                    <thead className="bg-white sticky top-0 border-b border-[var(--border)]">
                      <tr className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        <th className="px-4 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedLineItems.size === lineItems.length && lineItems.length > 0}
                            onChange={() => {
                              if (selectedLineItems.size === lineItems.length) {
                                setSelectedLineItems(new Set());
                              } else {
                                setSelectedLineItems(new Set(lineItems.map(li => li.id)));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>INVOICE #</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>ORDER #</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>DESCRIPTION</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>MANUFACTURER</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">QTY</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">UOM</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">DIVISOR</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">UNIT PRICE</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">SELL TOTAL</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">COMMISSION %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLineItems.has(item.id)}
                              onChange={() => {
                                setSelectedLineItems(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(item.id)) newSet.delete(item.id);
                                  else newSet.add(item.id);
                                  return newSet;
                                });
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          {/* Invoice Number - Dropdown style */}
                          <td className="px-4 py-3 text-sm relative">
                            <div className="invoice-search-container">
                              <button
                                onClick={() => {
                                  setInvoiceSearchOpen(invoiceSearchOpen === item.id ? null : item.id);
                                  setInvoiceSearchQuery(item.invoiceNumber);
                                }}
                                className="inline-flex items-center gap-1 text-left font-mono hover:text-[var(--primary)] transition-colors"
                              >
                                <span>{item.invoiceNumber || 'Select...'}</span>
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              {invoiceSearchOpen === item.id && (
                                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50">
                                  <div className="p-2 border-b border-[var(--border)]">
                                    <input
                                      type="text"
                                      value={invoiceSearchQuery}
                                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                                      placeholder="Search invoices..."
                                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredInvoices.map(inv => (
                                      <button
                                        key={inv.id}
                                        onClick={() => selectInvoice(item.id, inv)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="font-mono text-sm">{inv.number}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{inv.orderNumber} - {inv.customer}</div>
                                      </button>
                                    ))}
                                    {filteredInvoices.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No invoices found</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Order Number - Dropdown style */}
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                              <span>{item.orderNumber || 'Select...'}</span>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </td>
                          {/* Description - truncated with dropdown */}
                          <td className="px-4 py-3 text-sm max-w-[180px]">
                            <span className="inline-flex items-center gap-1 truncate">
                              <span className="truncate">{item.customer || 'Select...'}</span>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)] flex-shrink-0">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </td>
                          {/* Manufacturer - Dropdown style */}
                          <td className="px-4 py-3 text-sm relative">
                            <div className="manufacturer-dropdown-container">
                              <button
                                onClick={() => {
                                  setManufacturerDropdown(manufacturerDropdown === item.id ? null : item.id);
                                  setManufacturerSearch(item.manufacturer);
                                }}
                                className="inline-flex items-center gap-1 text-left hover:text-[var(--primary)] transition-colors"
                              >
                                <span>{item.manufacturer || 'Select...'}</span>
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-[var(--muted-foreground)]">
                                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              {manufacturerDropdown === item.id && (
                                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50">
                                  <div className="p-2 border-b border-[var(--border)]">
                                    <input
                                      type="text"
                                      value={manufacturerSearch}
                                      onChange={(e) => setManufacturerSearch(e.target.value)}
                                      placeholder="Search..."
                                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredManufacturers.map(mfr => (
                                      <button
                                        key={mfr.id}
                                        onClick={() => {
                                          updateLineItem(item.id, 'manufacturer', mfr.name);
                                          setManufacturerDropdown(null);
                                          setManufacturerSearch('');
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                                      >
                                        {mfr.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Quantity */}
                          <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                          {/* UOM */}
                          <td className="px-4 py-3 text-sm text-center text-[var(--muted-foreground)]">{item.uom}</td>
                          {/* Divisor */}
                          <td className="px-4 py-3 text-sm text-center text-[var(--muted-foreground)]">{item.divisor}</td>
                          {/* Unit Price */}
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                          {/* Sell Total */}
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.sellTotal)}</td>
                          {/* Commission % */}
                          <td className="px-4 py-3 text-sm text-right text-green-600">{item.commissionPercent.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Line Button */}
                <div className="px-4 py-3 border-t border-[var(--border)] bg-white">
                  <button
                    onClick={addNewLine}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add Line
                  </button>
                </div>

                {/* Progress bar at bottom */}
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-500"/>
              </div>
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
                  <button className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">Add Note</button>
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
                  <button className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">Upload Files</button>
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
        </div>
      </div>
    </main>
  );
}
