'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllRecurringCycleCountJobs,
  getCycleCountsForRecurringJob,
  updateRecurringCycleCountJobStatus,
  updateRecurringCycleCountJob,
  getRecurrenceDescription,
  mockWarehouses,
  getEligibleItemsForAutoGenerate,
  addRecurringCycleCountJob,
  calculateNextDate,
} from '@/lib/data/warehouse-mock';
import {
  RecurringCycleCountJob,
  RecurringCycleCountStatus,
  recurringCycleCountStatusLabels,
  recurringCycleCountStatusColors,
  cycleCountTriggerTypeLabels,
  CycleCountTriggerType,
  inventoryVelocityLabels,
  inventoryVelocityColors,
  InventoryVelocity,
  CycleCount,
  RecurrenceFrequency,
  DayOfWeek,
  WeekOfMonth,
  recurrenceFrequencyLabels,
  dayOfWeekLabels,
  weekOfMonthLabels,
} from '@/lib/types/warehouse';

export default function RecurringCycleCountJobsContent() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<RecurringCycleCountStatus | 'ALL'>('ALL');
  const [selectedJob, setSelectedJob] = useState<RecurringCycleCountJob | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const jobs = useMemo(() => {
    const all = getAllRecurringCycleCountJobs();
    if (statusFilter === 'ALL') return all;
    return all.filter(job => job.status === statusFilter);
  }, [refreshKey, statusFilter]);

  const handleToggleStatus = (job: RecurringCycleCountJob, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: RecurringCycleCountStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    updateRecurringCycleCountJobStatus(job.id, newStatus);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = (job: RecurringCycleCountJob, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to cancel "${job.name}"? This cannot be undone.`)) {
      updateRecurringCycleCountJobStatus(job.id, 'CANCELLED');
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleRowClick = (job: RecurringCycleCountJob) => {
    setSelectedJob(job);
    setShowDetailModal(true);
  };

  const handleJobUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleJobCreated = () => {
    setShowCreateModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const getLinkedCycleCounts = (jobId: string): CycleCount[] => {
    return getCycleCountsForRecurringJob(jobId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)]">Filter:</span>
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                }`}
              >
                {status === 'ALL' ? 'All' : recurringCycleCountStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Recurring Job
        </button>
      </div>

      {/* Recurring Jobs Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 014-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">No Recurring Jobs</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Set up automatic cycle count generation on a schedule.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create Your First Recurring Job
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Next Run</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {jobs.map(job => {
                const linkedCounts = getLinkedCycleCounts(job.id);
                const isOverdue = job.status === 'ACTIVE' && job.nextScheduledDate && new Date(job.nextScheduledDate) < new Date();

                return (
                  <tr
                    key={job.id}
                    className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50/50' : ''}`}
                    onClick={() => handleRowClick(job)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{job.name}</span>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                            Overdue
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-[200px] truncate">
                          {job.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {cycleCountTriggerTypeLabels[job.triggerType]}
                      </span>
                      {job.velocityFilter && job.velocityFilter.length > 0 && (
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {job.velocityFilter.map(v => inventoryVelocityLabels[v]).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {getRecurrenceDescription(job.recurrencePattern as any)}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                        {job.nextScheduledDate ? formatDate(job.nextScheduledDate) : 'N/A'}
                      </div>
                      {job.lastGeneratedDate && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          Last: {formatDate(job.lastGeneratedDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-[var(--foreground)]">{job.itemCount}</span>
                      <div className="text-xs text-[var(--muted-foreground)]">per count</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${recurringCycleCountStatusColors[job.status]}`}>
                        {recurringCycleCountStatusLabels[job.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {job.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => handleToggleStatus(job, e)}
                            className="px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
                          >
                            Pause
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button
                            onClick={(e) => handleToggleStatus(job, e)}
                            className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
                          >
                            Resume
                          </button>
                        )}
                        {job.status !== 'CANCELLED' && (
                          <button
                            onClick={(e) => handleCancel(job, e)}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail/Edit Modal */}
      {showDetailModal && selectedJob && (
        <RecurringJobDetailModal
          job={selectedJob}
          linkedCycleCounts={getLinkedCycleCounts(selectedJob.id)}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedJob(null);
          }}
          onUpdate={handleJobUpdated}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRecurringJobModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleJobCreated}
        />
      )}
    </div>
  );
}

// Recurring Job Detail/Edit Modal
interface RecurringJobDetailModalProps {
  job: RecurringCycleCountJob;
  linkedCycleCounts: CycleCount[];
  onClose: () => void;
  onUpdate: () => void;
}

function RecurringJobDetailModal({
  job,
  linkedCycleCounts,
  onClose,
  onUpdate,
}: RecurringJobDetailModalProps) {
  const router = useRouter();

  // Editable state
  const [name, setName] = useState(job.name);
  const [description, setDescription] = useState(job.description || '');
  const [itemCount, setItemCount] = useState(job.itemCount);
  const [excludeDays, setExcludeDays] = useState(job.excludeRecentlyCountedDays);
  const [velocityFilter, setVelocityFilter] = useState<InventoryVelocity[]>(job.velocityFilter || []);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(job.recurrencePattern.frequency as RecurrenceFrequency);
  const [interval, setInterval] = useState(job.recurrencePattern.interval);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(job.recurrencePattern.dayOfWeek as DayOfWeek || 'MONDAY');
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth>(job.recurrencePattern.weekOfMonth as WeekOfMonth || 'FIRST');
  const [dayOfMonth, setDayOfMonth] = useState(job.recurrencePattern.dayOfMonth || 1);

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const warehouses = useMemo(() => mockWarehouses.filter(w => w.isActive), []);

  const handleToggleVelocity = (velocity: InventoryVelocity) => {
    setVelocityFilter(prev =>
      prev.includes(velocity)
        ? prev.filter(v => v !== velocity)
        : [...prev, velocity]
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    setIsSaving(true);

    const newPattern = {
      frequency,
      interval,
      dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
      weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
      dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
    };

    updateRecurringCycleCountJob(job.id, {
      name,
      description: description || undefined,
      itemCount,
      excludeRecentlyCountedDays: excludeDays,
      velocityFilter: velocityFilter.length > 0 ? velocityFilter : undefined,
      recurrencePattern: newPattern,
      nextScheduledDate: calculateNextDate(newPattern as any, new Date()).toISOString().split('T')[0],
    });

    setIsSaving(false);
    setHasChanges(false);
    onUpdate();
  };

  const handleStatusChange = (newStatus: RecurringCycleCountStatus) => {
    if (newStatus === 'CANCELLED') {
      if (!confirm(`Are you sure you want to cancel "${job.name}"? This cannot be undone.`)) {
        return;
      }
    }
    updateRecurringCycleCountJobStatus(job.id, newStatus);
    onUpdate();
    onClose();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isEditable = job.status !== 'CANCELLED';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 014-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Recurring Cycle Count Job</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {isEditable ? 'Edit job settings' : 'View job details (cancelled)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${recurringCycleCountStatusColors[job.status]}`}>
              {recurringCycleCountStatusLabels[job.status]}
            </span>
            {isEditable && (
              <div className="flex gap-2">
                {job.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange('PAUSED')}
                    className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                  >
                    Pause Job
                  </button>
                )}
                {job.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    Resume Job
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
                disabled={!isEditable}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
                disabled={!isEditable}
                placeholder="Optional description"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
              />
            </div>

            {/* Warehouse (read-only) */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Warehouse</label>
              <div className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
                {job.warehouseName}
              </div>
            </div>

            {/* Item Count & Exclude Days */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Products to Count</label>
                <input
                  type="number"
                  value={itemCount}
                  onChange={(e) => { setItemCount(Math.max(1, parseInt(e.target.value) || 1)); setHasChanges(true); }}
                  disabled={!isEditable}
                  min={1}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Exclude Recent (days)</label>
                <input
                  type="number"
                  value={excludeDays}
                  onChange={(e) => { setExcludeDays(Math.max(0, parseInt(e.target.value) || 0)); setHasChanges(true); }}
                  disabled={!isEditable}
                  min={0}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Velocity Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Product Movement Speed</label>
              <div className="flex gap-2">
                {(['fast', 'medium', 'slow'] as InventoryVelocity[]).map(velocity => (
                  <button
                    key={velocity}
                    type="button"
                    onClick={() => isEditable && handleToggleVelocity(velocity)}
                    disabled={!isEditable}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      velocityFilter.includes(velocity)
                        ? `${inventoryVelocityColors[velocity]} border-2 border-current`
                        : 'bg-[var(--muted)] text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]'
                    } disabled:opacity-50`}
                  >
                    {inventoryVelocityLabels[velocity]}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => { setFrequency(e.target.value as RecurrenceFrequency); setHasChanges(true); }}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                  >
                    {Object.entries(recurrenceFrequencyLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {frequency !== 'BIWEEKLY' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Repeat Every</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={interval}
                        onChange={(e) => { setInterval(parseInt(e.target.value) || 1); setHasChanges(true); }}
                        disabled={!isEditable}
                        className="w-20 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {frequency === 'DAILY' ? 'day(s)' :
                         frequency === 'WEEKLY' ? 'week(s)' :
                         frequency.includes('MONTHLY') ? 'month(s)' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Week</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => { setDayOfWeek(e.target.value as DayOfWeek); setHasChanges(true); }}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                    >
                      {Object.entries(dayOfWeekLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {frequency === 'MONTHLY_WEEK' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Week of Month</label>
                    <select
                      value={weekOfMonth}
                      onChange={(e) => { setWeekOfMonth(e.target.value as WeekOfMonth); setHasChanges(true); }}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                    >
                      {Object.entries(weekOfMonthLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {frequency === 'MONTHLY' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Month</label>
                    <select
                      value={dayOfMonth}
                      onChange={(e) => { setDayOfMonth(parseInt(e.target.value)); setHasChanges(true); }}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Next Run:</span>
                <span className="font-medium">{job.nextScheduledDate ? formatDate(job.nextScheduledDate) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Generated Cycle Counts (read-only history) */}
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Generated Cycle Counts ({linkedCycleCounts.length})</h3>
            {linkedCycleCounts.length === 0 ? (
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 text-center text-sm text-[var(--muted-foreground)]">
                No cycle counts generated yet
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Count #</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Date</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)]">Items</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {linkedCycleCounts.slice(0, 5).map(cc => (
                      <tr
                        key={cc.id}
                        className="hover:bg-[var(--muted)]/20 cursor-pointer"
                        onClick={() => router.push(`/warehouse/cycle-counts/${cc.id}`)}
                      >
                        <td className="px-3 py-2 text-sm font-medium text-[var(--foreground)]">{cc.cycleCountNumber}</td>
                        <td className="px-3 py-2 text-sm text-[var(--foreground)]">{formatDate(cc.scheduledDate)}</td>
                        <td className="px-3 py-2 text-sm text-center text-[var(--foreground)]">{cc.totalItems}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-[var(--muted)] text-[var(--foreground)]">
                            {cc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {linkedCycleCounts.length > 5 && (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] text-center border-t border-[var(--border)]">
                    And {linkedCycleCounts.length - 5} more...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between flex-shrink-0">
          <div>
            {isEditable && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Cancel Job
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg transition-colors"
            >
              Close
            </button>
            {isEditable && hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Recurring Job Modal
interface CreateRecurringJobModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateRecurringJobModal({ onClose, onCreated }: CreateRecurringJobModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(mockWarehouses[0]?.id || '');
  const [itemCount, setItemCount] = useState(20);
  const [excludeDays, setExcludeDays] = useState(60);
  const [velocityFilter, setVelocityFilter] = useState<InventoryVelocity[]>(['fast']);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth>('FIRST');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const warehouses = useMemo(() => mockWarehouses.filter(w => w.isActive), []);
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Preview eligible items
  const eligibleItems = useMemo(() => {
    return getEligibleItemsForAutoGenerate(excludeDays, velocityFilter);
  }, [excludeDays, velocityFilter]);

  const handleToggleVelocity = (velocity: InventoryVelocity) => {
    setVelocityFilter(prev =>
      prev.includes(velocity)
        ? prev.filter(v => v !== velocity)
        : [...prev, velocity]
    );
  };

  const handleCreate = () => {
    const recurrencePattern = {
      frequency,
      interval,
      dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
      weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
      dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
    };

    addRecurringCycleCountJob({
      name,
      description: description || undefined,
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      triggerType: 'FAST_MOVING' as CycleCountTriggerType,
      itemCount,
      velocityFilter: velocityFilter.length > 0 ? velocityFilter : undefined,
      excludeRecentlyCountedDays: excludeDays,
      recurrencePattern,
      startDate,
      status: 'ACTIVE',
      nextScheduledDate: calculateNextDate(recurrencePattern as any, new Date(startDate)).toISOString().split('T')[0],
      createdBy: 'Current User',
    });

    onCreated();
  };

  const canCreate = name.trim() && selectedWarehouseId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 014-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Recurring Job</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Schedule automatic cycle count generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Fast Movers Count"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Warehouse</label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Generation Settings */}
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Generation Settings</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Products to Count</label>
                <input
                  type="number"
                  value={itemCount}
                  onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Exclude Recent (days)</label>
                <input
                  type="number"
                  value={excludeDays}
                  onChange={(e) => setExcludeDays(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">Product Movement Speed</label>
              <div className="flex gap-2">
                {(['fast', 'medium', 'slow'] as InventoryVelocity[]).map(velocity => (
                  <button
                    key={velocity}
                    type="button"
                    onClick={() => handleToggleVelocity(velocity)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      velocityFilter.includes(velocity)
                        ? `${inventoryVelocityColors[velocity]} border-2 border-current`
                        : 'bg-[var(--muted)] text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {inventoryVelocityLabels[velocity]}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span><strong>{eligibleItems.length}</strong> products match your criteria</span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Schedule</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {Object.entries(recurrenceFrequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {frequency !== 'BIWEEKLY' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Repeat Every</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {frequency === 'DAILY' ? 'day(s)' :
                       frequency === 'WEEKLY' ? 'week(s)' :
                       frequency.includes('MONTHLY') ? 'month(s)' : ''}
                    </span>
                  </div>
                </div>
              )}

              {['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Object.entries(dayOfWeekLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === 'MONTHLY_WEEK' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Week of Month</label>
                  <select
                    value={weekOfMonth}
                    onChange={(e) => setWeekOfMonth(e.target.value as WeekOfMonth)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Object.entries(weekOfMonthLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === 'MONTHLY' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Month</label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Create Recurring Job
          </button>
        </div>
      </div>
    </div>
  );
}
