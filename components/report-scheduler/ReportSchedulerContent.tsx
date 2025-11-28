/**
 * Report Scheduler Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React from 'react';
import type { Report, ReportType } from './types';
import { useReportSchedulerState } from './hooks/useReportSchedulerState';
import { ReportListView } from './views/ReportListView';
import { CreateReportView } from './views/CreateReportView';
import { ReportPreviewModal } from './modals/ReportPreviewModal';

export default function ReportSchedulerContent() {
  // State management
  const {
    activeTab,
    setActiveTab,
    reports,
    reportName,
    setReportName,
    selectedTypes,
    selectedDateFilter,
    setSelectedDateFilter,
    selectedScope,
    setSelectedScope,
    selectedFrequency,
    setSelectedFrequency,
    filterCompanies,
    setFilterCompanies,
    filterContacts,
    setFilterContacts,
    emailRecipients,
    setEmailRecipients,
    previewReport,
    setPreviewReport,
    toggleType,
    loadReportForEditing,
    toggleReportEnabled,
  } = useReportSchedulerState();

  // Handler: Generate preview report
  const handlePreview = () => {
    const report: Report = {
      id: 'PREVIEW',
      name: reportName,
      types: selectedTypes as ReportType[],
      dateFilter: selectedDateFilter as any,
      assignedTo: selectedScope as any,
      additionalFilters: {
        companies: filterCompanies
          ? filterCompanies.split(',').map((c) => c.trim())
          : undefined,
        contacts: filterContacts
          ? filterContacts.split(',').map((c) => c.trim())
          : undefined,
      },
      frequency: selectedFrequency as any,
      recipients: emailRecipients
        ? emailRecipients.split(',').map((e) => e.trim())
        : [],
      enabled: true,
      nextRun: new Date().toISOString(),
    };
    setPreviewReport(report);
  };

  // Handler: Schedule report (switches to reports tab)
  const handleSchedule = () => {
    setActiveTab('reports');
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Report Scheduler
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Build and schedule automated email reports
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Scheduled Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Create Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports Tab */}
      {activeTab === 'reports' && (
        <ReportListView
          reports={reports}
          onReportClick={loadReportForEditing}
          onToggleEnabled={toggleReportEnabled}
        />
      )}

      {/* Create Report Tab */}
      {activeTab === 'create' && (
        <CreateReportView
          reportName={reportName}
          selectedTypes={selectedTypes}
          selectedDateFilter={selectedDateFilter}
          selectedScope={selectedScope}
          selectedFrequency={selectedFrequency}
          filterCompanies={filterCompanies}
          filterContacts={filterContacts}
          emailRecipients={emailRecipients}
          onReportNameChange={setReportName}
          onToggleType={toggleType}
          onDateFilterChange={setSelectedDateFilter}
          onScopeChange={setSelectedScope}
          onFrequencyChange={setSelectedFrequency}
          onFilterCompaniesChange={setFilterCompanies}
          onFilterContactsChange={setFilterContacts}
          onEmailRecipientsChange={setEmailRecipients}
          onPreview={handlePreview}
          onSchedule={handleSchedule}
        />
      )}

      {/* Preview Modal */}
      <ReportPreviewModal
        report={previewReport}
        onClose={() => setPreviewReport(null)}
      />
    </main>
  );
}
