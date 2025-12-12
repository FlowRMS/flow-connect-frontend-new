'use client';

import React, { useState } from 'react';

type SavedReport = {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  lastModified: string;
  createdBy: string;
};

export default function ReportBuilderContent() {
  const [activeTab, setActiveTab] = useState<'builder' | 'saved'>('builder');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const savedReports: SavedReport[] = [
    {
      id: 'SR-001',
      name: 'Top Performing Jobs This Quarter',
      description: 'Jobs sorted by value with status breakdown',
      dataSource: 'Jobs',
      lastModified: '2024-11-20',
      createdBy: 'Sarah Johnson',
    },
    {
      id: 'SR-002',
      name: 'Team Task Completion Report',
      description: 'Task completion rates by assignee and type',
      dataSource: 'Tasks',
      lastModified: '2024-11-18',
      createdBy: 'Marcus Chen',
    },
    {
      id: 'SR-003',
      name: 'Sales Pipeline Analysis',
      description: 'Pre-opportunities and jobs by stage and territory',
      dataSource: 'Pre-Opportunities',
      lastModified: '2024-11-15',
      createdBy: 'Sarah Johnson',
    },
  ];

  const dataSourceOptions = [
    { value: 'jobs', label: 'Jobs', icon: '💼' },
    { value: 'pre-opportunities', label: 'Pre-Opportunities', icon: '🎯' },
    { value: 'tasks', label: 'Tasks', icon: '✓' },
    { value: 'notes', label: 'Notes', icon: '📝' },
    { value: 'contacts', label: 'Contacts', icon: '👤' },
    { value: 'companies', label: 'Companies', icon: '🏢' },
  ];

  const fieldOptions: Record<string, string[]> = {
    jobs: ['Job ID', 'Job Name', 'Status', 'Job Type', 'Value', 'Start Date', 'GC', 'EC', 'Territory', 'Tags'],
    'pre-opportunities': ['Pre-Opp ID', 'Name', 'Stage', 'Value', 'Sold To', 'Manufacturer', 'Created Date', 'Territory'],
    tasks: ['Task ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Task Type', 'Tags'],
    notes: ['Note ID', 'Title', 'Created By', 'Created Date', 'Tags', 'Entity Type', 'Entity Name'],
    contacts: ['Contact ID', 'Name', 'Email', 'Phone', 'Company', 'Role', 'Contact Type', 'Territory'],
    companies: ['Company ID', 'Name', 'Type', 'Territory', 'Contact Count', 'Job Count', 'Tags'],
  };

  const aggregationOptions = ['Count', 'Sum', 'Average', 'Min', 'Max', 'Group by'];

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Report Builder</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create custom reports with flexible filtering and grouping
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'builder'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Build Report
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'saved'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Saved Reports ({savedReports.length})
          </button>
        </div>
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Report Configuration */}
          <div className="col-span-2 space-y-6">
            {/* Data Source Selection */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">1. Select Data Source</h3>
              <div className="grid grid-cols-3 gap-3">
                {dataSourceOptions.map((source) => (
                  <button
                    key={source.value}
                    onClick={() => setSelectedDataSource(source.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedDataSource === source.value
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{source.icon}</div>
                    <div className="text-sm font-medium">{source.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDataSource && (
              <>
                {/* Field Selection */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">2. Select Fields to Display</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldOptions[selectedDataSource]?.map((field) => (
                      <label
                        key={field}
                        className="flex items-center gap-2 p-2 rounded hover:bg-[var(--muted)] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFields([...selectedFields, field]);
                            } else {
                              setSelectedFields(selectedFields.filter(f => f !== field));
                            }
                          }}
                          className="w-4 h-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">3. Add Filters (Optional)</h3>
                    <button
                      onClick={() => setFilters([...filters, { field: '', operator: 'equals', value: '' }])}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      + Add Filter
                    </button>
                  </div>
                  {filters.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No filters applied. Click "Add Filter" to start.</p>
                  ) : (
                    <div className="space-y-3">
                      {filters.map((filter, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <select className="col-span-4 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)]">
                            <option value="">Select field...</option>
                            {fieldOptions[selectedDataSource]?.map((field) => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                          <select className="col-span-3 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)]">
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Value..."
                            className="col-span-4 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)]"
                          />
                          <button
                            onClick={() => setFilters(filters.filter((_, i) => i !== index))}
                            className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group By */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">4. Group By (Optional)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldOptions[selectedDataSource]?.map((field) => (
                      <label
                        key={field}
                        className="flex items-center gap-2 p-2 rounded hover:bg-[var(--muted)] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={groupBy.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupBy([...groupBy, field]);
                            } else {
                              setGroupBy(groupBy.filter(f => f !== field));
                            }
                          }}
                          className="w-4 h-4 accent-[var(--primary)]"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">5. Sort By (Optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)]"
                    >
                      <option value="">Select field...</option>
                      {selectedFields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <select className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--card)]">
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Actions & Preview */}
          <div className="col-span-1 space-y-4">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Report Summary</h3>

              <div className="space-y-3 mb-6">
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Data Source</div>
                  <div className="text-sm text-[var(--foreground)]">
                    {selectedDataSource ? dataSourceOptions.find(d => d.value === selectedDataSource)?.label : 'Not selected'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Fields Selected</div>
                  <div className="text-sm text-[var(--foreground)]">{selectedFields.length} field(s)</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Filters Applied</div>
                  <div className="text-sm text-[var(--foreground)]">{filters.length} filter(s)</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">Grouping</div>
                  <div className="text-sm text-[var(--foreground)]">
                    {groupBy.length > 0 ? `${groupBy.length} group(s)` : 'None'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!selectedDataSource || selectedFields.length === 0}
                  className="w-full px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run Report
                </button>
                <button
                  disabled={!selectedDataSource || selectedFields.length === 0}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Report
                </button>
                <button
                  disabled={!selectedDataSource || selectedFields.length === 0}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export to Excel
                </button>
                <button
                  disabled={!selectedDataSource || selectedFields.length === 0}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Tab */}
      {activeTab === 'saved' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Report Name
            </div>
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Data Source
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Created By
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Last Modified
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {savedReports.map((report) => (
              <div
                key={report.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors"
              >
                <div className="col-span-4">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{report.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{report.description}</p>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {report.dataSource}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{report.createdBy}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">{report.lastModified}</span>
                </div>
                <div className="col-span-1 flex items-center gap-2">
                  <button
                    className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                    title="Run Report"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                  <button
                    className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                    title="Edit Report"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 010 3l-9.5 9.5L5 16l1-4 9.5-9.5a2.121 2.121 0 013 0z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Report Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                <div className="text-4xl mb-4">📊</div>
                <p>Report preview will display here with selected fields and filters applied</p>
                <p className="text-sm mt-2">Showing data from: {dataSourceOptions.find(d => d.value === selectedDataSource)?.label}</p>
                <p className="text-sm">Fields: {selectedFields.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
