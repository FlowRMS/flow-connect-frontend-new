/**
 * Create Report View - Form to create and configure reports
 */

import React from 'react';
import type { Report } from '../types';
import {
  REPORT_TYPES,
  DATE_FILTERS,
  ASSIGNED_TO_OPTIONS,
  FREQUENCY_OPTIONS,
} from '../constants';

interface CreateReportViewProps {
  reportName: string;
  selectedTypes: string[];
  selectedDateFilter: string;
  selectedScope: string;
  selectedFrequency: string;
  filterCompanies: string;
  filterContacts: string;
  emailRecipients: string;
  onReportNameChange: (value: string) => void;
  onToggleType: (type: string) => void;
  onDateFilterChange: (filter: string) => void;
  onScopeChange: (scope: string) => void;
  onFrequencyChange: (frequency: string) => void;
  onFilterCompaniesChange: (value: string) => void;
  onFilterContactsChange: (value: string) => void;
  onEmailRecipientsChange: (value: string) => void;
  onPreview: () => void;
  onSchedule: () => void;
}

export function CreateReportView({
  reportName,
  selectedTypes,
  selectedDateFilter,
  selectedScope,
  selectedFrequency,
  filterCompanies,
  filterContacts,
  emailRecipients,
  onReportNameChange,
  onToggleType,
  onDateFilterChange,
  onScopeChange,
  onFrequencyChange,
  onFilterCompaniesChange,
  onFilterContactsChange,
  onEmailRecipientsChange,
  onPreview,
  onSchedule,
}: CreateReportViewProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="space-y-6">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => onReportNameChange(e.target.value)}
              placeholder="e.g., Daily Tasks Due Today"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Report Types */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Report Types (select one or more)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => onToggleType(type)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{type}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              The report will include all selected types that meet the filter
              criteria below
            </p>
          </div>

          {/* Time Frame */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Time Frame
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DATE_FILTERS.map((filter) => (
                <label
                  key={filter}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="dateFilter"
                    checked={selectedDateFilter === filter}
                    onChange={() => onDateFilterChange(filter)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm">{filter}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Assigned To
            </label>
            <div className="space-y-2">
              {ASSIGNED_TO_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={selectedScope === option.value}
                    onChange={() => onScopeChange(option.value)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.value}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Filter by Companies */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Filter by Companies (optional)
            </label>
            <input
              type="text"
              value={filterCompanies}
              onChange={(e) => onFilterCompaniesChange(e.target.value)}
              placeholder="Select companies..."
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Filter results to specific companies
            </p>
          </div>

          {/* Filter by Contacts */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Filter by Contacts (optional)
            </label>
            <input
              type="text"
              value={filterContacts}
              onChange={(e) => onFilterContactsChange(e.target.value)}
              placeholder="Select contacts..."
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Filter results to specific contacts
            </p>
          </div>

          {/* Delivery Schedule */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Delivery Schedule
            </label>
            <div className="grid grid-cols-3 gap-3">
              {FREQUENCY_OPTIONS.map((freq) => (
                <label
                  key={freq}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="frequency"
                    checked={selectedFrequency === freq}
                    onChange={() => onFrequencyChange(freq)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-medium">{freq}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email Recipients */}
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Email Recipients
            </label>
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => onEmailRecipientsChange(e.target.value)}
              placeholder="email@example.com (comma separated)"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Enter multiple email addresses separated by commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              onClick={onPreview}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Preview Report
            </button>
            <button
              onClick={onSchedule}
              className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
