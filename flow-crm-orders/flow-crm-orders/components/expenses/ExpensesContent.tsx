'use client';

import React, { useState, useMemo } from 'react';
import {
  mockExpenses,
  mockSalesReps,
  mockManufacturers,
  mockCustomers,
  mockExpenseCategories,
  generateExpenseNumber,
} from '../../lib/data/rms-mock';
import type { Expense, ExpenseSplitRate } from '../../lib/types/rms';

const expenseStatusLabels: Record<string, string> = {
  open: 'Open',
  paid: 'Paid',
  void: 'Void',
};

const expenseStatusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  void: 'bg-gray-100 text-gray-700',
};

export default function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusTabs = [
    { label: 'All', value: 'All', count: expenses.length },
    { label: 'Open', value: 'open', count: expenses.filter(e => e.status === 'open').length },
    { label: 'Paid', value: 'paid', count: expenses.filter(e => e.status === 'paid').length },
    { label: 'Void', value: 'void', count: expenses.filter(e => e.status === 'void').length },
  ];

  const filteredExpenses = useMemo(() => {
    let result = expenses;

    if (selectedStatus !== 'All') {
      result = result.filter(e => e.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.expenseNumber.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        (e.customerName?.toLowerCase().includes(query)) ||
        (e.manufacturerName?.toLowerCase().includes(query))
      );
    }

    return result;
  }, [expenses, selectedStatus, searchQuery]);

  const totalOpenAmount = useMemo(() => {
    return expenses.filter(e => e.status === 'open').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

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
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Expenses</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage commission adjustments, bonuses, and SPIFFs
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Expense
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Expenses</div>
            <div className="text-2xl font-semibold text-[var(--foreground)]">{expenses.length}</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">Open Amount</div>
            <div className="text-2xl font-semibold text-blue-600">{formatCurrency(totalOpenAmount)}</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">Open</div>
            <div className="text-2xl font-semibold text-blue-600">{expenses.filter(e => e.status === 'open').length}</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)] mb-1">Paid</div>
            <div className="text-2xl font-semibold text-green-600">{expenses.filter(e => e.status === 'paid').length}</div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
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
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        {/* Expenses Table */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expense #</div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Category</div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Customer/Mfg</div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Date</div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase text-right">Amount</div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {filteredExpenses.length === 0 ? (
              <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                No expenses found
              </div>
            ) : (
              filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  onClick={() => setSelectedExpense(expense)}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20 cursor-pointer transition-colors ${
                    selectedExpense?.id === expense.id ? 'bg-[var(--primary)]/5' : ''
                  }`}
                >
                  <div className="col-span-2 text-sm font-medium text-[var(--primary)]">{expense.expenseNumber}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 font-medium">
                      {expense.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-[var(--foreground)] truncate">
                    {expense.customerName || expense.manufacturerName || '-'}
                  </div>
                  <div className="col-span-2 text-sm text-[var(--muted-foreground)] truncate">{expense.description}</div>
                  <div className="col-span-1 text-sm text-[var(--muted-foreground)]">
                    {formatDate(expense.expenseDate)}
                  </div>
                  <div className="col-span-1 text-sm font-semibold text-[var(--foreground)] text-right">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${expenseStatusColors[expense.status]}`}>
                      {expenseStatusLabels[expense.status]}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpense(expense);
                      }}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedExpense && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl z-40">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedExpense.expenseNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedExpense.category}</p>
            </div>
            <button
              onClick={() => setSelectedExpense(null)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Status</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${expenseStatusColors[selectedExpense.status]}`}>
                {expenseStatusLabels[selectedExpense.status]}
              </span>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Expense Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Category</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{selectedExpense.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedExpense.expenseDate)}</span>
                </div>
                {selectedExpense.customerName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Customer</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedExpense.customerName}</span>
                  </div>
                )}
                {selectedExpense.manufacturerName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedExpense.manufacturerName}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Amount</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(selectedExpense.amount)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Description</h3>
              <p className="text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded-lg p-4">
                {selectedExpense.description}
              </p>
            </div>

            {selectedExpense.notes && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg p-4">
                  {selectedExpense.notes}
                </p>
              </div>
            )}

            {/* Split Rates */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Splits</h3>
              <div className="space-y-2">
                {selectedExpense.splitRates.map((split, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-medium text-[var(--foreground)]">{split.salesRepName}</span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">{split.splitPercentage}%</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(split.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Check Info */}
            {selectedExpense.checkId && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Payment Info</h3>
                <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Check ID</span>
                    <span className="text-sm text-[var(--primary)]">{selectedExpense.checkId}</span>
                  </div>
                  {selectedExpense.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Paid Date</span>
                      <span className="text-sm text-green-600">{formatDate(selectedExpense.paidDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audit Info */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Audit Trail</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2 text-sm text-[var(--muted-foreground)]">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(selectedExpense.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created By</span>
                  <span>{selectedExpense.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedExpense.status === 'open' && (
              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Edit
                </button>
                <button
                  onClick={() => {
                    setExpenses(expenses.map(e =>
                      e.id === selectedExpense.id ? { ...e, status: 'void' as const } : e
                    ));
                    setSelectedExpense({ ...selectedExpense, status: 'void' });
                  }}
                  className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Void
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          onClose={() => setShowCreateModal(false)}
          onSave={(newExpense) => {
            setExpenses([newExpense, ...expenses]);
            setShowCreateModal(false);
          }}
        />
      )}
    </main>
  );
}

// Create Expense Modal
function CreateExpenseModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [category, setCategory] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [splitRates, setSplitRates] = useState<ExpenseSplitRate[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const addSplitRate = () => {
    setSplitRates([
      ...splitRates,
      { salesRepId: '', salesRepName: '', splitPercentage: 0, amount: 0 },
    ]);
  };

  const updateSplitRate = (index: number, field: string, value: string | number) => {
    const updated = [...splitRates];
    if (field === 'salesRepId') {
      const rep = mockSalesReps.find(r => r.id === value);
      updated[index] = {
        ...updated[index],
        salesRepId: value as string,
        salesRepName: rep?.name || '',
      };
    } else if (field === 'splitPercentage') {
      const pct = parseFloat(value as string) || 0;
      updated[index] = {
        ...updated[index],
        splitPercentage: pct,
        amount: (amount * pct) / 100,
      };
    }
    setSplitRates(updated);
  };

  const removeSplitRate = (index: number) => {
    setSplitRates(splitRates.filter((_, i) => i !== index));
  };

  const totalSplitPercentage = splitRates.reduce((sum, sr) => sum + sr.splitPercentage, 0);

  const handleSave = () => {
    const selectedCustomer = mockCustomers.find(c => c.id === customerId);
    const selectedMfg = mockManufacturers.find(m => m.id === manufacturerId);

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      expenseNumber: generateExpenseNumber(),
      category,
      categoryId: mockExpenseCategories.find(c => c.name === category)?.id || '',
      customerId: customerId || undefined,
      customerName: selectedCustomer?.name,
      manufacturerId: manufacturerId || undefined,
      manufacturerName: selectedMfg?.name,
      description,
      amount,
      status: 'open',
      splitRates: splitRates.map(sr => ({
        ...sr,
        amount: (amount * sr.splitPercentage) / 100,
      })),
      expenseDate,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
    };

    onSave(newExpense);
  };

  const isValid = category && description && amount > 0 && splitRates.length > 0 && totalSplitPercentage === 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Expense</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              <option value="">Select category</option>
              {mockExpenseCategories.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Customer (optional)</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              <option value="">No customer</option>
              {mockCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Manufacturer (optional)</label>
            <select
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              <option value="">No manufacturer</option>
              {mockManufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none"
              placeholder="Describe the expense..."
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Date *</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {/* Commission Splits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Commission Splits *</label>
              <button
                onClick={addSplitRate}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                + Add Rep
              </button>
            </div>
            <div className="space-y-2">
              {splitRates.map((split, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[var(--muted)]/30 rounded-lg p-3">
                  <select
                    value={split.salesRepId}
                    onChange={(e) => updateSplitRate(idx, 'salesRepId', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                  >
                    <option value="">Select rep</option>
                    {mockSalesReps.filter(r => r.isActive).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={split.splitPercentage}
                      onChange={(e) => updateSplitRate(idx, 'splitPercentage', e.target.value)}
                      className="w-16 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-right"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">%</span>
                  </div>
                  <span className="text-sm font-medium text-green-600 w-20 text-right">
                    {formatCurrency((amount * split.splitPercentage) / 100)}
                  </span>
                  <button
                    onClick={() => removeSplitRate(idx)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
              {splitRates.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                  No splits added. Click "+ Add Rep" to add commission splits.
                </p>
              )}
              {splitRates.length > 0 && (
                <div className={`flex justify-between text-sm px-3 py-2 rounded ${
                  totalSplitPercentage === 100
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <span>Total Split</span>
                  <span className="font-medium">{totalSplitPercentage}% {totalSplitPercentage !== 100 && '(must equal 100%)'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Expense
          </button>
        </div>
      </div>
    </div>
  );
}
