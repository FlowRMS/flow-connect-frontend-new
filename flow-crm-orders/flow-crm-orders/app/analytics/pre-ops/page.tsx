'use client';

import AnalyticsDataTable from '@/components/analytics/AnalyticsDataTable';

// Sample pre-ops data
const preOpsData = [
  { id: 'PO-001', name: 'Downtown Plaza Lighting Package', job: 'Downtown Plaza Renovation', stage: 'Qualified', value: '$450,000', manufacturer: 'ERMCO', soldTo: 'Miller Electric', dateCreated: '2024-01-20', expirationDate: '2024-04-20', owner: 'Sarah Johnson' },
  { id: 'PO-002', name: 'TechCorp Transformer Order', job: 'TechCorp HQ Expansion', stage: 'Negotiation', value: '$1,200,000', manufacturer: 'Siemens', soldTo: 'Johnson Controls', dateCreated: '2024-02-05', expirationDate: '2024-05-05', owner: 'Mike Thompson' },
  { id: 'PO-003', name: 'Harbor View Distribution', job: 'Harbor View Apartments', stage: 'Follow-up', value: '$280,000', manufacturer: 'PRYSMIAN', soldTo: 'Smith & Associates', dateCreated: '2024-01-25', expirationDate: '2024-04-25', owner: 'Lisa Kim' },
  { id: 'PO-004', name: 'Solar Inverters Package', job: 'Green Energy Campus', stage: 'Converted', value: '$890,000', manufacturer: 'American Electric', soldTo: 'WESCO Distribution', dateCreated: '2024-03-01', expirationDate: '2024-06-01', owner: 'John Davis' },
  { id: 'PO-005', name: 'Hospital Emergency Power', job: 'City Hospital Upgrade', stage: 'Waiting on Factory', value: '$520,000', manufacturer: 'Power Partners', soldTo: 'Dominion Energy', dateCreated: '2024-02-20', expirationDate: '2024-05-20', owner: 'Emma Roberts' },
  { id: 'PO-006', name: 'Retail LED Fixtures', job: 'Retail Complex Phase 2', stage: 'Qualified', value: '$175,000', manufacturer: 'Holophane', soldTo: 'Miller Electric', dateCreated: '2024-04-05', expirationDate: '2024-07-05', owner: 'Sarah Johnson' },
  { id: 'PO-007', name: 'Solar Farm Cabling', job: 'Solar Farm Installation', stage: 'Negotiation', value: '$2,100,000', manufacturer: 'PRYSMIAN', soldTo: 'Johnson Controls', dateCreated: '2024-03-25', expirationDate: '2024-06-25', owner: 'Mike Thompson' },
  { id: 'PO-008', name: 'School Lighting Controls', job: 'School District Lighting', stage: 'Converted', value: '$125,000', manufacturer: 'Holophane', soldTo: 'Smith & Associates', dateCreated: '2024-01-15', expirationDate: '2024-04-15', owner: 'Lisa Kim' },
  { id: 'PO-009', name: 'Data Center UPS Systems', job: 'Data Center Build-Out', stage: 'Lost', value: '$3,500,000', manufacturer: 'Siemens', soldTo: 'Dominion Energy', dateCreated: '2024-05-10', expirationDate: '2024-08-10', owner: 'John Davis' },
  { id: 'PO-010', name: 'Stadium Floodlights', job: 'Stadium Renovation', stage: 'Follow-up', value: '$780,000', manufacturer: 'CMT', soldTo: 'WESCO Distribution', dateCreated: '2024-03-10', expirationDate: '2024-06-10', owner: 'Emma Roberts' },
  { id: 'PO-011', name: 'Office Tower Switchgear', job: 'Office Tower Remodel', stage: 'Qualified', value: '$420,000', manufacturer: 'ERMCO', soldTo: 'Miller Electric', dateCreated: '2024-04-20', expirationDate: '2024-07-20', owner: 'Sarah Johnson' },
  { id: 'PO-012', name: 'Manufacturing Motors', job: 'Manufacturing Plant', stage: 'Converted', value: '$650,000', manufacturer: 'American Electric', soldTo: 'Johnson Controls', dateCreated: '2024-03-15', expirationDate: '2024-06-15', owner: 'Mike Thompson' },
  { id: 'PO-013', name: 'Condo HVAC Controls', job: 'Luxury Condos Phase 1', stage: 'Negotiation', value: '$340,000', manufacturer: 'Hapco', soldTo: 'Smith & Associates', dateCreated: '2024-02-01', expirationDate: '2024-05-01', owner: 'Lisa Kim' },
  { id: 'PO-014', name: 'Warehouse Lighting', job: 'Warehouse Distribution', stage: 'Waiting on Factory', value: '$195,000', manufacturer: 'Holophane', soldTo: 'Dominion Energy', dateCreated: '2024-05-25', expirationDate: '2024-08-25', owner: 'John Davis' },
  { id: 'PO-015', name: 'Airport Power Systems', job: 'Airport Terminal Upgrade', stage: 'Qualified', value: '$4,200,000', manufacturer: 'Power Partners', soldTo: 'WESCO Distribution', dateCreated: '2024-02-15', expirationDate: '2024-05-15', owner: 'Emma Roberts' },
];

const columns = [
  { key: 'id', label: 'Pre-Op ID' },
  { key: 'name', label: 'Name' },
  { key: 'job', label: 'Job' },
  { key: 'stage', label: 'Stage', render: (value: unknown) => {
    const stage = value as string;
    const colors: Record<string, string> = {
      'Qualified': 'bg-blue-100 text-blue-700',
      'Negotiation': 'bg-yellow-100 text-yellow-700',
      'Follow-up': 'bg-purple-100 text-purple-700',
      'Waiting on Factory': 'bg-orange-100 text-orange-700',
      'Lost': 'bg-red-100 text-red-700',
      'Converted': 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stage] || ''}`}>
        {stage}
      </span>
    );
  }},
  { key: 'value', label: 'Value', align: 'right' as const },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'soldTo', label: 'Sold To' },
  { key: 'dateCreated', label: 'Created' },
  { key: 'expirationDate', label: 'Expires' },
  { key: 'owner', label: 'Owner' },
];

export default function PreOpsDataPage() {
  return (
    <AnalyticsDataTable
      title="Pre-Opportunities Data"
      description="Complete listing of all pre-opportunities with pipeline stage tracking"
      columns={columns}
      data={preOpsData}
      recordCount={15420}
      pageSize={15}
    />
  );
}
