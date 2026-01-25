'use client';

import React, { useState } from 'react';
import type { FulfillmentOrder } from '../api/fulfillmentApi';
import { getWarehouseWorkers, getWarehouseManagers } from '@/lib/data/warehouse-mock';

interface BulkAssignModalProps {
  selectedOrders: FulfillmentOrder[];
  onClose: () => void;
  onSubmit: (workerId: string, workerName: string, managerId?: string, managerName?: string, dueDate?: string) => void;
}

export default function BulkAssignModal({ selectedOrders, onClose, onSubmit }: BulkAssignModalProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const workers = getWarehouseWorkers();
  const managers = getWarehouseManagers();

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const selectedManager = managers.find(m => m.id === selectedManagerId);

  const totalItems = selectedOrders.reduce((sum, order) => {
    return sum + order.lineItems.reduce((lineSum, li) => lineSum + li.orderedQty, 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedWorker) return;
    onSubmit(
      selectedWorkerId,
      selectedWorker.name,
      selectedManagerId || undefined,
      selectedManager?.name,
      dueDate || undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Assign Orders</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--muted)]/30 rounded-lg p-4 border border-[var(--border)]">
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Orders</div>
              <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{selectedOrders.length}</div>
            </div>
            <div className="bg-[var(--muted)]/30 rounded-lg p-4 border border-[var(--border)]">
              <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Total Items</div>
              <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{totalItems}</div>
            </div>
          </div>

          {/* Worker Selection - Required */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <label className="text-sm font-medium text-[var(--foreground)]">Worker</label>
              </div>
              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
            </div>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]"
              required
            >
              <option value="">Select a warehouse worker...</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>

          {/* Manager Selection - Optional (Signing Authority) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
                  </svg>
                </div>
                <label className="text-sm font-medium text-[var(--foreground)]">Manager</label>
              </div>
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">Signing Authority</span>
            </div>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]"
            >
              <option value="">No manager (optional)</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date - Optional */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-[var(--muted)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <label className="text-sm font-medium text-[var(--foreground)]">Due Date</label>
              <span className="text-xs text-[var(--muted-foreground)]">(optional)</span>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]"
            />
          </div>

          {/* Selected Orders Preview */}
          <div>
            <div className="text-sm font-medium text-[var(--foreground)] mb-2">Selected Orders</div>
            <div className="max-h-32 overflow-y-auto border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
              {selectedOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="px-4 py-2.5 text-sm flex items-center justify-between border-b border-[var(--border)] last:border-b-0">
                  <span className="font-medium text-[var(--foreground)]">{order.order?.orderNumber || '-'}</span>
                  <span className="text-[var(--muted-foreground)]">{order.customer?.companyName || '-'}</span>
                </div>
              ))}
              {selectedOrders.length > 5 && (
                <div className="px-4 py-2.5 text-sm text-[var(--muted-foreground)] text-center bg-[var(--muted)]/30">
                  +{selectedOrders.length - 5} more orders
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedWorkerId}
            className="px-5 py-2.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Assign Orders
          </button>
        </div>
      </div>
    </div>
  );
}
