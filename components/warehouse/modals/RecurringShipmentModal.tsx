'use client';

import React, { useState } from 'react';
import {
  RecurrenceFrequency,
  RecurrencePattern,
  DayOfWeek,
  WeekOfMonth,
  recurrenceFrequencyLabels,
  dayOfWeekLabels,
  weekOfMonthLabels,
} from '@/lib/types/warehouse';
import { getRecurrenceDescription } from '@/lib/data/warehouse-mock';

interface RecurringShipmentModalProps {
  onClose: () => void;
  onSubmit: (name: string, pattern: RecurrencePattern, startDate: string, endDate?: string) => void;
  shipmentVendorName?: string;
}

export default function RecurringShipmentModal({
  onClose,
  onSubmit,
  shipmentVendorName,
}: RecurringShipmentModalProps) {
  const [name, setName] = useState(shipmentVendorName ? `${shipmentVendorName} Recurring` : '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth>('FIRST');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);

  const currentPattern: RecurrencePattern = {
    frequency,
    interval,
    dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
    weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
    dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, currentPattern, startDate, hasEndDate ? endDate : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Make Recurring</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Set up automatic delivery scheduling</p>
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Schedule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Legrand Restock"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
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

            {/* Day of Week (for Weekly/Biweekly/Monthly Week) */}
            {['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
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

            {/* Week of Month (for Monthly Week) */}
            {frequency === 'MONTHLY_WEEK' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
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

            {/* Day of Month (for Monthly) */}
            {frequency === 'MONTHLY' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Day of Month
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Interval (for non-biweekly) */}
            {frequency !== 'BIWEEKLY' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
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

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              />
            </div>

            {/* End Date (optional) */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  type="checkbox"
                  id="hasEndDate"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="hasEndDate" className="text-sm font-medium text-[var(--foreground)]">
                  Set End Date
                </label>
              </div>
              {hasEndDate && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              )}
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span className="text-sm font-medium text-blue-800">Schedule Preview</span>
              </div>
              <p className="text-sm text-blue-700">{getRecurrenceDescription(currentPattern)}</p>
              <p className="text-xs text-blue-600 mt-1">
                Starting {new Date(startDate).toLocaleDateString()}
                {hasEndDate && endDate && ` until ${new Date(endDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              Create Recurring Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
