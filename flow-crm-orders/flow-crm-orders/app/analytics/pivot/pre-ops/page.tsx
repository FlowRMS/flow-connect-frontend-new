'use client';

import PivotTable from '@/components/analytics/PivotTable';

const availableFields = [
  { key: 'value', label: 'Value', type: 'measure' as const },
  { key: 'count', label: 'Count', type: 'measure' as const },
  { key: 'name', label: 'Name', type: 'dimension' as const },
  { key: 'stage', label: 'Stage', type: 'dimension' as const },
  { key: 'manufacturer', label: 'Manufacturer', type: 'dimension' as const },
  { key: 'soldTo', label: 'Sold To', type: 'dimension' as const },
  { key: 'owner', label: 'Owner', type: 'dimension' as const },
  { key: 'job', label: 'Job', type: 'dimension' as const },
  { key: 'dateCreated', label: 'Date Created', type: 'dimension' as const },
  { key: 'expirationDate', label: 'Expiration Date', type: 'dimension' as const },
];

// Sample pivot data for pre-ops
const pivotData = [
  { stage: 'Qualified', manufacturer: 'ERMCO', owner: 'Sarah Johnson', value: 450000, count: 5 },
  { stage: 'Qualified', manufacturer: 'Siemens', owner: 'Sarah Johnson', value: 280000, count: 3 },
  { stage: 'Qualified', manufacturer: 'PRYSMIAN', owner: 'Mike Thompson', value: 520000, count: 4 },
  { stage: 'Negotiation', manufacturer: 'Siemens', owner: 'Mike Thompson', value: 1200000, count: 2 },
  { stage: 'Negotiation', manufacturer: 'American Electric', owner: 'Lisa Kim', value: 340000, count: 3 },
  { stage: 'Follow-up', manufacturer: 'PRYSMIAN', owner: 'Lisa Kim', value: 280000, count: 4 },
  { stage: 'Follow-up', manufacturer: 'Holophane', owner: 'John Davis', value: 175000, count: 5 },
  { stage: 'Waiting on Factory', manufacturer: 'Power Partners', owner: 'Emma Roberts', value: 520000, count: 2 },
  { stage: 'Waiting on Factory', manufacturer: 'Holophane', owner: 'John Davis', value: 195000, count: 3 },
  { stage: 'Converted', manufacturer: 'American Electric', owner: 'John Davis', value: 890000, count: 8 },
  { stage: 'Converted', manufacturer: 'Holophane', owner: 'Lisa Kim', value: 125000, count: 6 },
  { stage: 'Converted', manufacturer: 'ERMCO', owner: 'Sarah Johnson', value: 650000, count: 7 },
  { stage: 'Lost', manufacturer: 'Siemens', owner: 'John Davis', value: 3500000, count: 1 },
  { stage: 'Lost', manufacturer: 'CMT', owner: 'Emma Roberts', value: 780000, count: 2 },
  { stage: 'Qualified', manufacturer: 'Power Partners', owner: 'Emma Roberts', value: 4200000, count: 1 },
];

export default function PreOpsPivotPage() {
  return (
    <PivotTable
      title="Pre-Opportunities Pivoting"
      description="Detailed pre-opportunity data with pivot table capabilities"
      availableFields={availableFields}
      data={pivotData}
      defaultRows={['stage', 'manufacturer']}
      defaultColumns={['owner']}
      defaultValues={['value']}
    />
  );
}
