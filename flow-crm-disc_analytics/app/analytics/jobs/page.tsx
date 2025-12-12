'use client';

import AnalyticsDataTable from '@/components/analytics/AnalyticsDataTable';

// Sample jobs data
const jobsData = [
  { id: 'J-001', name: 'Downtown Plaza Renovation', status: 'Active', type: 'Commercial', value: '$2,300,000', startDate: '2024-01-15', gc: 'Turner Construction', ec: 'Miller Electric', owner: 'Sarah Johnson' },
  { id: 'J-002', name: 'TechCorp HQ Expansion', status: 'Bidding', type: 'Commercial', value: '$4,500,000', startDate: '2024-02-01', gc: 'Coastal Builders', ec: 'Johnson Controls', owner: 'Mike Thompson' },
  { id: 'J-003', name: 'Harbor View Apartments', status: 'Active', type: 'Residential', value: '$1,800,000', startDate: '2024-01-20', gc: 'Urban Development', ec: 'Smith & Associates', owner: 'Lisa Kim' },
  { id: 'J-004', name: 'Green Energy Campus', status: 'Won', type: 'Industrial', value: '$6,200,000', startDate: '2024-03-10', gc: 'Green Energy', ec: 'WESCO Distribution', owner: 'John Davis' },
  { id: 'J-005', name: 'City Hospital Upgrade', status: 'Active', type: 'Healthcare', value: '$3,100,000', startDate: '2024-02-15', gc: 'Turner Construction', ec: 'Dominion Energy', owner: 'Emma Roberts' },
  { id: 'J-006', name: 'Retail Complex Phase 2', status: 'Backlog', type: 'Commercial', value: '$2,800,000', startDate: '2024-04-01', gc: 'TechCorp', ec: 'Miller Electric', owner: 'Sarah Johnson' },
  { id: 'J-007', name: 'Solar Farm Installation', status: 'Bidding', type: 'Industrial', value: '$8,500,000', startDate: '2024-03-20', gc: 'Green Energy', ec: 'Johnson Controls', owner: 'Mike Thompson' },
  { id: 'J-008', name: 'School District Lighting', status: 'Active', type: 'Education', value: '$950,000', startDate: '2024-01-10', gc: 'Coastal Builders', ec: 'Smith & Associates', owner: 'Lisa Kim' },
  { id: 'J-009', name: 'Data Center Build-Out', status: 'On Hold', type: 'Technology', value: '$12,000,000', startDate: '2024-05-01', gc: 'TechCorp', ec: 'Dominion Energy', owner: 'John Davis' },
  { id: 'J-010', name: 'Stadium Renovation', status: 'Active', type: 'Sports', value: '$15,500,000', startDate: '2024-02-28', gc: 'Urban Development', ec: 'WESCO Distribution', owner: 'Emma Roberts' },
  { id: 'J-011', name: 'Office Tower Remodel', status: 'Bidding', type: 'Commercial', value: '$3,400,000', startDate: '2024-04-15', gc: 'Turner Construction', ec: 'Miller Electric', owner: 'Sarah Johnson' },
  { id: 'J-012', name: 'Manufacturing Plant', status: 'Won', type: 'Industrial', value: '$7,800,000', startDate: '2024-03-05', gc: 'Coastal Builders', ec: 'Johnson Controls', owner: 'Mike Thompson' },
  { id: 'J-013', name: 'Luxury Condos Phase 1', status: 'Active', type: 'Residential', value: '$4,200,000', startDate: '2024-01-25', gc: 'Urban Development', ec: 'Smith & Associates', owner: 'Lisa Kim' },
  { id: 'J-014', name: 'Warehouse Distribution', status: 'Backlog', type: 'Industrial', value: '$2,100,000', startDate: '2024-05-20', gc: 'Green Energy', ec: 'Dominion Energy', owner: 'John Davis' },
  { id: 'J-015', name: 'Airport Terminal Upgrade', status: 'Active', type: 'Transportation', value: '$18,000,000', startDate: '2024-02-10', gc: 'TechCorp', ec: 'WESCO Distribution', owner: 'Emma Roberts' },
];

const columns = [
  { key: 'id', label: 'Job ID' },
  { key: 'name', label: 'Job Name' },
  { key: 'status', label: 'Status', render: (value: unknown) => {
    const status = value as string;
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-700',
      'Bidding': 'bg-blue-100 text-blue-700',
      'Won': 'bg-purple-100 text-purple-700',
      'On Hold': 'bg-orange-100 text-orange-700',
      'Backlog': 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  }},
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value', align: 'right' as const },
  { key: 'startDate', label: 'Start Date' },
  { key: 'gc', label: 'General Contractor' },
  { key: 'ec', label: 'Electrical Contractor' },
  { key: 'owner', label: 'Owner' },
];

export default function JobsDataPage() {
  return (
    <AnalyticsDataTable
      title="Jobs Data"
      description="Complete listing of all jobs with filtering and sorting capabilities"
      columns={columns}
      data={jobsData}
      recordCount={39001}
      pageSize={15}
    />
  );
}
