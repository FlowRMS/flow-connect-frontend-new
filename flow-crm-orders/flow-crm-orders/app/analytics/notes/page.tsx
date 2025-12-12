'use client';

import AnalyticsDataTable from '@/components/analytics/AnalyticsDataTable';

// Sample notes data
const notesData = [
  { id: 'N-001', title: 'Initial site assessment notes', content: 'Completed initial walkthrough of Downtown Plaza...', createdBy: 'Sarah Johnson', createdDate: '2024-11-20', entityType: 'Job', entityName: 'Downtown Plaza Renovation', attachments: 3, comments: 5 },
  { id: 'N-002', title: 'TechCorp meeting summary', content: 'Met with project manager to discuss timeline...', createdBy: 'Mike Thompson', createdDate: '2024-11-19', entityType: 'Company', entityName: 'TechCorp', attachments: 1, comments: 2 },
  { id: 'N-003', title: 'Pricing discussion with Miller', content: 'Negotiated 5% discount on bulk order...', createdBy: 'Lisa Kim', createdDate: '2024-11-18', entityType: 'Company', entityName: 'Miller Electric', attachments: 0, comments: 8 },
  { id: 'N-004', title: 'Green Energy site photos', content: 'Captured current installation progress photos...', createdBy: 'John Davis', createdDate: '2024-11-17', entityType: 'Job', entityName: 'Green Energy Campus', attachments: 12, comments: 3 },
  { id: 'N-005', title: 'ERMCO product specs review', content: 'Reviewed new transformer specifications...', createdBy: 'Emma Roberts', createdDate: '2024-11-16', entityType: 'Manufacturer', entityName: 'ERMCO', attachments: 2, comments: 1 },
  { id: 'N-006', title: 'Hospital safety requirements', content: 'Documented specific safety protocols needed...', createdBy: 'Sarah Johnson', createdDate: '2024-11-15', entityType: 'Job', entityName: 'City Hospital Upgrade', attachments: 4, comments: 6 },
  { id: 'N-007', title: 'Siemens lead time update', content: 'New lead times for switchgear increased to 16 weeks...', createdBy: 'Mike Thompson', createdDate: '2024-11-14', entityType: 'Manufacturer', entityName: 'Siemens', attachments: 0, comments: 4 },
  { id: 'N-008', title: 'Coastal Builders contact info', content: 'Updated primary contact information...', createdBy: 'Lisa Kim', createdDate: '2024-11-13', entityType: 'Company', entityName: 'Coastal Builders', attachments: 1, comments: 0 },
  { id: 'N-009', title: 'Solar installation best practices', content: 'Compiled learnings from recent solar projects...', createdBy: 'John Davis', createdDate: '2024-11-12', entityType: 'Pre-Opportunity', entityName: 'Solar Farm Installation', attachments: 5, comments: 7 },
  { id: 'N-010', title: 'Stadium lighting requirements', content: 'Specific lumen requirements for field lighting...', createdBy: 'Emma Roberts', createdDate: '2024-11-11', entityType: 'Job', entityName: 'Stadium Renovation', attachments: 2, comments: 3 },
  { id: 'N-011', title: 'PRYSMIAN cable specifications', content: 'New cable ratings and certifications...', createdBy: 'Sarah Johnson', createdDate: '2024-11-10', entityType: 'Manufacturer', entityName: 'PRYSMIAN', attachments: 3, comments: 2 },
  { id: 'N-012', title: 'Data center power calculations', content: 'Detailed power requirements per rack...', createdBy: 'Mike Thompson', createdDate: '2024-11-09', entityType: 'Job', entityName: 'Data Center Build-Out', attachments: 8, comments: 5 },
  { id: 'N-013', title: 'Johnson Controls warranty info', content: 'Extended warranty terms for HVAC controls...', createdBy: 'Lisa Kim', createdDate: '2024-11-08', entityType: 'Company', entityName: 'Johnson Controls', attachments: 1, comments: 1 },
  { id: 'N-014', title: 'Airport security clearance', content: 'Security protocols for terminal work...', createdBy: 'John Davis', createdDate: '2024-11-07', entityType: 'Job', entityName: 'Airport Terminal Upgrade', attachments: 0, comments: 4 },
  { id: 'N-015', title: 'Holophane fixture options', content: 'Comparing different fixture models for retail...', createdBy: 'Emma Roberts', createdDate: '2024-11-06', entityType: 'Manufacturer', entityName: 'Holophane', attachments: 6, comments: 2 },
];

const columns = [
  { key: 'id', label: 'Note ID' },
  { key: 'title', label: 'Title' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdDate', label: 'Date' },
  { key: 'entityType', label: 'Entity Type', render: (value: unknown) => {
    const type = value as string;
    const colors: Record<string, string> = {
      'Job': 'bg-blue-100 text-blue-700',
      'Company': 'bg-purple-100 text-purple-700',
      'Manufacturer': 'bg-green-100 text-green-700',
      'Pre-Opportunity': 'bg-orange-100 text-orange-700',
      'Contact': 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || ''}`}>
        {type}
      </span>
    );
  }},
  { key: 'entityName', label: 'Entity' },
  { key: 'attachments', label: 'Attachments', align: 'center' as const, render: (value: unknown) => {
    const count = value as number;
    return count > 0 ? (
      <span className="flex items-center justify-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
        </svg>
        {count}
      </span>
    ) : (
      <span className="text-[var(--muted-foreground)]">-</span>
    );
  }},
  { key: 'comments', label: 'Comments', align: 'center' as const, render: (value: unknown) => {
    const count = value as number;
    return count > 0 ? (
      <span className="flex items-center justify-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {count}
      </span>
    ) : (
      <span className="text-[var(--muted-foreground)]">-</span>
    );
  }},
];

export default function NotesDataPage() {
  return (
    <AnalyticsDataTable
      title="Notes Data"
      description="Complete listing of all notes across jobs, companies, manufacturers, and contacts"
      columns={columns}
      data={notesData}
      recordCount={8234}
      pageSize={15}
    />
  );
}
