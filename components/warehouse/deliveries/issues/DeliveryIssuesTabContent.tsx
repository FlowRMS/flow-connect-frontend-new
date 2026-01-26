'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DeliveryIssue,
  DeliveryIssueType,
  deliveryIssueStatusColors,
  deliveryIssueStatusLabels,
  deliveryIssueTypeColors,
  deliveryIssueTypeLabels,
} from '@/lib/types/warehouse';
import { useWarehouse } from '../../WarehouseContext';

type SortField = 'issueNumber' | 'vendorName' | 'poNumber' | 'reportedAt' | 'status' | 'totalAffectedQuantity';
type SortDirection = 'asc' | 'desc';

const issueStatusCardStyles: Record<
  'OPEN' | 'COMMUNICATED' | 'RESOLVED' | 'CLOSED',
  { card: string; dot: string; text: string }
> = {
  OPEN: { card: 'bg-yellow-100 border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  COMMUNICATED: { card: 'bg-blue-100 border-blue-200', dot: 'bg-blue-500', text: 'text-blue-700' },
  RESOLVED: { card: 'bg-green-100 border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
  CLOSED: { card: 'bg-gray-100 border-gray-200', dot: 'bg-gray-500', text: 'text-gray-700' },
};

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

interface DeliveryIssuesTabContentProps {
  deliveryIssues: DeliveryIssue[];
  isLoading?: boolean;
}

export default function DeliveryIssuesTabContent({ deliveryIssues, isLoading = false }: DeliveryIssuesTabContentProps) {
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

  // Get unique issue types from all issues
  const issueTypes = useMemo(() => {
    const types = new Set<DeliveryIssueType>();
    warehouseIssues.forEach(issue => {
      issue.items.forEach(item => types.add(item.issueType));
    });
    return Array.from(types);
  }, [warehouseIssues]);

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
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['OPEN', 'COMMUNICATED', 'RESOLVED', 'CLOSED'] as const).map((status) => {
          const styles = issueStatusCardStyles[status];
          const count =
            status === 'OPEN'
              ? stats.open
              : status === 'COMMUNICATED'
                ? stats.communicated
                : status === 'RESOLVED'
                  ? stats.resolved
                  : stats.closed;
          return (
            <div key={status} className={`${styles.card} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                <span className={`text-xs font-medium uppercase ${styles.text}`}>
                  {deliveryIssueStatusLabels[status]}
                </span>
              </div>
              <div className={`text-2xl font-bold ${styles.text}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
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
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none border-b border-[var(--border)] focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        >
          <option value="all">All Types</option>
          {issueTypes.map(type => (
            <option key={type} value={type}>{deliveryIssueTypeLabels[type]}</option>
          ))}
        </select>
      </div>

      {/* Issues Table */}
      {isLoading ? (
        <div className="text-center py-12 bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--muted-foreground)]">
            <svg className="h-4 w-4 animate-spin text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" className="opacity-25" />
              <path d="M22 12a10 10 0 00-10-10" className="opacity-75" />
            </svg>
            Loading delivery issues...
          </div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-[var(--muted-foreground)]">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No delivery issues</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No issues match your filters'
              : 'No delivery issues have been reported yet'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('issueNumber')} className="flex items-center hover:text-[var(--foreground)]">
                    Issue #
                    <SortIcon field="issueNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('vendorName')} className="flex items-center hover:text-[var(--foreground)]">
                    Vendor
                    <SortIcon field="vendorName" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('poNumber')} className="flex items-center hover:text-[var(--foreground)]">
                    PO #
                    <SortIcon field="poNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  Issue Types
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('totalAffectedQuantity')} className="flex items-center hover:text-[var(--foreground)]">
                    Qty
                    <SortIcon field="totalAffectedQuantity" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('reportedAt')} className="flex items-center hover:text-[var(--foreground)]">
                    Reported
                    <SortIcon field="reportedAt" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  <button onClick={() => handleSort('status')} className="flex items-center hover:text-[var(--foreground)]">
                    Status
                    <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredIssues.map((issue) => (
                <tr
                  key={issue.id}
                  onClick={() => handleRowClick(issue)}
                  className="hover:bg-[var(--muted)]/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--foreground)]">{issue.issueNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--foreground)]">{issue.vendorName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--muted-foreground)]">{issue.poNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(issue.items.map(i => i.issueType))).map(type => (
                        <span
                          key={type}
                          className={`px-2 py-0.5 text-xs rounded ${deliveryIssueTypeColors[type]}`}
                        >
                          {deliveryIssueTypeLabels[type]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[var(--foreground)]">{issue.totalAffectedQuantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--muted-foreground)]">{formatDate(issue.reportedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${deliveryIssueStatusColors[issue.status]}`}>
                      {deliveryIssueStatusLabels[issue.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
