'use client';

import React, { useState, useMemo } from 'react';
import { mockRmas, getWarehouseCustomers } from '@/lib/data/warehouse-mock';
import { Rma, RmaStatus, rmaStatusColors, rmaStatusLabels, rmaReasonLabels } from '@/lib/types/warehouse';
import ProcessRmaModal from './modals/ProcessRmaModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

// Filter types for stat card clicks
type StatFilter = 'all' | 'pending' | 'awaiting' | 'in_process' | 'completed';

export default function WarehouseReturnsContent() {
  const { selectedWarehouse } = useWarehouse();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RmaStatus | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [selectedRma, setSelectedRma] = useState<Rma | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');

  const customers = useMemo(() => getWarehouseCustomers(), []);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const filteredRmas = useMemo(() => {
    return mockRmas.filter(rma => {
      // Apply stat card filter first
      if (activeStatFilter === 'pending') {
        if (rma.status !== 'REQUESTED' && rma.status !== 'APPROVED') return false;
      } else if (activeStatFilter === 'awaiting') {
        if (rma.status !== 'APPROVED') return false;
      } else if (activeStatFilter === 'in_process') {
        if (rma.status !== 'RECEIVED' && rma.status !== 'INSPECTING') return false;
      } else if (activeStatFilter === 'completed') {
        if (rma.status !== 'COMPLETED' && rma.status !== 'REFUNDED' && rma.status !== 'REPLACED') return false;
      }

      const matchesSearch =
        rma.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rma.originalOrderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || rma.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || rma.customerId === customerFilter;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [searchTerm, statusFilter, customerFilter, activeStatFilter]);

  const stats = useMemo(() => {
    return {
      pending: mockRmas.filter(r => r.status === 'REQUESTED' || r.status === 'APPROVED').length,
      awaitingReceipt: mockRmas.filter(r => r.status === 'APPROVED').length,
      inProcess: mockRmas.filter(r => r.status === 'RECEIVED' || r.status === 'INSPECTING').length,
      completed: mockRmas.filter(r => r.status === 'COMPLETED' || r.status === 'REFUNDED' || r.status === 'REPLACED').length,
      totalValue: mockRmas.reduce((sum, r) => sum + r.totalValue, 0),
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleProcess = (rma: Rma) => {
    setSelectedRma(rma);
    setShowProcessModal(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Returns (RMA)</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage return merchandise authorizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WarehouseSelector />
          <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create RMA
          </button>
        </div>
      </div>

      {/* Stats Cards - Clickable to filter */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div
          className={getStatCardClass('pending')}
          onClick={() => handleStatCardClick('pending')}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Pending Approval</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pending}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'pending' ? <span className="text-[var(--primary)]">Filter active</span> : 'Awaiting review'}
          </div>
        </div>
        <div
          className={getStatCardClass('awaiting')}
          onClick={() => handleStatCardClick('awaiting')}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Awaiting Receipt</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.awaitingReceipt}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'awaiting' ? <span className="text-[var(--primary)]">Filter active</span> : 'Customer shipping'}
          </div>
        </div>
        <div
          className={getStatCardClass('in_process')}
          onClick={() => handleStatCardClick('in_process')}
        >
          <div className="text-sm text-[var(--muted-foreground)]">In Process</div>
          <div className="text-2xl font-semibold text-indigo-600 mt-1">{stats.inProcess}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'in_process' ? <span className="text-[var(--primary)]">Filter active</span> : 'Being processed'}
          </div>
        </div>
        <div
          className={getStatCardClass('completed')}
          onClick={() => handleStatCardClick('completed')}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">{stats.completed}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'completed' ? <span className="text-[var(--primary)]">Filter active</span> : 'This month'}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Total Value</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">
            ${stats.totalValue.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Open RMAs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="p-4 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
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
              placeholder="Search by RMA number, customer, or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RmaStatus | 'all')}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="RECEIVED">Received</option>
            <option value="INSPECTING">Inspecting</option>
            <option value="RESTOCKING">Restocking</option>
            <option value="REFUNDED">Refunded</option>
            <option value="REPLACED">Replaced</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RMAs Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Return Requests
            <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
              ({filteredRmas.length})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">RMA #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Original Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRmas.map((rma) => (
                <tr key={rma.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--foreground)]">{rma.rmaNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{rma.customerName}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{rma.originalOrderNumber}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[var(--foreground)]">
                      {rmaReasonLabels[rma.reason]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{rma.items.length}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">${rma.totalValue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(rma.requestedDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${rmaStatusColors[rma.status]}`}>
                      {rmaStatusLabels[rma.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(rma.status === 'REQUESTED' || rma.status === 'RECEIVED' || rma.status === 'INSPECTING') && (
                        <button
                          onClick={() => handleProcess(rma)}
                          className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-medium rounded hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Process
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRma(rma)}
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRmas.length === 0 && (
          <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
            No RMAs found matching your criteria
          </div>
        )}
      </div>

      {/* Process RMA Modal */}
      {showProcessModal && selectedRma && (
        <ProcessRmaModal
          rma={selectedRma}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedRma(null);
          }}
          onComplete={() => {
            setShowProcessModal(false);
            setSelectedRma(null);
          }}
        />
      )}
    </main>
  );
}
