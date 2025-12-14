'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockInvoices,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate } from '../../lib/types/rms';
import {
  Invoice,
  invoiceStatusLabels,
  invoiceStatusColors,
} from '../../lib/types/rms';

interface InvoiceDetailContentProps {
  invoiceId: string;
}

type TabType = 'line-items' | 'payments' | 'notes' | 'tasks' | 'activity' | 'linked-objects' | 'settings';

// Column definitions for the line items table
type ColumnKey = 'partNumber' | 'custPartNumber' | 'description' | 'uom' | 'divisor' | 'unitPrice' | 'quantity' | 'sellTotal' | 'commission';

const columnLabels: Record<ColumnKey, string> = {
  partNumber: 'Part #',
  custPartNumber: 'Cust Part #',
  description: 'Description',
  uom: 'UOM',
  divisor: 'Divisor',
  unitPrice: 'Unit Price',
  quantity: 'Qty',
  sellTotal: 'Sell Total',
  commission: 'Commission',
};

const defaultVisibleColumns: ColumnKey[] = [
  'partNumber',
  'custPartNumber',
  'description',
  'uom',
  'divisor',
  'unitPrice',
  'sellTotal',
  'commission',
];

// Available reps
const availableOutsideReps = [
  { id: 'or-1', name: 'Richard Utley' },
  { id: 'or-2', name: 'Mike Thompson' },
  { id: 'or-3', name: 'Sarah Williams' },
  { id: 'or-4', name: 'Tom Davis' },
  { id: 'or-5', name: 'Chris Martin' },
];

const availableInsideReps = [
  { id: 'ir-1', name: 'Jennifer Adams' },
  { id: 'ir-2', name: 'Mark Stevens' },
  { id: 'ir-3', name: 'Rachel Green' },
  { id: 'ir-4', name: 'David Miller' },
  { id: 'ir-5', name: 'Emily Chen' },
];

export default function InvoiceDetailContent({ invoiceId }: InvoiceDetailContentProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(defaultVisibleColumns));
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<{version: number; date: string; isLatest: boolean}[]>([
    { version: 1, date: '12/14/2024', isLatest: true }
  ]);

  // PO Number state
  const [poNumber, setPoNumber] = useState<string>('');

  // Outside rep state
  const [invoiceOutsideRep, setInvoiceOutsideRep] = useState<string>('');
  const [splitOutsideCommission, setSplitOutsideCommission] = useState(false);
  const [showOutsideRepSplitsModal, setShowOutsideRepSplitsModal] = useState(false);
  const [outsideRepSplits, setOutsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Inside rep state
  const [invoiceInsideRep, setInvoiceInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepSplits, setInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  const invoice = useMemo(() => invoices.find(i => i.id === invoiceId), [invoices, invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const isOverdue = (inv: Invoice) => {
    if (inv.status !== 'open' && inv.status !== 'partial_paid') return false;
    return new Date(inv.dueDate) < new Date();
  };

  // Line item selection functions
  const toggleLineItemSelection = (itemId: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleAllLineItems = () => {
    if (!invoice) return;
    if (selectedLineItems.size === invoice.lineItems.length) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(new Set(invoice.lineItems.map(i => i.id)));
    }
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (invoice) {
      setEditedSplits([...invoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    if (invoice) {
      updated[index].commissionAmount = (invoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find(r => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = { ...updated[index], salesRepId: repId, salesRepName: rep.name };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (invoice) {
      const totalPercentage = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...invoice,
        splitRates: editedSplits,
      };
      setInvoices(invoices.map(i => i.id === invoice.id ? updatedInvoice : i));
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);

  // Column toggle handler
  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(col)) {
        newSet.delete(col);
      } else {
        newSet.add(col);
      }
      return newSet;
    });
  };

  // Get status color for the stage dropdown button
  const getStatusColor = (status: Invoice['status']) => {
    const colors: Record<Invoice['status'], string> = {
      open: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      partial_paid: 'bg-yellow-100 text-yellow-700',
      void: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!invoice) return { subtotal: 0, freight: 0, total: 0, commission: 0, amountPaid: 0, balance: 0 };
    return {
      subtotal: invoice.subtotal,
      freight: invoice.freight,
      total: invoice.total,
      commission: invoice.totalCommission,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
    };
  }, [invoice]);

  // Mock activity data
  const activities = [
    { id: 1, type: 'created', user: 'System', description: 'Invoice created', date: invoice?.invoiceDate || '' },
    { id: 2, type: 'status', user: 'John Smith', description: 'Invoice sent to customer', date: invoice?.invoiceDate || '' },
  ];

  // Mock payment data
  const payments = (invoice && invoice.amountPaid > 0) ? [
    { id: 1, date: invoice.paidDate || invoice.invoiceDate, amount: invoice.amountPaid, method: 'Check', reference: 'CHK-12345' },
  ] : [];

  if (!invoice) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Invoice not found</h2>
          <p className="text-[var(--muted-foreground)] mt-2">The invoice you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/invoices')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </main>
    );
  }

  const overdue = isOverdue(invoice);

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header - Matching Quotes Simple View */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/invoices')}
                className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
                title="Back to Invoices"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{invoice.invoiceNumber}</h1>
              {overdue && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Overdue
                </span>
              )}
              {invoice.isLocked && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Locked
                </span>
              )}
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
                  {(invoice.status === 'open' || invoice.status === 'partial_paid') && invoice.balance > 0 && (
                    <button
                      onClick={() => {
                        alert('Record payment');
                        setShowActionsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v6m0 0l3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 10h2m14 0h-2M6 14h8" strokeLinecap="round"/>
                      </svg>
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      alert('Create credit');
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create Credit
                  </button>
                  <button
                    onClick={() => {
                      alert('Duplicate invoice');
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                      <path d="M4 14V4a2 2 0 012-2h10"/>
                    </svg>
                    Duplicate Invoice
                  </button>
                  <button
                    onClick={() => {
                      alert('Email invoice');
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <path d="M22 6l-10 7L2 6"/>
                    </svg>
                    Email Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Status Dropdown - styled like a button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowActionsDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(invoice.status)}`}
              >
                {invoiceStatusLabels[invoice.status]}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  {(['open', 'paid', 'partial_paid', 'void'] as Invoice['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setInvoices(invoices.map(i => i.id === invoice.id ? { ...i, status } : i));
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        invoice.status === status ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      {invoiceStatusLabels[status]}
                      {invoice.status === status && (
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

            {/* View Mode Button */}
            <button
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="3"/>
              </svg>
              Simple View
            </button>

            {/* Generate PDF Button */}
            <button
              onClick={() => alert('Generate PDF')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
              </svg>
              PDF
            </button>

            {/* Save Button with Dropdown */}
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => alert('Invoice saved!')}
                  className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
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
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSaveDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-52 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => { alert('Invoice saved!'); setShowSaveDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        const newVersion = Math.max(...availableVersions.map(v => v.version)) + 1;
                        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                        setAvailableVersions(prev => [
                          ...prev.map(v => ({ ...v, isLatest: false })),
                          { version: newVersion, date: today, isLatest: true }
                        ]);
                        setCurrentVersion(newVersion);
                        setShowSaveDropdown(false);
                        alert(`Saved as version ${newVersion}`);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Save as New Version
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--muted-foreground)]">
            Subtotal: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.subtotal)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Freight: <span className="font-medium text-[var(--foreground)]">{formatCurrency(totals.freight)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Total: <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totals.total)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Paid: <span className="font-medium text-green-600">{formatCurrency(totals.amountPaid)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Balance: <span className={`font-semibold ${totals.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'}`}>{formatCurrency(totals.balance)}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Commission: <span className="font-medium text-purple-600">{formatCurrency(totals.commission)}</span>
          </span>
        </div>
      </div>

      {/* Collapsible Invoice Details Section */}
      <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
        <button
          onClick={() => setShowHeaderFields(!showHeaderFields)}
          className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
        >
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            {showHeaderFields ? 'Invoice Details' : 'Show Invoice Details'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--muted-foreground)] transition-transform ${showHeaderFields ? '' : 'rotate-180'}`}
          >
            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {showHeaderFields && (
          <div className="px-6 pb-4">
            {/* Row 1: Invoice Number, Sold To, Bill To, End User, Job, Payment Terms, Freight Terms */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Invoice Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Sold To Customer<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={invoice.customerName}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value={invoice.customerName}>{invoice.customerName}</option>
                    <option value="Turner Construction">Turner Construction</option>
                    <option value="Hensel Phelps">Hensel Phelps</option>
                    <option value="Skanska USA">Skanska USA</option>
                    <option value="DPR Construction">DPR Construction</option>
                    <option value="Clark Construction">Clark Construction</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Bill To Customer<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={invoice.manufacturerName}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value={invoice.manufacturerName}>{invoice.manufacturerName}</option>
                    <option value="Graybar Electric">Graybar Electric</option>
                    <option value="HD Supply">HD Supply</option>
                    <option value="Ferguson Enterprises">Ferguson Enterprises</option>
                    <option value="Rexel USA">Rexel USA</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  End User
                </label>
                <div className="relative">
                  <select
                    value=""
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    onChange={() => {}}
                  >
                    <option value={invoice.customerName}>{invoice.customerName}</option>
                    <option value="Turner Construction">Turner Construction</option>
                    <option value="Hensel Phelps">Hensel Phelps</option>
                    <option value="Skanska USA">Skanska USA</option>
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <input type="checkbox" id="sameAsSoldTo" defaultChecked className="accent-[var(--primary)]" />
                  <label htmlFor="sameAsSoldTo" className="text-xs text-[var(--muted-foreground)]">Same as Sold To</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Job
                </label>
                <input
                  type="text"
                  value=""
                  placeholder="Job name"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value="Net 60"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Freight Terms
                </label>
                <input
                  type="text"
                  value="Prepaid & Add"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  readOnly
                />
              </div>
            </div>

            {/* Row 2: Dates and Reps */}
            <div className="grid grid-cols-7 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Invoice Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(invoice.invoiceDate)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Due Date<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(invoice.dueDate)}
                    className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${overdue ? 'text-red-600' : ''}`}
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Entry Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={invoice.entryDate ? formatDate(invoice.entryDate) : 'mm/dd/yyyy'}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Paid Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={invoice.paidDate ? formatDate(invoice.paidDate) : 'mm/dd/yyyy'}
                    className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${invoice.paidDate ? 'text-green-600' : ''}`}
                    readOnly
                  />
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h14"/>
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter PO #"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Outside Rep
                </label>
                <div className="relative">
                  <select
                    value={invoiceOutsideRep}
                    onChange={(e) => {
                      setInvoiceOutsideRep(e.target.value);
                      if (!e.target.value) {
                        setSplitOutsideCommission(false);
                        setOutsideRepSplits([]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  >
                    <option value="">Select Rep...</option>
                    {availableOutsideReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {invoiceOutsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitOutsideCommissionInvoice"
                      checked={splitOutsideCommission}
                      onChange={(e) => {
                        setSplitOutsideCommission(e.target.checked);
                        if (e.target.checked) {
                          const rep = availableOutsideReps.find(r => r.id === invoiceOutsideRep);
                          if (rep) {
                            setOutsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                          }
                          setShowOutsideRepSplitsModal(true);
                        } else {
                          setOutsideRepSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitOutsideCommissionInvoice" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split
                    </label>
                    {splitOutsideCommission && outsideRepSplits.length > 0 && (
                      <button
                        onClick={() => setShowOutsideRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({outsideRepSplits.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Inside Rep
                </label>
                <div className="relative">
                  <select
                    value={invoiceInsideRep}
                    onChange={(e) => {
                      setInvoiceInsideRep(e.target.value);
                      if (!e.target.value) {
                        setSplitInsideCommission(false);
                        setInsideRepSplits([]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                  >
                    <option value="">Select Rep...</option>
                    {availableInsideReps.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {invoiceInsideRep && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitInsideCommissionInvoice"
                      checked={splitInsideCommission}
                      onChange={(e) => {
                        setSplitInsideCommission(e.target.checked);
                        if (e.target.checked) {
                          const rep = availableInsideReps.find(r => r.id === invoiceInsideRep);
                          if (rep) {
                            setInsideRepSplits([{ repId: rep.id, repName: rep.name, percentage: 100 }]);
                          }
                          setShowInsideRepSplitsModal(true);
                        } else {
                          setInsideRepSplits([]);
                        }
                      }}
                      className="accent-[var(--primary)]"
                    />
                    <label htmlFor="splitInsideCommissionInvoice" className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      Split
                    </label>
                    {splitInsideCommission && insideRepSplits.length > 0 && (
                      <button
                        onClick={() => setShowInsideRepSplitsModal(true)}
                        className="text-xs text-[var(--primary)] hover:underline ml-1"
                      >
                        ({insideRepSplits.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {[
                { id: 'line-items', label: 'Line Items', count: invoice.lineItems.length },
                { id: 'payments', label: 'Payments', count: payments.length },
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

            {/* View Controls - on tab row */}
            {activeTab === 'line-items' && (
              <div className="flex items-center gap-3 pb-2">
                {/* Custom Button */}
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M3 8h14M8 8v9"/>
                  </svg>
                  Custom
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Sections Button */}
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="14" height="4" rx="1"/>
                    <rect x="3" y="10" width="14" height="7" rx="1"/>
                  </svg>
                  Sections
                </button>

                {/* Columns Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                    </svg>
                    Columns
                    <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{visibleColumns.size}</span>
                  </button>
                  {showColumnsMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowColumnsMenu(false)} />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                        {(Object.keys(columnLabels) as ColumnKey[]).map(col => (
                          <label
                            key={col}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--muted)] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.has(col)}
                              onChange={() => toggleColumn(col)}
                              className="accent-[var(--primary)]"
                            />
                            <span className="text-sm">{columnLabels[col]}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'line-items' && (
            <div className="space-y-4">
              {/* Line Items Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                    <tr>
                      {/* Checkbox column */}
                      <th className="w-10 px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={invoice.lineItems.length > 0 && invoice.lineItems.every(item => selectedLineItems.has(item.id))}
                          onChange={toggleAllLineItems}
                          className="accent-[var(--primary)]"
                        />
                      </th>
                      {/* Dynamic columns */}
                      {visibleColumns.has('partNumber') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            Part #
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]/50">
                              <path d="M8 6l4 4-4 4"/>
                            </svg>
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('custPartNumber') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Cust Part #
                        </th>
                      )}
                      {visibleColumns.has('description') && (
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            Description
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]/50">
                              <path d="M8 6l4 4-4 4"/>
                            </svg>
                          </div>
                        </th>
                      )}
                      {visibleColumns.has('uom') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          UOM
                        </th>
                      )}
                      {visibleColumns.has('divisor') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Divisor
                        </th>
                      )}
                      {visibleColumns.has('unitPrice') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Unit Price
                        </th>
                      )}
                      {visibleColumns.has('quantity') && (
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Qty
                        </th>
                      )}
                      {visibleColumns.has('sellTotal') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Sell Total
                        </th>
                      )}
                      {visibleColumns.has('commission') && (
                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                          Commission
                        </th>
                      )}
                      {/* Actions column */}
                      <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map(item => (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                          selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedLineItems.has(item.id)}
                            onChange={() => toggleLineItemSelection(item.id)}
                            className="accent-[var(--primary)]"
                          />
                        </td>
                        {visibleColumns.has('partNumber') && (
                          <td className="px-3 py-2 text-sm">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.partNumber}
                                className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded"
                                readOnly
                              />
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('custPartNumber') && (
                          <td className="px-3 py-2 text-sm">
                            <div className="relative">
                              <select className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded appearance-none cursor-pointer">
                                <option value="">Select...</option>
                              </select>
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('description') && (
                          <td className="px-3 py-2 text-sm max-w-[200px]">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.description}
                                className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded truncate"
                                readOnly
                                title={item.description}
                              />
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        )}
                        {visibleColumns.has('uom') && (
                          <td className="px-3 py-2 text-sm text-center">EA</td>
                        )}
                        {visibleColumns.has('divisor') && (
                          <td className="px-3 py-2 text-sm text-center">1</td>
                        )}
                        {visibleColumns.has('unitPrice') && (
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                        )}
                        {visibleColumns.has('quantity') && (
                          <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
                        )}
                        {visibleColumns.has('sellTotal') && (
                          <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                        )}
                        {visibleColumns.has('commission') && (
                          <td className="px-3 py-2 text-sm text-right text-purple-600">{(item.commissionRate || 0.08).toFixed(2)}</td>
                        )}
                        <td className="px-2 py-2">
                          <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="5" r="1"/>
                              <circle cx="10" cy="10" r="1"/>
                              <circle cx="10" cy="15" r="1"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Line Button */}
                <div className="border-t border-[var(--border)]">
                  <button className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Line
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {payments.length > 0 ? (
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--muted)]/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reference</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3 text-sm">{formatDate(payment.date)}</td>
                          <td className="px-4 py-3 text-sm">{payment.method}</td>
                          <td className="px-4 py-3 text-sm">{payment.reference}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--muted-foreground)] mb-4">
                    <path d="M12 2v6m0 0l3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10h2m14 0h-2M6 14h8" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[var(--muted-foreground)]">No payments recorded</p>
                  <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Notes</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Internal notes for this invoice</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      SC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 20, 2024 at 2:34 PM</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">
                        Customer requested extended payment terms. Approved 45 days net instead of 30.
                      </p>
                    </div>
                    <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                        <circle cx="10" cy="4" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="16" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      MT
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Mike Torres</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 4:15 PM</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">
                        Partial payment received. Remaining balance to be collected next month.
                      </p>
                    </div>
                    <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                        <circle cx="10" cy="4" r="1.5"/>
                        <circle cx="10" cy="10" r="1.5"/>
                        <circle cx="10" cy="16" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this invoice</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Task
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {/* Overdue Task */}
                <div className="bg-[var(--card)] border-l-4 border-l-red-500 border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[var(--border)]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)]">Follow up on payment</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Contact accounts payable for outstanding balance
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                        <span>Due: Mar 25, 2024</span>
                        <span>Assigned: Sarah Chen</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Task */}
                <div className="bg-[var(--card)] border-l-4 border-l-green-500 border border-[var(--border)] rounded-lg p-4 opacity-75">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked className="mt-1 w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]" readOnly />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--foreground)] line-through">Send invoice to customer</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 line-through">
                        Email invoice PDF to billing contact
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Activity Feed</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">All activity and changes on this invoice</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]">
                  <option>All Activity</option>
                  <option>Payments</option>
                  <option>Status Changes</option>
                </select>
              </div>

              {/* Activity List */}
              <div className="space-y-3">
                {/* Payment Received */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M10 4v12M6 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">PAYMENT RECEIVED</span>
                        <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Partial payment of $25,000 received</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Check #4521 from Turner Construction</p>
                    </div>
                  </div>
                </div>

                {/* Status Change */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                        <circle cx="10" cy="10" r="8"/>
                        <path d="M10 6v4l2 2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">STATUS CHANGE</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Yesterday at 4:30 PM</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Invoice status changed to Partial</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Remaining balance: $35,000</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Sent */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                        <path d="M4 4h12v12H4z" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 8h12M8 4v12" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">INVOICE SENT</span>
                        <span className="text-xs text-[var(--muted-foreground)]">Mar 15, 2024 at 10:00 AM</span>
                      </div>
                      <p className="font-medium text-sm text-[var(--foreground)] mt-1">Invoice emailed to customer</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Sent to billing@turner.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'linked-objects' && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Linked Objects</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Related entities connected to this invoice</p>
              </div>

              {/* Orders Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                      <path d="M8 6h4M8 10h4M8 14h2"/>
                    </svg>
                    <span className="font-medium">Orders</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">2</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Order</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">ORD-2024-0156</span>
                      <span className="text-sm">Downtown Office - Phase 1</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$45,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">processing</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">ORD-2024-0189</span>
                      <span className="text-sm">Downtown Office - Phase 2</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$62,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">shipped</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotes Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                      <path d="M8 6h4M8 10h4M8 14h2"/>
                    </svg>
                    <span className="font-medium">Quotes</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">1</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Quote</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">QT-2024-001</span>
                      <span className="text-sm">Downtown Office Complex</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">$125,000</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Statements Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                      <path d="M10 4v12M6 8l4-4 4 4"/>
                    </svg>
                    <span className="font-medium">Commission Statements</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">1</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Statement</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">CS-2024-03</span>
                      <span className="text-sm">March 2024 Statement</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-600">$4,250</span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">processed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M16 14v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/>
                      <circle cx="10" cy="7" r="3"/>
                    </svg>
                    <span className="font-medium">Contacts</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">2</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Contact</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">JS</div>
                      <div>
                        <div className="text-sm font-medium">John Smith</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Project Manager</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Turner Construction</div>
                      <div className="text-xs text-[var(--muted-foreground)]">jsmith@turner.com</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">ED</div>
                      <div>
                        <div className="text-sm font-medium">Emily Davis</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Purchasing Agent</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Turner Construction</div>
                      <div className="text-xs text-[var(--muted-foreground)]">edavis@turner.com</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Companies Section */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    </svg>
                    <span className="font-medium">Companies</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">1</span>
                  </div>
                  <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">+ Link Company</button>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-medium">TU</div>
                      <div>
                        <div className="text-sm font-medium">Turner Construction</div>
                        <div className="text-xs text-[var(--muted-foreground)]">New York, NY</div>
                      </div>
                    </div>
                    <span className="text-sm text-[var(--primary)]">Customer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--muted-foreground)] mb-4">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              <p className="text-[var(--muted-foreground)]">Invoice settings</p>
            </div>
          )}
        </div>
      </div>

      {/* Outside Rep Commission Splits Modal */}
      {showOutsideRepSplitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Outside Rep Commission Splits</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Divide commission among outside reps</p>
              </div>
              <button
                onClick={() => setShowOutsideRepSplitsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const totalPercentage = outsideRepSplits.reduce((sum, split) => sum + split.percentage, 0);
                const isValid = totalPercentage === 100;
                return (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                      Total: {totalPercentage}%
                    </span>
                    {!isValid && <span className="text-xs text-yellow-600">Must equal 100%</span>}
                    {isValid && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-3">
                {outsideRepSplits.map((split, index) => (
                  <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                    <div className="flex-1">
                      <select
                        value={split.repId}
                        onChange={(e) => {
                          const newRep = availableOutsideReps.find(r => r.id === e.target.value);
                          if (newRep) {
                            setOutsideRepSplits(prev => prev.map((s, i) =>
                              i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
                            ));
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      >
                        {availableOutsideReps.map(rep => (
                          <option key={rep.id} value={rep.id} disabled={outsideRepSplits.some(s => s.repId === rep.id && s.repId !== split.repId)}>
                            {rep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={split.percentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0));
                          const otherRepsCount = outsideRepSplits.length - 1;
                          if (otherRepsCount > 0) {
                            const remaining = 100 - value;
                            const perRep = Math.floor(remaining / otherRepsCount);
                            const remainder = remaining - (perRep * otherRepsCount);
                            let extraAssigned = 0;
                            setOutsideRepSplits(prev => prev.map((s, i) => {
                              if (i === index) return { ...s, percentage: value };
                              const extraPercent = extraAssigned < remainder ? 1 : 0;
                              extraAssigned++;
                              return { ...s, percentage: Math.max(0, perRep + extraPercent) };
                            }));
                          } else {
                            setOutsideRepSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                    {outsideRepSplits.length > 1 && (
                      <button
                        onClick={() => {
                          const remaining = outsideRepSplits.filter((_, i) => i !== index);
                          const newCount = remaining.length;
                          const perRep = Math.floor(100 / newCount);
                          const remainder = 100 - (perRep * newCount);
                          let extraAssigned = 0;
                          setOutsideRepSplits(remaining.map(s => {
                            const extraPercent = extraAssigned < remainder ? 1 : 0;
                            extraAssigned++;
                            return { ...s, percentage: perRep + extraPercent };
                          }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {outsideRepSplits.length < availableOutsideReps.length && (
                <button
                  onClick={() => {
                    const usedRepIds = new Set(outsideRepSplits.map(s => s.repId));
                    const availableRep = availableOutsideReps.find(r => !usedRepIds.has(r.id));
                    if (availableRep) {
                      const newCount = outsideRepSplits.length + 1;
                      const perRep = Math.floor(100 / newCount);
                      const remainder = 100 - (perRep * newCount);
                      let extraAssigned = 0;
                      const updatedSplits = outsideRepSplits.map(s => {
                        const extraPercent = extraAssigned < remainder ? 1 : 0;
                        extraAssigned++;
                        return { ...s, percentage: perRep + extraPercent };
                      });
                      const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
                      setOutsideRepSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Rep
                </button>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setSplitOutsideCommission(false); setOutsideRepSplits([]); setShowOutsideRepSplitsModal(false); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOutsideRepSplitsModal(false)}
                disabled={outsideRepSplits.reduce((sum, s) => sum + s.percentage, 0) !== 100}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inside Rep Commission Splits Modal */}
      {showInsideRepSplitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Inside Rep Commission Splits</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Divide commission among inside reps</p>
              </div>
              <button
                onClick={() => setShowInsideRepSplitsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const totalPercentage = insideRepSplits.reduce((sum, split) => sum + split.percentage, 0);
                const isValid = totalPercentage === 100;
                return (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                      Total: {totalPercentage}%
                    </span>
                    {!isValid && <span className="text-xs text-yellow-600">Must equal 100%</span>}
                    {isValid && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-3">
                {insideRepSplits.map((split, index) => (
                  <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                    <div className="flex-1">
                      <select
                        value={split.repId}
                        onChange={(e) => {
                          const newRep = availableInsideReps.find(r => r.id === e.target.value);
                          if (newRep) {
                            setInsideRepSplits(prev => prev.map((s, i) =>
                              i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
                            ));
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm"
                      >
                        {availableInsideReps.map(rep => (
                          <option key={rep.id} value={rep.id} disabled={insideRepSplits.some(s => s.repId === rep.id && s.repId !== split.repId)}>
                            {rep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={split.percentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0));
                          const otherRepsCount = insideRepSplits.length - 1;
                          if (otherRepsCount > 0) {
                            const remaining = 100 - value;
                            const perRep = Math.floor(remaining / otherRepsCount);
                            const remainder = remaining - (perRep * otherRepsCount);
                            let extraAssigned = 0;
                            setInsideRepSplits(prev => prev.map((s, i) => {
                              if (i === index) return { ...s, percentage: value };
                              const extraPercent = extraAssigned < remainder ? 1 : 0;
                              extraAssigned++;
                              return { ...s, percentage: Math.max(0, perRep + extraPercent) };
                            }));
                          } else {
                            setInsideRepSplits(prev => prev.map((s, i) => i === index ? { ...s, percentage: value } : s));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                    {insideRepSplits.length > 1 && (
                      <button
                        onClick={() => {
                          const remaining = insideRepSplits.filter((_, i) => i !== index);
                          const newCount = remaining.length;
                          const perRep = Math.floor(100 / newCount);
                          const remainder = 100 - (perRep * newCount);
                          let extraAssigned = 0;
                          setInsideRepSplits(remaining.map(s => {
                            const extraPercent = extraAssigned < remainder ? 1 : 0;
                            extraAssigned++;
                            return { ...s, percentage: perRep + extraPercent };
                          }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {insideRepSplits.length < availableInsideReps.length && (
                <button
                  onClick={() => {
                    const usedRepIds = new Set(insideRepSplits.map(s => s.repId));
                    const availableRep = availableInsideReps.find(r => !usedRepIds.has(r.id));
                    if (availableRep) {
                      const newCount = insideRepSplits.length + 1;
                      const perRep = Math.floor(100 / newCount);
                      const remainder = 100 - (perRep * newCount);
                      let extraAssigned = 0;
                      const updatedSplits = insideRepSplits.map(s => {
                        const extraPercent = extraAssigned < remainder ? 1 : 0;
                        extraAssigned++;
                        return { ...s, percentage: perRep + extraPercent };
                      });
                      const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
                      setInsideRepSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Rep
                </button>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => { setSplitInsideCommission(false); setInsideRepSplits([]); setShowInsideRepSplitsModal(false); }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInsideRepSplitsModal(false)}
                disabled={insideRepSplits.reduce((sum, s) => sum + s.percentage, 0) !== 100}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
