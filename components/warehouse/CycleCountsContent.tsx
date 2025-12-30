'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAllCycleCounts,
  getCycleCountStats,
  updateCycleCountStatus,
  startCycleCount,
} from '@/lib/data/warehouse-mock';
import {
  CycleCount,
  CycleCountStatus,
  CycleCountType,
  CycleCountPriority,
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';
import RecurringCycleCountJobsContent from './RecurringCycleCountJobsContent';

type TabType = 'counts' | 'recurring';

type StatFilter = 'all' | 'active' | 'scheduled' | 'completed' | 'variance';

// Statuses that workers can see (released = SCHEDULED and beyond, not DRAFT or CANCELLED)
const WORKER_VISIBLE_STATUSES: CycleCountStatus[] = [
  'SCHEDULED',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'COMPLETED',
];

// Sort types
type CycleCountSortField = 'cycleCountNumber' | 'name' | 'type' | 'assignedToName' | 'scheduledDate' | 'progress' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

// Column filter types
interface CycleCountColumnFilters {
  cycleCountNumber: string;
  name: string;
  type: string[];
  assignedTo: string[];
  priority: string[];
  status: string[];
  dateRange: { start: string; end: string };
}

// Sort Icon Component
function SortIcon({ field, currentSortField, currentSortDirection }: { field: CycleCountSortField; currentSortField: CycleCountSortField; currentSortDirection: SortDirection }) {
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

// Text Filter Dropdown
function TextFilterDropdown({ value, onChange, placeholder, isOpen, onToggle }: { value: string; onChange: (value: string) => void; placeholder?: string; isOpen: boolean; onToggle: () => void }) {
  const hasValue = value !== '';
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
            {hasValue && <button onClick={() => onChange('')} className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
          </div>
        </>
      )}
    </div>
  );
}

// MultiSelect Filter Dropdown
function MultiSelectFilterDropdown({ options, value, onChange, isOpen, onToggle, renderLabel }: { options: string[]; value: string[]; onChange: (value: string[]) => void; isOpen: boolean; onToggle: () => void; renderLabel?: (opt: string) => string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const hasValue = value.length > 0;
  const filteredOptions = options.filter((opt) => (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase()));
  const toggleOption = (optValue: string) => { if (value.includes(optValue)) { onChange(value.filter((v) => v !== optValue)); } else { onChange([...value, optValue]); } };
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
        {hasValue && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">{value.length}</span>}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
            </div>
            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div> : filteredOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={value.includes(opt)} onChange={() => toggleOption(opt)} className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50" />
                  <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>{renderLabel ? renderLabel(opt) : opt}</span>
                </label>
              ))}
            </div>
            {hasValue && <div className="p-2 border-t border-[var(--border)]"><button onClick={(e) => { e.stopPropagation(); onChange([]); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear all</button></div>}
          </div>
        </>
      )}
    </div>
  );
}

// Date Range Filter Dropdown
function DateRangeFilterDropdown({ value, onChange, isOpen, onToggle }: { value: { start: string; end: string }; onChange: (value: { start: string; end: string }) => void; isOpen: boolean; onToggle: () => void }) {
  const hasValue = value.start !== '' || value.end !== '';
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label><input type="date" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label><input type="date" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
              {hasValue && <button onClick={(e) => { e.stopPropagation(); onChange({ start: '', end: '' }); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CycleCountsContent() {
  const router = useRouter();
  const { selectedWarehouse, isWorkerView, isManagerView } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CycleCountStatus | 'all'>('all');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('counts');

  // Sorting state
  const [sortField, setSortField] = useState<CycleCountSortField>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<CycleCountColumnFilters>({
    cycleCountNumber: '',
    name: '',
    type: [],
    assignedTo: [],
    priority: [],
    status: [],
    dateRange: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const cycleCounts = useMemo(() => getAllCycleCounts(), [refreshKey]);
  const stats = useMemo(() => getCycleCountStats(), [refreshKey]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    return [...new Set(cycleCounts.map(cc => cc.type))];
  }, [cycleCounts]);

  const uniqueAssignees = useMemo(() => {
    return [...new Set(cycleCounts.map(cc => cc.assignedToName).filter(Boolean))] as string[];
  }, [cycleCounts]);

  const uniquePriorities = useMemo(() => {
    return [...new Set(cycleCounts.map(cc => cc.priority))];
  }, [cycleCounts]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(cycleCounts.map(cc => cc.status))];
  }, [cycleCounts]);

  // Handle sorting
  const handleSort = (field: CycleCountSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered cycle counts
  const filteredCycleCounts = useMemo(() => {
    let result = cycleCounts;

    // For workers, only show released cycle counts (SCHEDULED and beyond)
    if (isWorkerView) {
      result = result.filter(cc => WORKER_VISIBLE_STATUSES.includes(cc.status));
    }

    // Apply stat card filter
    if (activeStatFilter === 'active') {
      result = result.filter(cc => cc.status === 'IN_PROGRESS' || cc.status === 'PENDING_REVIEW');
    } else if (activeStatFilter === 'scheduled') {
      result = result.filter(cc => cc.status === 'SCHEDULED' || cc.status === 'DRAFT');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(cc => cc.status === 'COMPLETED');
    } else if (activeStatFilter === 'variance') {
      result = result.filter(cc => cc.itemsWithVariance > 0);
    }

    // Apply status dropdown filter
    if (statusFilter !== 'all') {
      result = result.filter(cc => cc.status === statusFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cc =>
        cc.cycleCountNumber.toLowerCase().includes(query) ||
        cc.name.toLowerCase().includes(query) ||
        (cc.assignedToName && cc.assignedToName.toLowerCase().includes(query))
      );
    }

    // Apply column filters
    if (columnFilters.cycleCountNumber) {
      const query = columnFilters.cycleCountNumber.toLowerCase();
      result = result.filter(cc => cc.cycleCountNumber.toLowerCase().includes(query));
    }

    if (columnFilters.name) {
      const query = columnFilters.name.toLowerCase();
      result = result.filter(cc => cc.name.toLowerCase().includes(query));
    }

    if (columnFilters.type.length > 0) {
      result = result.filter(cc => columnFilters.type.includes(cc.type));
    }

    if (columnFilters.assignedTo.length > 0) {
      result = result.filter(cc => cc.assignedToName && columnFilters.assignedTo.includes(cc.assignedToName));
    }

    if (columnFilters.priority.length > 0) {
      result = result.filter(cc => columnFilters.priority.includes(cc.priority));
    }

    if (columnFilters.status.length > 0) {
      result = result.filter(cc => columnFilters.status.includes(cc.status));
    }

    if (columnFilters.dateRange.start || columnFilters.dateRange.end) {
      result = result.filter(cc => {
        const date = new Date(cc.scheduledDate);
        if (columnFilters.dateRange.start && date < new Date(columnFilters.dateRange.start)) {
          return false;
        }
        if (columnFilters.dateRange.end && date > new Date(columnFilters.dateRange.end)) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'cycleCountNumber':
          comparison = a.cycleCountNumber.localeCompare(b.cycleCountNumber);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'assignedToName':
          comparison = (a.assignedToName || '').localeCompare(b.assignedToName || '');
          break;
        case 'scheduledDate':
          comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
          break;
        case 'progress':
          const aProgress = a.totalItems > 0 ? a.countedItems / a.totalItems : 0;
          const bProgress = b.totalItems > 0 ? b.countedItems / b.totalItems : 0;
          comparison = aProgress - bProgress;
          break;
        case 'priority':
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [cycleCounts, activeStatFilter, statusFilter, searchQuery, columnFilters, sortField, sortDirection, isWorkerView]);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 cursor-pointer transition-all";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const handleStartCycleCount = useCallback((countId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startCycleCount(countId, 'current-user');
    setRefreshKey(prev => prev + 1);
    router.push(`/warehouse/cycle-counts/${countId}`);
  }, [router]);

  const handleCancelCycleCount = useCallback((countId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updateCycleCountStatus(countId, 'CANCELLED');
    setRefreshKey(prev => prev + 1);
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Cycle Counts</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage inventory accuracy through scheduled and ad-hoc cycle counts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            {/* New Cycle Count button only visible to managers */}
            {isManagerView && (
              <Link
                href="/warehouse/cycle-counts/new"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New Cycle Count
              </Link>
            )}
          </div>
        </div>

        {/* Tabs - only show if manager (workers only see cycle counts) */}
        {isManagerView && (
          <div className="flex gap-1 mb-6 bg-[var(--muted)]/50 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('counts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'counts'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Cycle Counts
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'recurring'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Recurring Jobs
            </button>
          </div>
        )}

        {activeTab === 'counts' && (
          <>
        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div
            className={getStatCardClass('all')}
            onClick={() => handleStatCardClick('all')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Counts</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.total}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">All time</div>
          </div>
          <div
            className={getStatCardClass('active')}
            onClick={() => handleStatCardClick('active')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Active</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.inProgress + stats.pendingReview}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {stats.inProgress} in progress, {stats.pendingReview} reviewing
            </div>
          </div>
          <div
            className={getStatCardClass('scheduled')}
            onClick={() => handleStatCardClick('scheduled')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Scheduled</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.scheduled + stats.draft}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Upcoming counts</div>
          </div>
          <div
            className={getStatCardClass('completed')}
            onClick={() => handleStatCardClick('completed')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.completed}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{stats.completedThisMonth} this month</div>
          </div>
          <div
            className={getStatCardClass('variance')}
            onClick={() => handleStatCardClick('variance')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Avg Accuracy</div>
            <div className={`text-2xl font-semibold mt-1 ${stats.averageAccuracy >= 99 ? 'text-green-600' : stats.averageAccuracy >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.averageAccuracy > 0 ? `${stats.averageAccuracy}%` : '—'}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{stats.itemsWithVariance} items with variance</div>
          </div>
        </div>

        {/* Search and Filters */}
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
              placeholder="Search by count number, name, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CycleCountStatus | 'all')}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          Showing {filteredCycleCounts.length} cycle count{filteredCycleCounts.length !== 1 ? 's' : ''}
        </div>
          </>
        )}

        {activeTab === 'recurring' && isManagerView && (
          <RecurringCycleCountJobsContent />
        )}
      </div>

      {/* Cycle Counts List - only show when counts tab is active */}
      {activeTab === 'counts' && (
      <div className="flex-1 overflow-auto p-6 pt-0">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('cycleCountNumber')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Count #<SortIcon field="cycleCountNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <TextFilterDropdown value={columnFilters.cycleCountNumber} onChange={(value) => setColumnFilters(prev => ({ ...prev, cycleCountNumber: value }))} placeholder="Search..." isOpen={openFilter === 'cycleCountNumber'} onToggle={() => setOpenFilter(openFilter === 'cycleCountNumber' ? null : 'cycleCountNumber')} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('name')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Name<SortIcon field="name" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <TextFilterDropdown value={columnFilters.name} onChange={(value) => setColumnFilters(prev => ({ ...prev, name: value }))} placeholder="Search..." isOpen={openFilter === 'name'} onToggle={() => setOpenFilter(openFilter === 'name' ? null : 'name')} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('type')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Type<SortIcon field="type" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <MultiSelectFilterDropdown options={uniqueTypes} value={columnFilters.type} onChange={(value) => setColumnFilters(prev => ({ ...prev, type: value }))} isOpen={openFilter === 'type'} onToggle={() => setOpenFilter(openFilter === 'type' ? null : 'type')} renderLabel={(opt) => cycleCountTypeLabels[opt as CycleCountType]} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('assignedToName')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Assigned To<SortIcon field="assignedToName" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <MultiSelectFilterDropdown options={uniqueAssignees} value={columnFilters.assignedTo} onChange={(value) => setColumnFilters(prev => ({ ...prev, assignedTo: value }))} isOpen={openFilter === 'assignedTo'} onToggle={() => setOpenFilter(openFilter === 'assignedTo' ? null : 'assignedTo')} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('scheduledDate')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Scheduled<SortIcon field="scheduledDate" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <DateRangeFilterDropdown value={columnFilters.dateRange} onChange={(value) => setColumnFilters(prev => ({ ...prev, dateRange: value }))} isOpen={openFilter === 'dateRange'} onToggle={() => setOpenFilter(openFilter === 'dateRange' ? null : 'dateRange')} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <button onClick={() => handleSort('progress')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Progress<SortIcon field="progress" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('priority')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Priority<SortIcon field="priority" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <MultiSelectFilterDropdown options={uniquePriorities} value={columnFilters.priority} onChange={(value) => setColumnFilters(prev => ({ ...prev, priority: value }))} isOpen={openFilter === 'priority'} onToggle={() => setOpenFilter(openFilter === 'priority' ? null : 'priority')} renderLabel={(opt) => cycleCountPriorityLabels[opt as CycleCountPriority]} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button onClick={() => handleSort('status')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                        Status<SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                      </button>
                      <MultiSelectFilterDropdown options={uniqueStatuses} value={columnFilters.status} onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))} isOpen={openFilter === 'status'} onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')} renderLabel={(opt) => cycleCountStatusLabels[opt as CycleCountStatus]} />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCycleCounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 mb-4 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="font-medium text-[var(--foreground)]">No cycle counts found</p>
                        <p className="text-sm mt-1">Create a new cycle count to verify inventory accuracy</p>
                        <Link
                          href="/warehouse/cycle-counts/new"
                          className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
                        >
                          Create Cycle Count
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCycleCounts.map((count) => {
                    const progress = count.totalItems > 0 ? Math.round((count.countedItems / count.totalItems) * 100) : 0;
                    return (
                      <tr
                        key={count.id}
                        className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/warehouse/cycle-counts/${count.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--foreground)]">{count.cycleCountNumber}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(count.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--foreground)] max-w-[200px] truncate">{count.name}</div>
                          {count.description && (
                            <div className="text-xs text-[var(--muted-foreground)] max-w-[200px] truncate">{count.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-[var(--muted)] rounded text-xs font-medium text-[var(--foreground)]">
                            {cycleCountTypeLabels[count.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {count.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-medium">
                                {count.assignedToName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm text-[var(--foreground)]">{count.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--foreground)]">{formatDate(count.scheduledDate)}</div>
                          {count.dueDate && (
                            <div className="text-xs text-[var(--muted-foreground)]">Due: {formatDate(count.dueDate)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[80px] bg-[var(--muted)] rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progress === 100 ? 'bg-green-500' :
                                  progress > 0 ? 'bg-blue-500' :
                                  'bg-gray-300'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {count.countedItems}/{count.totalItems} items
                            </span>
                            {count.itemsWithVariance > 0 && (
                              <span className="text-xs text-orange-600">
                                {count.itemsWithVariance} variance{count.itemsWithVariance !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountPriorityColors[count.priority]}`}>
                            {cycleCountPriorityLabels[count.priority]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountStatusColors[count.status]}`}>
                            {cycleCountStatusLabels[count.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(count.status === 'DRAFT' || count.status === 'SCHEDULED') && (
                              <>
                                <button
                                  onClick={(e) => handleStartCycleCount(count.id, e)}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                                  title="Start Count"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={(e) => handleCancelCycleCount(count.id, e)}
                                  className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {count.status === 'IN_PROGRESS' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                              >
                                Continue
                              </Link>
                            )}
                            {count.status === 'PENDING_REVIEW' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded transition-colors"
                              >
                                Review
                              </Link>
                            )}
                            {count.status === 'COMPLETED' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </main>
  );
}
