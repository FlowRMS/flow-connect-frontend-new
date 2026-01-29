'use client';

import React, { useState, useMemo } from 'react';
import {
  CycleCountTriggerType,
  cycleCountTriggerTypeLabels,
  InventoryVelocity,
  inventoryVelocityLabels,
  inventoryVelocityColors,
  RecurrenceFrequency,
  DayOfWeek,
  WeekOfMonth,
  recurrenceFrequencyLabels,
  dayOfWeekLabels,
  weekOfMonthLabels,
} from '@/lib/types/warehouse';
import {
  mockWarehouses,
  getEligibleItemsForAutoGenerate,
  autoGenerateCycleCount,
  addRecurringCycleCountJob,
  calculateNextDate,
} from '@/lib/data/warehouse-mock';

interface AutoGenerateCycleCountModalProps {
  onClose: () => void;
  onGenerated: (cycleCountId: string) => void;
}

export default function AutoGenerateCycleCountModal({
  onClose,
  onGenerated,
}: AutoGenerateCycleCountModalProps) {
  // Basic settings
  const [itemCount, setItemCount] = useState(20);
  const [excludeDays, setExcludeDays] = useState(60);
  const [velocityFilter, setVelocityFilter] = useState<InventoryVelocity[]>(['fast']);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(mockWarehouses[0]?.id || '');

  // Scheduling settings
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
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

  const itemsToGenerate = Math.min(itemCount, eligibleItems.length);

  const handleToggleVelocity = (velocity: InventoryVelocity) => {
    setVelocityFilter(prev =>
      prev.includes(velocity)
        ? prev.filter(v => v !== velocity)
        : [...prev, velocity]
    );
  };

  const handleGenerate = () => {
    if (scheduleEnabled) {
      // Create recurring job
      const job = addRecurringCycleCountJob({
        name: scheduleName || `Auto-Generated ${inventoryVelocityLabels[velocityFilter[0] || 'fast']} Count`,
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || '',
        triggerType: 'FAST_MOVING' as CycleCountTriggerType,
        itemCount,
        velocityFilter: velocityFilter.length > 0 ? velocityFilter : undefined,
        excludeRecentlyCountedDays: excludeDays,
        recurrencePattern: {
          frequency,
          interval,
          dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
          weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
          dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
        },
        startDate,
        status: 'ACTIVE',
        nextScheduledDate: calculateNextDate(
          {
            frequency,
            interval,
            dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
            weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
            dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
          },
          new Date(startDate)
        ).toISOString().split('T')[0],
        createdBy: 'Current User',
      });

      // Also generate the first cycle count immediately
      const cycleCount = autoGenerateCycleCount({
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || '',
        triggerType: 'FAST_MOVING',
        excludeRecentlyCountedDays: excludeDays,
        createdBy: 'Current User',
      });

      onGenerated(cycleCount.id);
    } else {
      // Generate one-time cycle count
      const cycleCount = autoGenerateCycleCount({
        warehouseId: selectedWarehouseId,
        warehouseName: selectedWarehouse?.name || '',
        triggerType: 'FAST_MOVING',
        excludeRecentlyCountedDays: excludeDays,
        createdBy: 'Current User',
      });

      onGenerated(cycleCount.id);
    }
  };

  const canGenerate = itemsToGenerate > 0 && selectedWarehouseId && (!scheduleEnabled || scheduleName.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Auto Generate Counts</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Generate cycle counts based on criteria</p>
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
          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Warehouse
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Generation Settings */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Generation Settings</h3>

            {/* Item Count */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Number of Products to Count
              </label>
              <input
                type="number"
                value={itemCount}
                onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value) || 1))}
                onFocus={(e) => e.target.select()}
                min={1}
                max={100}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Exclude Days */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Exclude products counted in the last (days)
              </label>
              <input
                type="number"
                value={excludeDays}
                onChange={(e) => setExcludeDays(Math.max(0, parseInt(e.target.value) || 0))}
                onFocus={(e) => e.target.select()}
                min={0}
                max={365}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Products counted within this period will not be included
              </p>
            </div>

            {/* Velocity Filter */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Product Movement Speed
              </label>
              <div className="flex gap-2">
                {(['fast', 'medium', 'slow'] as InventoryVelocity[]).map(velocity => (
                  <button
                    key={velocity}
                    type="button"
                    onClick={() => handleToggleVelocity(velocity)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      velocityFilter.includes(velocity)
                        ? `${inventoryVelocityColors[velocity]} border-2 border-current`
                        : 'bg-[var(--muted)] text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {inventoryVelocityLabels[velocity]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Select which product types to include
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span className="text-sm font-medium text-blue-800">Preview</span>
            </div>
            <p className="text-sm text-blue-700">
              <strong>{eligibleItems.length}</strong> products match your criteria.
              This will generate a cycle count for <strong>{itemsToGenerate}</strong> randomly selected products.
            </p>
            {eligibleItems.length === 0 && (
              <p className="text-xs text-blue-600 mt-2">
                No products available. Try adjusting the exclude days or velocity filters.
              </p>
            )}
          </div>

          {/* Schedule Option */}
          <div className="border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="schedule-enabled"
                checked={scheduleEnabled}
                onChange={(e) => setScheduleEnabled(e.target.checked)}
                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <label htmlFor="schedule-enabled" className="text-sm font-medium text-[var(--foreground)]">
                Schedule this as a recurring job
              </label>
            </div>

            {scheduleEnabled && (
              <div className="space-y-4 pl-7 border-l-2 border-[var(--primary)]/20 ml-1.5">
                {/* Schedule Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Schedule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="e.g., Weekly Fast Movers Count"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Frequency
                    </label>
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
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Repeat Every
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={interval}
                          onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                          onFocus={(e) => e.target.select()}
                          className="w-20 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {frequency === 'DAILY' ? 'day(s)' :
                           frequency === 'WEEKLY' ? 'week(s)' :
                           frequency.includes('MONTHLY') ? 'month(s)' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Day of Week (for weekly/biweekly) */}
                {['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Day of Week
                    </label>
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

                {/* Week of Month (for monthly week) */}
                {frequency === 'MONTHLY_WEEK' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Week of Month
                    </label>
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

                {/* Day of Month (for monthly) */}
                {frequency === 'MONTHLY' && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Day of Month
                    </label>
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

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>
            )}
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
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {scheduleEnabled ? 'Create Schedule & Generate' : 'Generate Cycle Count'}
          </button>
        </div>
      </div>
    </div>
  );
}
