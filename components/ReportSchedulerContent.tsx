'use client';

import React, { useState } from 'react';

type Report = {
  id: string;
  name: string;
  types: ('Notes' | 'Jobs' | 'Pre-Opportunities' | 'Quotes' | 'Tasks')[];
  dateFilter: 'Yesterday' | 'Last Week' | 'Due Today' | 'Due This Week' | 'Created Yesterday' | 'Created Last Week';
  assignedTo: 'Me' | 'My Team' | 'All Reps';
  additionalFilters?: {
    companies?: string[];
    contacts?: string[];
    tags?: string[];
    status?: string[];
  };
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
};

export default function ReportSchedulerContent() {
  const [activeTab, setActiveTab] = useState<'reports' | 'create'>('reports');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [reportName, setReportName] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [filterCompanies, setFilterCompanies] = useState('');
  const [filterContacts, setFilterContacts] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');

  const [reports, setReports] = useState<Report[]>([
    {
      id: 'R-001',
      name: 'Daily Tasks Due Today',
      types: ['Tasks'],
      dateFilter: 'Due Today',
      assignedTo: 'Me',
      frequency: 'Daily',
      recipients: ['sarah.johnson@company.com'],
      enabled: true,
      lastRun: '2024-11-22',
      nextRun: '2024-11-23',
    },
    {
      id: 'R-002',
      name: 'Weekly Team Activity',
      types: ['Notes', 'Tasks'],
      dateFilter: 'Created Last Week',
      assignedTo: 'My Team',
      additionalFilters: {
        companies: ['TechCorp', 'BuildCo'],
      },
      frequency: 'Weekly',
      recipients: ['sarah.johnson@company.com', 'marcus.chen@company.com'],
      enabled: true,
      lastRun: '2024-11-18',
      nextRun: '2024-11-25',
    },
    {
      id: 'R-003',
      name: 'Weekly Pre-Opportunities Review',
      types: ['Pre-Opportunities', 'Jobs'],
      dateFilter: 'Created Last Week',
      assignedTo: 'All Reps',
      additionalFilters: {
        companies: ['All'],
        contacts: ['John Smith', 'Jane Doe'],
      },
      frequency: 'Weekly',
      recipients: ['leadership@company.com'],
      enabled: false,
      nextRun: '2024-11-25',
    },
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const loadReportForEditing = (report: Report) => {
    setReportName(report.name);
    setSelectedTypes(report.types);
    setSelectedDateFilter(report.dateFilter);
    setSelectedScope(report.assignedTo);
    setSelectedFrequency(report.frequency);
    setFilterCompanies(report.additionalFilters?.companies?.join(', ') || '');
    setFilterContacts(report.additionalFilters?.contacts?.join(', ') || '');
    setEmailRecipients(report.recipients.join(', '));
    setActiveTab('create');
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Report Scheduler</h1>
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
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Report Name
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type & Filter
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Scope & Filters
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Frequency
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Next Run
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => loadReportForEditing(report)}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{report.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>{report.id}</span>
                    <span>·</span>
                    <span>{report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
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
                  <span className="text-xs text-[var(--muted-foreground)]">{report.dateFilter}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium w-fit">
                    {report.assignedTo}
                  </span>
                  {report.additionalFilters && (
                    <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                      {report.additionalFilters.companies && (
                        <div>Companies: {report.additionalFilters.companies.join(', ')}</div>
                      )}
                      {report.additionalFilters.contacts && (
                        <div>Contacts: {report.additionalFilters.contacts.join(', ')}</div>
                      )}
                      {report.additionalFilters.tags && (
                        <div>Tags: {report.additionalFilters.tags.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{report.frequency}</span>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-sm text-[var(--foreground)]">{formatDate(report.nextRun)}</span>
                  {report.lastRun && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Last: {formatDate(report.lastRun)}
                    </span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedReports = reports.map(r =>
                        r.id === report.id ? { ...r, enabled: !r.enabled } : r
                      );
                      setReports(updatedReports);
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
      )}

      {/* Create Report Tab */}
      {activeTab === 'create' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Daily Tasks Due Today"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                  Report Types (select one or more)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Notes', 'Jobs', 'Pre-Opportunities', 'Quotes', 'Tasks'].map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  The report will include all selected types that meet the filter criteria below
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                  Time Frame
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Created Yesterday', 'Created Last Week', 'Due Today', 'Due This Week'].map((filter) => (
                    <label
                      key={filter}
                      className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={selectedDateFilter === filter}
                        onChange={() => setSelectedDateFilter(filter)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm">{filter}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                  Assigned To
                </label>
                <div className="space-y-2">
                  {['Me', 'My Team', 'All Reps'].map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={selectedScope === scope}
                        onChange={() => setSelectedScope(scope)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{scope}</div>
                        {scope === 'Me' && (
                          <div className="text-xs text-[var(--muted-foreground)]">Only items assigned to you</div>
                        )}
                        {scope === 'My Team' && (
                          <div className="text-xs text-[var(--muted-foreground)]">Items assigned to your team members</div>
                        )}
                        {scope === 'All Reps' && (
                          <div className="text-xs text-[var(--muted-foreground)]">All items across the organization</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Filter by Companies (optional)
                </label>
                <input
                  type="text"
                  value={filterCompanies}
                  onChange={(e) => setFilterCompanies(e.target.value)}
                  placeholder="Select companies..."
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Filter results to specific companies
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Filter by Contacts (optional)
                </label>
                <input
                  type="text"
                  value={filterContacts}
                  onChange={(e) => setFilterContacts(e.target.value)}
                  placeholder="Select contacts..."
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Filter results to specific contacts
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
                  Delivery Schedule
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                    <label
                      key={freq}
                      className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="frequency"
                        checked={selectedFrequency === freq}
                        onChange={() => setSelectedFrequency(freq)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium">{freq}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                  Email Recipients
                </label>
                <input
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email@example.com (comma separated)"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Enter multiple email addresses separated by commas
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    const report: Report = {
                      id: 'PREVIEW',
                      name: reportName,
                      types: selectedTypes as ('Notes' | 'Jobs' | 'Pre-Opportunities' | 'Quotes' | 'Tasks')[],
                      dateFilter: selectedDateFilter as any,
                      assignedTo: selectedScope as any,
                      additionalFilters: {
                        companies: filterCompanies ? filterCompanies.split(',').map(c => c.trim()) : undefined,
                        contacts: filterContacts ? filterContacts.split(',').map(c => c.trim()) : undefined,
                      },
                      frequency: selectedFrequency as any,
                      recipients: emailRecipients ? emailRecipients.split(',').map(e => e.trim()) : [],
                      enabled: true,
                      nextRun: new Date().toISOString(),
                    };
                    setPreviewReport(report);
                  }}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Preview Report
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Schedule Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{previewReport.name}</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {previewReport.dateFilter} · {previewReport.assignedTo}
                </p>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-8">
              {/* Sample Data Preview */}
              {previewReport.types.map((type, typeIndex) => (
                <div key={type} className={typeIndex > 0 ? 'mt-12' : ''}>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]">
                    {type}
                  </h3>
                  <div className="space-y-6">
                    {type === 'Notes' && (
                      <>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              SJ
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">
                                Downtown Plaza - Lighting Meeting Notes
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
                                <span>Sarah Johnson</span>
                                <span>·</span>
                                <span>11/21/2024</span>
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded text-sm mb-4">
                                <span className="text-blue-700 font-medium">Job</span>
                                <span className="text-[var(--muted-foreground)]">Downtown Plaza Renovation</span>
                              </div>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">N-001</span>
                          </div>
                          <p className="text-[var(--foreground)] leading-relaxed mb-4">
                            Met with Turner Construction PM and Miller Electric to discuss lighting control requirements. Key takeaways: Need dimming on all zones, prefer wireless controls, budget is flexible for quality system. Action: Send quote for Lutron system by Friday.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Meeting</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Lighting</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Controls</span>
                          </div>
                          <div className="text-sm text-[var(--muted-foreground)]">
                            <span className="font-medium">MENTIONED:</span>{' '}
                            <span className="text-blue-600">@Turner Construction</span>{' '}
                            <span className="text-blue-600">@Miller Electric</span>
                          </div>
                        </div>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              MC
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">
                                BuildCo Project Timeline Discussion
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
                                <span>Marcus Chen</span>
                                <span>·</span>
                                <span>11/20/2024</span>
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded text-sm mb-4">
                                <span className="text-blue-700 font-medium">Pre-Opportunity</span>
                                <span className="text-[var(--muted-foreground)]">BuildCo Warehouse Expansion</span>
                              </div>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">N-002</span>
                          </div>
                          <p className="text-[var(--foreground)] leading-relaxed">
                            Discussed project timeline with BuildCo team. They're targeting Q1 2025 start. Need to have preliminary proposal ready by end of month.
                          </p>
                        </div>
                      </>
                    )}
                    {type === 'Tasks' && (
                      <>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-base font-semibold text-[var(--foreground)]">
                              Follow up with client on proposal
                            </h4>
                            <span className="text-xs text-[var(--muted-foreground)]">T-001</span>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">In Progress</span>
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium">High</span>
                          </div>
                          <p className="text-[var(--foreground)] leading-relaxed mb-4">
                            Need to call TechCorp and discuss the latest proposal revisions. Make sure to address their concerns about the timeline and pricing structure. Prepare answers for their technical questions about the system integration.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[var(--muted-foreground)]">Assigned To:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">Sarah Johnson</span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Due Date:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">Today</span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Related To:</span>{' '}
                              <span className="text-[var(--foreground)]">TechCorp - Job</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-base font-semibold text-[var(--foreground)]">
                              Review and finalize proposal document
                            </h4>
                            <span className="text-xs text-[var(--muted-foreground)]">T-002</span>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">Pending</span>
                            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">Urgent</span>
                          </div>
                          <p className="text-[var(--foreground)] leading-relaxed mb-4">
                            Final review of the BuildCo warehouse expansion proposal. Check all pricing, verify technical specifications, and ensure all client requirements are addressed. Get sign-off from engineering team before sending.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[var(--muted-foreground)]">Assigned To:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">Marcus Chen</span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Due Date:</span>{' '}
                              <span className="font-medium text-[var(--foreground)]">Today</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {type === 'Jobs' && (
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-semibold text-[var(--foreground)]">
                            Office Building Renovation
                          </h4>
                          <span className="text-xs text-[var(--muted-foreground)]">J-001</span>
                        </div>
                        <div className="mb-4">
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--muted-foreground)]">Value:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">$125,000</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">GC:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">TechCorp</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">Start Date:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">Last Week</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">Territory:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">Downtown</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {type === 'Pre-Opportunities' && (
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-semibold text-[var(--foreground)]">
                            New Construction Project
                          </h4>
                          <span className="text-xs text-[var(--muted-foreground)]">PO-001</span>
                        </div>
                        <div className="mb-4">
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">Proposal</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--muted-foreground)]">Estimated Value:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">$250,000</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">Sold To:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">BuildCo</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">Created:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">Last Week</span>
                          </div>
                          <div>
                            <span className="text-[var(--muted-foreground)]">Manufacturer:</span>{' '}
                            <span className="font-medium text-[var(--foreground)]">Acme Electric</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-[var(--card)] px-6 py-4 border-t border-[var(--border)] flex items-center justify-end">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
