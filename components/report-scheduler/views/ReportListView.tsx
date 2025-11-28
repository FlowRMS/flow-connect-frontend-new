/**
 * Report List View - Table view of scheduled reports
 */

import React from 'react';
import type { Report } from '../types';
import { TABLE_COLUMNS } from '../constants';

interface ReportListViewProps {
  reports: Report[];
  onReportClick: (report: Report) => void;
  onToggleEnabled: (reportId: string) => void;
}

export function ReportListView({
  reports,
  onReportClick,
  onToggleEnabled,
}: ReportListViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        {TABLE_COLUMNS.map((column) => (
          <div
            key={column.key}
            className={`col-span-${column.span} text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[var(--border)]">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => onReportClick(report)}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
          >
            {/* Report Name */}
            <div className="col-span-3">
              <h3 className="font-medium text-[var(--foreground)] mb-1">
                {report.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span>{report.id}</span>
                <span>·</span>
                <span>
                  {report.recipients.length} recipient
                  {report.recipients.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Type & Filter */}
            <div className="col-span-2 flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                {report.types.map((type, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                {report.dateFilter}
              </span>
            </div>

            {/* Scope & Filters */}
            <div className="col-span-2 flex flex-col gap-1">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium w-fit">
                {report.assignedTo}
              </span>
              {report.additionalFilters && (
                <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                  {report.additionalFilters.companies && (
                    <div>
                      Companies: {report.additionalFilters.companies.join(', ')}
                    </div>
                  )}
                  {report.additionalFilters.contacts && (
                    <div>
                      Contacts: {report.additionalFilters.contacts.join(', ')}
                    </div>
                  )}
                  {report.additionalFilters.tags && (
                    <div>Tags: {report.additionalFilters.tags.join(', ')}</div>
                  )}
                </div>
              )}
            </div>

            {/* Frequency */}
            <div className="col-span-2 flex items-center">
              <span className="text-sm text-[var(--foreground)]">
                {report.frequency}
              </span>
            </div>

            {/* Next Run */}
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground)]">
                {formatDate(report.nextRun)}
              </span>
              {report.lastRun && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Last: {formatDate(report.lastRun)}
                </span>
              )}
            </div>

            {/* Status Toggle */}
            <div className="col-span-1 flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEnabled(report.id);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  report.enabled ? 'bg-[var(--primary)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    report.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
