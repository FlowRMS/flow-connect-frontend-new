'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DeliveryIssue,
  deliveryIssueStatusColors,
  deliveryIssueStatusLabels,
  deliveryIssueTypeColors,
  deliveryIssueTypeLabels,
} from '@/lib/types/warehouse';
import { useWarehouse } from '../../WarehouseContext';

type SortField = 'issueNumber' | 'vendorName' | 'poNumber' | 'reportedAt' | 'status' | 'totalAffectedQuantity';
type SortDirection = 'asc' | 'desc';

// Sort Icon Component
function SortIcon({ field, currentSortField, currentSortDirection }: { field: SortField; currentSortField: SortField; currentSortDirection: SortDirection }) {
  const isActive = currentSortField === field;
  return (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2 h-2 ${isActive && currentSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg className={`w-2 h-2 -mt-0.5 ${isActive && currentSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

interface WarehouseDeliveryIssuesContentProps {
  deliveryIssues: DeliveryIssue[];
}

export default function WarehouseDeliveryIssuesContent({ deliveryIssues }: WarehouseDeliveryIssuesContentProps) {
  const router = useRouter();
  const { selectedWarehouse } = useWarehouse();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('reportedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get issues for selected warehouse
  const warehouseIssues = useMemo(() => {
    if (!selectedWarehouse) return deliveryIssues;
    return deliveryIssues.filter((issue) => issue.warehouseId === selectedWarehouse.id);
  }, [deliveryIssues, selectedWarehouse]);

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    let result = [...warehouseIssues];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue =>
        issue.issueNumber.toLowerCase().includes(query) ||
        issue.poNumber.toLowerCase().includes(query) ||
        issue.vendorName.toLowerCase().includes(query) ||
        issue.items.some(item =>
          item.productName.toLowerCase().includes(query) ||
          item.partNumber.toLowerCase().includes(query)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(issue => issue.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(issue =>
        issue.items.some(item => item.issueType === typeFilter)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'issueNumber':
          comparison = a.issueNumber.localeCompare(b.issueNumber);
          break;
        case 'vendorName':
          comparison = a.vendorName.localeCompare(b.vendorName);
          break;
        case 'poNumber':
          comparison = a.poNumber.localeCompare(b.poNumber);
          break;
        case 'reportedAt':
          comparison = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'totalAffectedQuantity':
          comparison = a.totalAffectedQuantity - b.totalAffectedQuantity;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [warehouseIssues, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const open = warehouseIssues.filter(i => i.status === 'OPEN').length;
    const communicated = warehouseIssues.filter(i => i.status === 'COMMUNICATED').length;
    const resolved = warehouseIssues.filter(i => i.status === 'RESOLVED').length;
    const closed = warehouseIssues.filter(i => i.status === 'CLOSED').length;
    return { open, communicated, resolved, closed, total: warehouseIssues.length };
  }, [warehouseIssues]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRowClick = (issue: DeliveryIssue) => {
    router.push(`/warehouse/delivery-issues/${issue.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Delivery Issues</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track and resolve issues from incoming deliveries
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Open</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Communicated</p>
              <p className="text-2xl font-bold text-blue-600">{stats.communicated}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Closed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by issue #, PO #, vendor, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        >
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="COMMUNICATED">Communicated</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        >
          <option value="all">All Issue Types</option>
          <option value="DAMAGED">Damaged</option>
          <option value="MISSING">Missing</option>
          <option value="OVERAGE">Overage</option>
          <option value="WRONG_ITEM">Wrong Item</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('issueNumber')}
              >
                <div className="flex items-center">
                  Issue #
                  <SortIcon field="issueNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('vendorName')}
              >
                <div className="flex items-center">
                  Vendor
                  <SortIcon field="vendorName" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('poNumber')}
              >
                <div className="flex items-center">
                  PO #
                  <SortIcon field="poNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Issue Types
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('totalAffectedQuantity')}
              >
                <div className="flex items-center">
                  Qty
                  <SortIcon field="totalAffectedQuantity" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('reportedAt')}
              >
                <div className="flex items-center">
                  Reported
                  <SortIcon field="reportedAt" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--muted)]/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No delivery issues found
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => {
                // Get unique issue types for this issue
                const issueTypeSet = new Set(issue.items.map(item => item.issueType));
                const uniqueTypes = Array.from(issueTypeSet);

                return (
                  <tr
                    key={issue.id}
                    className="hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(issue)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--foreground)]">{issue.issueNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--foreground)]">{issue.vendorName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--muted-foreground)]">{issue.poNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {uniqueTypes.map((type) => (
                          <span
                            key={type}
                            className={`px-2 py-0.5 text-xs font-medium rounded ${deliveryIssueTypeColors[type]}`}
                          >
                            {deliveryIssueTypeLabels[type]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--foreground)]">{issue.totalAffectedQuantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--muted-foreground)]">{formatDate(issue.reportedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${deliveryIssueStatusColors[issue.status]}`}>
                        {deliveryIssueStatusLabels[issue.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(issue);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
