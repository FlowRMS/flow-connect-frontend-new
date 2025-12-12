'use client';

import React, { useState } from 'react';

// ============================================
// TYPES
// ============================================

type WorkflowType =
  | 'city-visit'
  | 'event-attendees'
  | 'job-contacts'
  | 'overdue-quotes'
  | 'quote-followup'
  | 'hubspot-import'
  | 'custom';

type WorkflowDefinition = {
  id: WorkflowType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  matchCount?: number;
  configFields: ConfigField[];
};

type ConfigField = {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'text' | 'date';
  placeholder?: string;
  options?: { value: string; label: string; count?: number }[];
};

// Mock data for configuration options
const mockCities = [
  { value: 'new-york', label: 'New York, NY', count: 24 },
  { value: 'los-angeles', label: 'Los Angeles, CA', count: 18 },
  { value: 'chicago', label: 'Chicago, IL', count: 15 },
  { value: 'houston', label: 'Houston, TX', count: 12 },
  { value: 'phoenix', label: 'Phoenix, AZ', count: 8 },
  { value: 'dallas', label: 'Dallas, TX', count: 11 },
];

const mockEvents = [
  { value: 'lightfair-2025', label: 'LightFair 2025', count: 45 },
  { value: 'ies-annual-2024', label: 'IES Annual Conference 2024', count: 32 },
  { value: 'neca-2024', label: 'NECA Show 2024', count: 28 },
  { value: 'greenbuild-2024', label: 'Greenbuild 2024', count: 19 },
];

const mockJobs = [
  { value: 'downtown-plaza', label: 'Downtown Plaza Renovation', count: 8 },
  { value: 'hospital-expansion', label: 'Hospital Expansion Project', count: 12 },
  { value: 'tech-campus', label: 'Tech Campus Build-out', count: 6 },
  { value: 'retail-center', label: 'Retail Center Lighting', count: 4 },
];

const mockImports = [
  { value: 'hubspot-dec7', label: 'HubSpot Import - 12/7/2025', count: 9 },
  { value: 'hubspot-dec1', label: 'HubSpot Import - 12/1/2025', count: 15 },
  { value: 'hubspot-nov25', label: 'HubSpot Import - 11/25/2025', count: 22 },
];

// ============================================
// COMPONENT
// ============================================

type Props = {
  onSelectWorkflow: (workflowType: WorkflowType) => void;
  onBack: () => void;
};

export default function WorkflowSelector({ onSelectWorkflow, onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const workflows: WorkflowDefinition[] = [
    {
      id: 'city-visit',
      name: 'City Visit',
      description: 'Email contacts at companies in a specific city you\'re planning to visit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      color: 'bg-blue-500',
      matchCount: 24,
      configFields: [
        { id: 'city', label: 'Select City', type: 'select', placeholder: 'Choose a city...', options: mockCities },
        { id: 'visitDate', label: 'Visit Date (optional)', type: 'date' },
      ],
    },
    {
      id: 'event-attendees',
      name: 'Event Attendees',
      description: 'Email people who are attending or attended a specific event or trade show',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: 'bg-purple-500',
      matchCount: 45,
      configFields: [
        { id: 'event', label: 'Select Event', type: 'select', placeholder: 'Choose an event...', options: mockEvents },
      ],
    },
    {
      id: 'job-contacts',
      name: 'Job Contacts',
      description: 'Email everyone associated with a specific job or project',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
      ),
      color: 'bg-green-500',
      matchCount: 18,
      configFields: [
        { id: 'job', label: 'Select Job', type: 'select', placeholder: 'Choose a job...', options: mockJobs },
      ],
    },
    {
      id: 'overdue-quotes',
      name: 'Overdue Quotes',
      description: 'Follow up with contacts who have quotes that are past their expiration date',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: 'bg-red-500',
      matchCount: 12,
      configFields: [
        { id: 'daysOverdue', label: 'Days Overdue (minimum)', type: 'select', placeholder: 'Select...', options: [
          { value: '1', label: '1+ days overdue', count: 12 },
          { value: '7', label: '7+ days overdue', count: 8 },
          { value: '14', label: '14+ days overdue', count: 5 },
          { value: '30', label: '30+ days overdue', count: 3 },
        ]},
      ],
    },
    {
      id: 'quote-followup',
      name: 'Quote Follow-up',
      description: 'Email contacts about quotes that need follow-up or haven\'t been responded to',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      color: 'bg-orange-500',
      matchCount: 31,
      configFields: [
        { id: 'quoteStatus', label: 'Quote Status', type: 'select', placeholder: 'Select status...', options: [
          { value: 'sent', label: 'Sent - No Response', count: 18 },
          { value: 'viewed', label: 'Viewed - No Response', count: 8 },
          { value: 'pending', label: 'Pending Approval', count: 5 },
        ]},
        { id: 'daysSinceSent', label: 'Days Since Sent', type: 'select', placeholder: 'Select...', options: [
          { value: '3', label: '3+ days', count: 31 },
          { value: '7', label: '7+ days', count: 22 },
          { value: '14', label: '14+ days', count: 15 },
        ]},
      ],
    },
    {
      id: 'hubspot-import',
      name: 'HubSpot Import',
      description: 'Email contacts from a recent HubSpot import or sync',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      color: 'bg-orange-400',
      matchCount: 9,
      configFields: [
        { id: 'import', label: 'Select Import', type: 'select', placeholder: 'Choose an import...', options: mockImports },
      ],
    },
    {
      id: 'custom',
      name: 'Custom Workflow',
      description: 'Create a custom email workflow with your own criteria and filters',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      ),
      color: 'bg-gray-500',
      configFields: [],
    },
  ];

  const filteredWorkflows = workflows.filter(
    w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWorkflowClick = (workflow: WorkflowDefinition) => {
    if (workflow.configFields.length === 0) {
      // No config needed, go directly to compose
      onSelectWorkflow(workflow.id);
    } else {
      // Show config modal
      setSelectedWorkflow(workflow);
      setConfigValues({});
    }
  };

  const handleConfigSubmit = () => {
    if (selectedWorkflow) {
      onSelectWorkflow(selectedWorkflow.id);
    }
  };

  const getMatchCount = () => {
    if (!selectedWorkflow) return 0;
    const firstField = selectedWorkflow.configFields[0];
    if (firstField && firstField.options && configValues[firstField.id]) {
      const selected = firstField.options.find(o => o.value === configValues[firstField.id]);
      return selected?.count || 0;
    }
    return selectedWorkflow.matchCount || 0;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Inbox
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Select Email Workflow</h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          Choose a workflow type to send targeted emails to groups of contacts
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)]"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredWorkflows.map(workflow => (
            <button
              key={workflow.id}
              onClick={() => handleWorkflowClick(workflow)}
              className="flex items-start gap-4 p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-md transition-all text-left group"
            >
              <div className={`flex-shrink-0 w-12 h-12 ${workflow.color} rounded-lg flex items-center justify-center text-white`}>
                {workflow.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {workflow.name}
                  </h3>
                  {workflow.matchCount !== undefined && (
                    <span className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                      {workflow.matchCount} matches
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{workflow.description}</p>
              </div>
              <svg
                className="flex-shrink-0 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors mt-1"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto mb-4 text-[var(--muted-foreground)]"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No workflows found</h3>
            <p className="text-[var(--muted-foreground)]">Try adjusting your search terms</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <div className="text-2xl font-bold text-[var(--foreground)]">139</div>
            <div className="text-sm text-[var(--muted-foreground)]">Total contacts available</div>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <div className="text-2xl font-bold text-[var(--foreground)]">45</div>
            <div className="text-sm text-[var(--muted-foreground)]">Pending follow-ups</div>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <div className="text-2xl font-bold text-[var(--foreground)]">12</div>
            <div className="text-sm text-[var(--muted-foreground)]">Overdue items</div>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <div className="text-2xl font-bold text-[var(--foreground)]">7</div>
            <div className="text-sm text-[var(--muted-foreground)]">Campaigns this month</div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedWorkflow(null)} />
          <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${selectedWorkflow.color} rounded-lg flex items-center justify-center text-white`}>
                  {selectedWorkflow.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">{selectedWorkflow.name}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Configure your email group</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {selectedWorkflow.configFields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    {field.label}
                  </label>
                  {field.type === 'select' && field.options && (
                    <select
                      value={configValues[field.id] || ''}
                      onChange={(e) => setConfigValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} {option.count !== undefined && `(${option.count} contacts)`}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={configValues[field.id] || ''}
                      onChange={(e) => setConfigValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  )}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={configValues[field.id] || ''}
                      onChange={(e) => setConfigValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  )}
                </div>
              ))}

              {/* Match Preview */}
              <div className="p-4 bg-[var(--muted)] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Contacts matching criteria:</span>
                  <span className="text-lg font-semibold text-[var(--foreground)]">{getMatchCount()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigSubmit}
                disabled={selectedWorkflow.configFields.some(f => f.type === 'select' && !configValues[f.id])}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Continue to Compose
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
