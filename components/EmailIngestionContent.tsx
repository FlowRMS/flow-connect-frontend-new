'use client';

import React, { useState } from 'react';
import SettingsButton from './SettingsButton';

type Email = {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  preview: string;
  date: string;
  status: 'Processed' | 'Needs Attention';
  documentTypes: Array<'Quote' | 'Order' | 'Invoice' | 'Check'>;
  connections: {
    contacts?: string[];
    companies?: string[];
    jobs?: string[];
    preOpportunities?: string[];
  };
  suggestedTasks: string[];
};

export default function EmailIngestionContent() {
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Processed' | 'Needs Attention'>('All');
  const [viewMode, setViewMode] = useState<'card' | 'spreadsheet'>('card');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const initialEmails: Email[] = [
    {
      id: 'E-001',
      sender: 'Marcus Chen',
      recipient: 'Sarah Johnson',
      subject: 'RE: Downtown Plaza - Updated Lighting Quote Request',
      preview: 'Hi Team, Thanks for the initial quote on the lighting package. After reviewing with our electrical contractor, we\'d like to request some modifications to the scope. Can you please revise to include an additional 20 LED fixtures for the lobby area? We\'ll need this by end of week to stay on schedule. Also attached is our latest purchase order template for your reference.',
      date: '2025-11-23T09:15:00',
      status: 'Needs Attention',
      documentTypes: ['Quote', 'Order'],
      connections: {
        contacts: ['Marcus Chen'],
        companies: ['Turner Construction'],
        jobs: ['Downtown Plaza Renovation']
      },
      suggestedTasks: [
        'Revise lighting quote for Downtown Plaza - add 20 LED fixtures',
        'Review purchase order template from Turner',
        'Follow up with quote by end of week'
      ]
    },
    {
      id: 'E-002',
      sender: 'David Miller',
      recipient: 'Emily Roberts',
      subject: 'Payment Confirmation - Invoice #10245',
      preview: 'Dear FlowConnect Team, This email confirms that we have processed payment for Invoice #10245 dated November 15, 2025 in the amount of $45,230.00. The check (#8847) was mailed today via USPS priority mail and should arrive within 2-3 business days. Please update your records accordingly. Let us know if you need any additional documentation.',
      date: '2025-11-22T14:30:00',
      status: 'Needs Attention',
      documentTypes: ['Invoice', 'Check'],
      connections: {
        companies: ['Miller Electric'],
        jobs: ['Riverside Medical Center']
      },
      suggestedTasks: [
        'Record check payment #8847 for $45,230.00',
        'Update invoice #10245 status to paid',
        'Watch for check arrival in 2-3 days'
      ]
    },
    {
      id: 'E-003',
      sender: 'Sarah Johnson',
      recipient: 'Marcus Chen',
      subject: 'New Project Opportunity - University Science Building',
      preview: 'Hello, We\'re currently in the design phase for a new 4-story science building at State University and wanted to reach out about lighting controls for the facility. The project is approximately 85,000 sq ft with labs, classrooms, and office space. Budget is around $200k for the lighting control system. Are you available for a call next week to discuss our needs and timeline?',
      date: '2025-11-22T11:00:00',
      status: 'Needs Attention',
      documentTypes: [],
      connections: {
        contacts: ['Sarah Johnson'],
        companies: ['Smith & Associates']
      },
      suggestedTasks: [
        'Create pre-opportunity for University Science Building',
        'Schedule call with Sarah Johnson',
        'Prepare lighting controls proposal for 85,000 sq ft facility'
      ]
    },
    {
      id: 'E-004',
      sender: 'James Wilson',
      recipient: 'Sarah Johnson',
      subject: 'Purchase Order #JCI-2025-1847',
      preview: 'Please find attached Purchase Order #JCI-2025-1847 for the Seattle Convention Center project. This PO covers the lighting fixtures and controls as outlined in quote Q-2025-442. Total amount: $127,500.00. Net 30 terms. Please confirm receipt and expected delivery date. Our project manager will reach out separately regarding the installation schedule.',
      date: '2025-11-21T16:45:00',
      status: 'Processed',
      documentTypes: ['Order'],
      connections: {
        companies: ['Johnson Controls'],
        jobs: ['Seattle Convention Center']
      },
      suggestedTasks: []
    },
    {
      id: 'E-005',
      sender: 'John Williams',
      recipient: 'David Torres',
      subject: 'Technical Question - Control Panel Configuration',
      preview: 'Hi Support Team, We\'re installing the control panels on the Denver Education Center project and have a question about the configuration. The spec calls for integration with the existing BMS system, but we\'re not seeing the communication protocol options in the manual. Can you provide guidance on how to configure the Modbus connection? Site team needs this resolved ASAP.',
      date: '2025-11-21T10:20:00',
      status: 'Processed',
      documentTypes: [],
      connections: {
        contacts: ['John Williams'],
        companies: ['Hensel Phelps'],
        jobs: ['Denver Education Center']
      },
      suggestedTasks: []
    },
    {
      id: 'E-006',
      sender: 'Robert Martinez',
      recipient: 'Emily Roberts',
      subject: 'Invoice Dispute - Project #SE-8472',
      preview: 'Attention Billing Department, We received invoice #INV-2025-0892 but there appears to be a discrepancy with the quantities billed. Our records show we ordered 45 units of the LED-200 series, but the invoice shows 55 units. Can you please review and send a corrected invoice? We want to process payment but need this resolved first. I\'ve attached our original PO for reference.',
      date: '2025-11-20T13:15:00',
      status: 'Needs Attention',
      documentTypes: ['Invoice', 'Order'],
      connections: {
        companies: ['Summit Electric']
      },
      suggestedTasks: [
        'Review invoice #INV-2025-0892 quantity discrepancy',
        'Compare against original PO from Summit Electric',
        'Issue corrected invoice if needed'
      ]
    },
    {
      id: 'E-007',
      sender: 'Jennifer Lee',
      recipient: 'Marcus Chen',
      subject: 'RFQ - Phoenix Healthcare Campus',
      preview: 'Good morning, McCarthy Building is requesting quotes for the Phoenix Healthcare Campus project. We need pricing for lighting controls across three buildings totaling 220,000 sq ft. Bid due date is December 5, 2025. Plans and specifications are available via the project portal (link below). Please confirm you\'ll be submitting a quote. This is a design-build project with an estimated construction start of March 2026.',
      date: '2025-11-20T08:30:00',
      status: 'Needs Attention',
      documentTypes: ['Quote'],
      connections: {
        companies: ['McCarthy Building']
      },
      suggestedTasks: [
        'Create pre-opportunity for Phoenix Healthcare Campus',
        'Download plans and specifications',
        'Prepare quote - due December 5, 2025',
        'Confirm bid submission to McCarthy Building'
      ]
    },
    {
      id: 'E-008',
      sender: 'David Chen',
      recipient: 'Sarah Johnson',
      subject: 'Change Order Request - Oakland Multi-family Project',
      preview: 'Hi team, we need to submit a change order for the Oakland Multi-family project. Owner has requested to upgrade from standard to premium lighting controls in units on floors 4-8. That\'s 48 units total. Can you provide pricing for the upgrade? We need this within 48 hours to submit to the owner. Current contract value is $89,000. Let me know if you need any additional details.',
      date: '2025-11-19T15:45:00',
      status: 'Processed',
      documentTypes: ['Quote'],
      connections: {
        contacts: ['David Chen'],
        companies: ['Bay Area Electric'],
        jobs: ['Oakland Multi-family']
      },
      suggestedTasks: []
    }
  ];

  const [emails, setEmails] = useState<Email[]>(initialEmails);

  const filteredEmails = selectedStatus === 'All'
    ? emails
    : emails.filter(email => email.status === selectedStatus);

  const getStatusColor = (status: string) => {
    return status === 'Processed'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700';
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'Quote':
        return 'bg-blue-100 text-blue-700';
      case 'Order':
        return 'bg-purple-100 text-purple-700';
      case 'Invoice':
        return 'bg-yellow-100 text-yellow-700';
      case 'Check':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleProcess = (emailId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId
        ? { ...email, status: 'Processed' as const }
        : email
    ));
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Email Ingestion</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Review and process incoming emails with automated entity detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Card View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('spreadsheet')}
                className={`p-2 rounded ${viewMode === 'spreadsheet' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Spreadsheet View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <SettingsButton />
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6 flex items-center gap-4 border-b border-[var(--border)] pb-2">
        <div className="flex gap-2">
          {['All', 'Needs Attention', 'Processed'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status as typeof selectedStatus)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedStatus === status
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {status}
              <span className="ml-2 text-xs opacity-75">
                ({status === 'All'
                  ? emails.length
                  : emails.filter(e => e.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
      <div className="space-y-4">
        {filteredEmails.map((email) => (
          <div
            key={email.id}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {/* Email Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {email.subject}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(email.status)}`}>
                    {email.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">From: </span>
                    <span className="text-[var(--foreground)] font-medium">{email.sender}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">To: </span>
                    <span className="text-[var(--foreground)] font-medium">{email.recipient}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Ingested: </span>
                    <span className="text-[var(--foreground)] font-medium">{formatDateLong(email.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Preview */}
            <div className="mb-4 p-4 bg-[var(--muted)]/30 rounded-lg">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {email.preview}
              </p>
            </div>

            {/* Document Types */}
            {email.documentTypes.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Detected Documents
                </h4>
                <div className="flex flex-wrap gap-2">
                  {email.documentTypes.map((type, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getDocumentTypeColor(type)}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Connections */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Related Entities
              </h4>
              <div className="space-y-2">
                {email.connections.contacts && email.connections.contacts.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Contacts:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {email.connections.contacts.map((contact, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                        >
                          {contact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {email.connections.companies && email.connections.companies.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Companies:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {email.connections.companies.map((company, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {email.connections.jobs && email.connections.jobs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Jobs:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {email.connections.jobs.map((job, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                        >
                          {job}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {email.connections.preOpportunities && email.connections.preOpportunities.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Pre-Opportunities:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {email.connections.preOpportunities.map((preOpp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                        >
                          {preOpp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Tasks */}
            {email.suggestedTasks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Suggested Tasks
                </h4>
                <ul className="space-y-1.5">
                  {email.suggestedTasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]">
                        <circle cx="10" cy="10" r="7"/>
                        <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            {email.status === 'Needs Attention' && (
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => handleProcess(email.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Process Email
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Spreadsheet View */}
      {viewMode === 'spreadsheet' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Documents
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Connections
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Tasks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredEmails.map((email) => (
                  <tr
                    key={email.id}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmailId(email.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(email.status)}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--foreground)]">
                      {formatDate(email.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      <div className="max-w-[150px] truncate">{email.sender}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      <div className="max-w-[150px] truncate">{email.recipient}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      <div className="max-w-[300px] font-medium">{email.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {email.documentTypes.length > 0 ? (
                          email.documentTypes.map((type, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getDocumentTypeColor(type)}`}
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {email.connections.contacts?.map((contact, idx) => (
                          <span
                            key={`contact-${idx}`}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                          >
                            {contact}
                          </span>
                        ))}
                        {email.connections.companies?.map((company, idx) => (
                          <span
                            key={`company-${idx}`}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                          >
                            {company}
                          </span>
                        ))}
                        {email.connections.jobs?.map((job, idx) => (
                          <span
                            key={`job-${idx}`}
                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
                          >
                            {job}
                          </span>
                        ))}
                        {email.connections.preOpportunities?.map((preOpp, idx) => (
                          <span
                            key={`preopp-${idx}`}
                            className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                          >
                            {preOpp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--foreground)]">
                        {email.suggestedTasks.length > 0 ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                            {email.suggestedTasks.length} task{email.suggestedTasks.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {email.status === 'Needs Attention' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcess(email.id);
                          }}
                          className="px-3 py-1.5 bg-[var(--primary)] text-white rounded text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Process
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredEmails.length === 0 && (
        <div className="text-center py-12">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-[var(--muted-foreground)]">
            <rect x="2" y="4" width="16" height="12" rx="2"/>
            <path d="M2 7l8 5 8-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[var(--muted-foreground)]">No emails found</p>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmailId && (() => {
        const email = emails.find(e => e.id === selectedEmailId);
        if (!email) return null;

        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEmailId(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">{email.subject}</h2>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(email.status)}`}>
                    {email.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEmailId(null)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-4"
                >
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-6 py-4">
                {/* Email Info */}
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-[var(--border)]">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                      From
                    </label>
                    <div className="text-sm text-[var(--foreground)]">{email.sender}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                      To
                    </label>
                    <div className="text-sm text-[var(--foreground)]">{email.recipient}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                      Ingested
                    </label>
                    <div className="text-sm text-[var(--foreground)]">{formatDateLong(email.date)}</div>
                  </div>
                </div>

                {/* Email Preview */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                    Message
                  </label>
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
                    {email.preview}
                  </div>
                </div>

                {/* Document Types */}
                {email.documentTypes.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                      Detected Documents
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {email.documentTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getDocumentTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connections */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                    Related Entities
                  </label>
                  <div className="space-y-2">
                    {email.connections.contacts && email.connections.contacts.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Contacts:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {email.connections.contacts.map((contact, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                            >
                              {contact}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {email.connections.companies && email.connections.companies.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Companies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {email.connections.companies.map((company, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {email.connections.jobs && email.connections.jobs.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Jobs:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {email.connections.jobs.map((job, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                            >
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {email.connections.preOpportunities && email.connections.preOpportunities.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Pre-Opportunities:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {email.connections.preOpportunities.map((preOpp, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                            >
                              {preOpp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Tasks */}
                {email.suggestedTasks.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                      Suggested Tasks
                    </label>
                    <ul className="space-y-2">
                      {email.suggestedTasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]">
                            <circle cx="10" cy="10" r="7"/>
                            <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              </div>

              {/* Action Buttons - Fixed */}
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 bg-white rounded-b-lg">
                <button
                  onClick={() => setSelectedEmailId(null)}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Close
                </button>
                {email.status === 'Needs Attention' && (
                  <button
                    onClick={() => {
                      handleProcess(email.id);
                      setSelectedEmailId(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Process Email
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
