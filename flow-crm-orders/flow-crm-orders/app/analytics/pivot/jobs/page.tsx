'use client';

import PivotTable from '@/components/analytics/PivotTable';

const availableFields = [
  { key: 'sales', label: 'Sales', type: 'measure' as const },
  { key: 'commissions', label: 'Commissions', type: 'measure' as const },
  { key: 'customer', label: 'Customer', type: 'dimension' as const },
  { key: 'parentCustomer', label: 'Parent Customer', type: 'dimension' as const },
  { key: 'outsideRep', label: 'Outside Rep', type: 'dimension' as const },
  { key: 'factory', label: 'Factory', type: 'dimension' as const },
  { key: 'category', label: 'Category', type: 'dimension' as const },
  { key: 'status', label: 'Status', type: 'dimension' as const },
  { key: 'orderDate', label: 'Order Date', type: 'dimension' as const },
  { key: 'dueDate', label: 'Due Date', type: 'dimension' as const },
  { key: 'daysUntilDue', label: 'Days Until Due', type: 'measure' as const },
  { key: 'entryDate', label: 'Entry Date', type: 'dimension' as const },
  { key: 'itemNumber', label: 'Item Number', type: 'dimension' as const },
  { key: 'factoryPartNumber', label: 'Factory Part Number', type: 'dimension' as const },
  { key: 'customerPartNumber', label: 'Customer Part Number', type: 'dimension' as const },
  { key: 'orderNumber', label: 'Order Number', type: 'dimension' as const },
  { key: 'jobName', label: 'Job Name', type: 'dimension' as const },
];

// Sample pivot data
const pivotData = [
  { customer: 'A', factory: 'ERMCO', outsideRep: 'House Account', sales: 7128, commissions: 285 },
  { customer: 'A', factory: 'Alamo', outsideRep: 'House Account', sales: 122, commissions: 5 },
  { customer: 'A', factory: 'Alamo', outsideRep: 'Daniel Dye', sales: 125, commissions: 5 },
  { customer: 'A', factory: 'Alamo', outsideRep: 'Richard Utley', sales: 112, commissions: 4 },
  { customer: 'A&N EC', factory: 'Siemens', outsideRep: 'Richard Utley', sales: 2188.66, commissions: 87.55 },
  { customer: 'A&N EC', factory: 'Electromark', outsideRep: 'House Account', sales: 456, commissions: 18.24 },
  { customer: 'A&N EC', factory: 'UTILCO', outsideRep: 'House Account', sales: 789, commissions: 31.56 },
  { customer: 'A&N EC', factory: 'ERMCO', outsideRep: 'Richard Utley', sales: 10, commissions: 0.4 },
  { customer: 'ACKER EC', factory: 'ERMCO', outsideRep: 'House Account', sales: 3456, commissions: 138.24 },
  { customer: 'ACT POWER SERVICE', factory: 'Electromark', outsideRep: 'House Account', sales: 567, commissions: 22.68 },
  { customer: 'AEP-ROANOKE RDC', factory: 'STRONGWELL', outsideRep: 'Daniel Dye', sales: 8901, commissions: 356.04 },
  { customer: 'AEP-ROANOKE RDC', factory: 'Atlas Lighting', outsideRep: 'Daniel Dye', sales: 2345, commissions: 93.8 },
  { customer: 'AES Ohio', factory: 'Cleaveland', outsideRep: 'House Account', sales: 6789, commissions: 271.56 },
  { customer: 'AIKEN EC', factory: 'ERMCO', outsideRep: 'House Account', sales: 1234, commissions: 49.36 },
  { customer: 'AIKEN EC', factory: 'Ritz Instrumen...', outsideRep: 'Daniel Dye', sales: 5678, commissions: 227.12 },
  { customer: 'AIR HYDRO POWER INC', factory: 'Raco', outsideRep: 'House Account', sales: 901, commissions: 36.04 },
  { customer: 'ALBERTVILLE MUNICIP...', factory: 'Siemens', outsideRep: 'Richard Utley', sales: 2345, commissions: 93.8 },
  { customer: 'ALL PHASE ELEC/CED (...', factory: 'Southern Stat...', outsideRep: 'House Account', sales: 6789, commissions: 271.56 },
  { customer: 'ALL PHASE ELEC/CED ...', factory: 'Southern Stat...', outsideRep: 'Daniel Dye', sales: 1234, commissions: 49.36 },
];

export default function JobsPivotPage() {
  return (
    <PivotTable
      title="Jobs Pivoting"
      description="Detailed job data with pivot table capabilities"
      availableFields={availableFields}
      data={pivotData}
      defaultRows={['customer', 'factory']}
      defaultColumns={['outsideRep']}
      defaultValues={['sales']}
    />
  );
}
