export interface DistributorStats {
  totalSends: number;
  totalManufacturers: number;
}

export function getDistributorStats(): DistributorStats {
  return {
    totalSends: 6,
    totalManufacturers: 12,
  };
}

export type Send = {
  id: string;
  date: string;
  period: string;
  recordCount: number;
  manufacturers: string[];
  status: 'sent' | 'partial' | 'failed';
};

export const mockDataSends: Send[] = [
  {
    id: 'send-1',
    date: '2024-12-28T09:00:00Z',
    period: 'December 2024',
    recordCount: 1234,
    manufacturers: ['FlowTech Industries', 'Precision Valve Corp'],
    status: 'sent',
  },
  {
    id: 'send-2',
    date: '2024-11-30T09:00:00Z',
    period: 'November 2024',
    recordCount: 987,
    manufacturers: ['Acme Valves Inc'],
    status: 'partial',
  },
  {
    id: 'send-3',
    date: '2024-10-31T09:00:00Z',
    period: 'October 2024',
    recordCount: 300,
    manufacturers: ['Industrial Flow Systems'],
    status: 'failed',
  },
];

export type RepManufacturerContact = {
  id: string;
  name: string;
  domain: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  status: 'active' | 'pending' | 'expired' | 'not_on_platform';
  lastReportedDate?: string;
  configuredAt?: string;
  dataVisibility?: 'full' | 'limited' | 'none';
  territories?: string[];
  hasDataAgreement?: boolean;
};

export type PendingManufacturer = { id: string; name: string; invitedAt?: string; status: 'pending' | 'expired' | 'active' };

export type ActionIssue = {
  id: string;
  severity: 'blocking' | 'warning';
  title: string;
  description: string;
  context: {
    fileName?: string;
    period?: string;
    manufacturer?: string;
    affectedRows: number;
  };
  linkTo: string;
};

export type Message = {
  id: string;
  from: string;
  fromType: 'manufacturer' | 'rep';
  companyName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  read: boolean;
  fileRef?: string;
};

export const mockRepManufacturerContacts: RepManufacturerContact[] = [
  {
    id: 'mfr-1',
    name: 'FlowTech Industries',
    domain: 'flowtech.com',
    status: 'active',
    contactEmail: 'support@flowtech.com',
    lastReportedDate: '2024-12-28T09:00:00Z',
    configuredAt: '2024-06-15T00:00:00Z',
    dataVisibility: 'full',
    territories: ['North East', 'Midwest'],
    hasDataAgreement: true
  },
  {
    id: 'mfr-2',
    name: 'Precision Valve Corp',
    domain: 'precisionvalve.com',
    status: 'active',
    contactEmail: 'sales@precisionvalve.com',
    lastReportedDate: '2024-12-27T14:00:00Z',
    configuredAt: '2024-07-01T00:00:00Z',
    dataVisibility: 'limited',
    territories: ['South'],
    hasDataAgreement: true
  },
  {
    id: 'mfr-3',
    name: 'Acme Valves Inc',
    domain: 'acmevalves.com',
    status: 'pending',
    contactEmail: 'contact@acmevalves.com',
    territories: ['West Coast']
  },
  {
    id: 'mfr-4',
    name: 'Industrial Flow Systems',
    domain: 'industrialflow.com',
    status: 'not_on_platform',
    contactEmail: 'info@industrialflow.com'
  },
];

export const mockPendingManufacturers: PendingManufacturer[] = [
  { id: 'pm-1', name: 'Acme Valves Inc', invitedAt: '2024-12-20T10:00:00Z', status: 'pending' },
  { id: 'pm-2', name: 'Industrial Flow Systems', invitedAt: '2024-12-15T14:30:00Z', status: 'pending' },
];

export const mockActionIssues: ActionIssue[] = [
  {
    id: 'ai-1',
    severity: 'blocking',
    title: 'Selling branch zip code missing',
    description: 'Branch zip is needed to determine territory credit.',
    context: { fileName: 'pos_export_dec2024.csv', period: 'December 2024', manufacturer: 'FlowTech Industries', affectedRows: 12 },
    linkTo: '/nemra-pos/distributor/issues?issue=ai-1',
  },
  {
    id: 'ai-2',
    severity: 'blocking',
    title: 'No product identifier found',
    description: 'Need Catalog # OR UPC OR SKU to identify products.',
    context: { fileName: 'pos_export_dec2024.csv', period: 'December 2024', manufacturer: 'Precision Valve Corp', affectedRows: 5 },
    linkTo: '/nemra-pos/distributor/issues?issue=ai-2',
  },
  {
    id: 'ai-3',
    severity: 'warning',
    title: 'Customer zip code missing',
    description: 'Customer location helps with territory assignment.',
    context: { fileName: 'pos_export_dec2024.csv', period: 'December 2024', affectedRows: 120 },
    linkTo: '/nemra-pos/distributor/issues?issue=ai-3',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    from: 'Sarah Chen',
    fromType: 'manufacturer',
    companyName: 'FlowTech Industries',
    subject: 'Question about November data',
    preview: 'Hi, I noticed some discrepancies in the customer names for a few records...',
    receivedAt: '2024-12-28T09:15:00Z',
    read: false,
    fileRef: 'November 2024 POS',
  },
  {
    id: 'msg-2',
    from: 'Mike Johnson',
    fromType: 'rep',
    companyName: 'Northeast Rep Group',
    subject: 'Connection request',
    preview: 'We represent FlowTech Industries in the Northeast region and would like to...',
    receivedAt: '2024-12-27T16:45:00Z',
    read: false,
  },
  {
    id: 'msg-3',
    from: 'James Wilson',
    fromType: 'manufacturer',
    companyName: 'Precision Valve Corp',
    subject: 'Re: October data issues resolved',
    preview: 'Thanks for the quick fix on the product codes. Everything looks good now.',
    receivedAt: '2024-12-26T11:30:00Z',
    read: true,
  },
];

// Distributor and rep fixtures used by the manufacturers dashboard
export type DistributorSource = {
  id: string;
  name: string;
  status: 'active' | 'forwarding' | 'inactive' | 'pending';
  recordCount?: number;
  lastReceived?: string;
};

export const mockDistributorSources: DistributorSource[] = [
  { id: 'dist-1', name: 'Acme Distribution', status: 'active', recordCount: 12345, lastReceived: '2024-12-28T09:00:00Z' },
  { id: 'dist-2', name: 'Metro Supply Co', status: 'forwarding', recordCount: 8560, lastReceived: '2024-12-27T14:00:00Z' },
  { id: 'dist-3', name: 'Pacific Supply Company', status: 'inactive', recordCount: 0 },
];

// Manufacturer/Manufacturer-facing fixtures
export type LotOrder = {
  id: string;
  distributor: string;
  orderNumber: string;
  orderType: 'direct_ship' | 'project';
  productInfo: string;
  value: number;
  submittedAt: string;
};

export const mockLotOrders: LotOrder[] = [
  {
    id: 'lo-1',
    distributor: 'Pacific Supply Company',
    orderNumber: 'INV-2024-4521',
    orderType: 'direct_ship',
    productInfo: 'FT-PMP-2075 × 24 units',
    value: 28800,
    submittedAt: '2024-12-28T09:00:00Z',
  },
  {
    id: 'lo-2',
    distributor: 'Midwest Industrial Supply',
    orderNumber: 'INV-2024-4498',
    orderType: 'project',
    productInfo: 'Multiple SKUs (12 lines)',
    value: 45230,
    submittedAt: '2024-12-27T14:00:00Z',
  },
];

export type PendingDistributor = {
  id: string;
  name: string;
  requestedAt: string;
  status: 'pending' | 'expired';
};

export const mockPendingDistributors: PendingDistributor[] = [
  {
    id: 'pd-1',
    name: 'West Coast Distribution',
    requestedAt: '2024-12-20T10:00:00Z',
    status: 'pending',
  },
];

export type PendingRepFirm = {
  id: string;
  name: string;
  territories: string[];
  requestedAt: string;
  status: 'pending' | 'awaiting_data';
};

export const mockPendingRepFirms: PendingRepFirm[] = [
  {
    id: 'pr-1',
    name: 'Southwest Rep Associates',
    territories: ['AZ', 'NM', 'NV'],
    requestedAt: '2024-12-22T14:30:00Z',
    status: 'pending',
  },
];

// Rep fixtures and utilities
export type MonthReport = { month: string; receivedAt: string; recordCount: number };

export type ManufacturerReporting = {
  id: string;
  name: string;
  status: 'reporting' | 'not_reporting';
  monthsReported: MonthReport[];
};

export const mockManufacturerReporting: ManufacturerReporting[] = [
  {
    id: 'mfr-1',
    name: 'FlowTech Industries',
    status: 'reporting',
    monthsReported: [
      { month: 'December 2024', receivedAt: '2024-12-28T09:00:00Z', recordCount: 1234 },
      { month: 'November 2024', receivedAt: '2024-11-30T09:00:00Z', recordCount: 987 },
    ],
  },
  {
    id: 'mfr-2',
    name: 'Precision Valve Corp',
    status: 'reporting',
    monthsReported: [
      { month: 'December 2024', receivedAt: '2024-12-27T14:00:00Z', recordCount: 560 },
    ],
  },
  {
    id: 'mfr-3',
    name: 'Industrial Flow Systems',
    status: 'not_reporting',
    monthsReported: [],
  },
];

export type RepActionItem = {
  id: string;
  severity: 'blocking' | 'warning' | 'info';
  title: string;
  description: string;
  context: {
    manufacturer?: string;
    distributor?: string;
    month?: string;
    daysOverdue?: number;
  };
  actionLabel: string;
  linkTo: string;
};

export const mockRepActionItems: RepActionItem[] = [
  {
    id: 'rai-1',
    severity: 'blocking',
    title: 'Missing November data from FlowTech Industries',
    description: "You haven't received November POS data yet. It's now 15 days overdue.",
    context: { manufacturer: 'FlowTech Industries', month: 'November 2024', daysOverdue: 15 },
    actionLabel: 'Request Data',
    linkTo: '/nemra-pos/rep/nudge',
  },
];

export type PendingConnection = {
  id: string;
  name: string;
  type: 'manufacturer' | 'distributor';
  requestedAt: string;
  status: 'pending' | 'expired';
};

export const mockPendingConnections: PendingConnection[] = [
  { id: 'pc-1', name: 'Industrial Flow Systems', type: 'manufacturer', requestedAt: '2024-12-20T10:00:00Z', status: 'pending' },
  { id: 'pc-2', name: 'National Electric Supply', type: 'distributor', requestedAt: '2024-12-22T14:30:00Z', status: 'pending' },
];

export function getRepStats() {
  const totalRecords = mockManufacturerReporting.reduce((sum, m) => sum + m.monthsReported.reduce((s, mo) => s + mo.recordCount, 0), 0);
  const totalAmount = Math.round(totalRecords * 12.5); // arbitrary conversion for mock
  return { totalRecords, totalAmount };
}

// Role and company fixtures used by the POS layout/navigation
export type RoleType = 'distributor' | 'manufacturer' | 'rep';

export type Company = {
  id: string;
  name: string;
  primaryContact: {
    name: string;
    email?: string;
  };
};

export const mockCompanies: Record<RoleType, Company> = {
  distributor: {
    id: 'co-dist',
    name: 'Example Distributor Co',
    primaryContact: { name: 'Alice Roberts', email: 'alice@example.com' },
  },
  manufacturer: {
    id: 'co-man',
    name: 'Example Manufacturer LLC',
    primaryContact: { name: 'Carlos Mendez', email: 'carlos@example.com' },
  },
  rep: {
    id: 'co-rep',
    name: 'Representative Group',
    primaryContact: { name: 'Janet Lee', email: 'janet@example.com' },
  },
};


// Extended mock data types and fixtures for NEMRA POS v2

export type ManufacturerContact = {
  id: string;
  name: string;
  domain?: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  inviteStatus: 'active' | 'pending' | 'expired' | 'no_invite' | 'not_on_platform';
  configuredAt?: string;
  lastSendDate?: string;
  invitedAt?: string;
  hasCustomMappings?: boolean;
  dataVisibility?: 'full' | 'limited' | 'none';
  hasDataAgreement?: boolean;
  lastReportedDate?: string;
  territories?: string[];
  agreementFileName?: string;
};

export const mockManufacturerContacts: ManufacturerContact[] = [
  { id: 'mc-001', name: 'FlowTech Industries', domain: 'flowtechind.com', contactEmail: 'pos@flowtechind.com', contactFirstName: 'Michael', contactLastName: 'Chen', inviteStatus: 'active', configuredAt: '2024-06-16T14:30:00Z', lastSendDate: '2024-12-05T14:35:00Z', hasCustomMappings: true },
  { id: 'mc-002', name: 'Precision Valve Corp', domain: 'precisionvalve.com', contactEmail: 'data@precisionvalve.com', contactFirstName: 'Amy', contactLastName: 'Johnson', inviteStatus: 'active', configuredAt: '2024-07-02T11:15:00Z', lastSendDate: '2024-12-05T14:35:00Z', hasCustomMappings: false },
  { id: 'mc-003', name: 'Industrial Pump Co', domain: 'industrialpump.com', contactEmail: 'info@industrialpump.com', contactFirstName: 'James', inviteStatus: 'pending', invitedAt: '2024-12-01T08:00:00Z' },
  { id: 'mc-004', name: 'Valley Controls', domain: 'valleycontrols.com', inviteStatus: 'no_invite' },
  { id: 'mc-005', name: 'Mountain Hydraulics', domain: 'mountainhydraulics.com', inviteStatus: 'no_invite' },
];

export type DistributorContact = {
  id: string;
  name: string;
  domain?: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  inviteStatus: 'active' | 'pending' | 'expired' | 'no_invite';
  configuredAt?: string;
  lastSendDate?: string;
  invitedAt?: string;
};

export const mockDistributorContacts: DistributorContact[] = [
  { id: 'dc-001', name: 'Acme Distribution', domain: 'acmedist.com', contactEmail: 'pos@acmedist.com', contactFirstName: 'John', contactLastName: 'Smith', inviteStatus: 'active', configuredAt: '2024-05-10T09:00:00Z', lastSendDate: '2024-12-04T10:00:00Z' },
  { id: 'dc-002', name: 'Metro Supply Co', domain: 'metrosupply.com', contactEmail: 'data@metrosupply.com', contactFirstName: 'Lisa', contactLastName: 'Wong', inviteStatus: 'active', configuredAt: '2024-06-20T11:00:00Z', lastSendDate: '2024-12-03T14:00:00Z' },
  { id: 'dc-003', name: 'Pacific Supply Company', domain: 'pacificsupply.com', contactEmail: 'info@pacificsupply.com', contactFirstName: 'Robert', inviteStatus: 'pending', invitedAt: '2024-12-05T08:00:00Z' },
];

export type RepFirmContact = {
  id: string;
  name: string;
  territory?: string;
  domain?: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  inviteStatus: 'active' | 'pending' | 'expired' | 'no_invite';
  configuredAt?: string;
  lastSendDate?: string;
  invitedAt?: string;
};

export const mockRepFirmContacts: RepFirmContact[] = [
  { id: 'rep-001', name: 'Western Region Reps', territory: 'West', domain: 'westernreps.com', contactEmail: 'contact@westernreps.com', contactFirstName: 'Sarah', contactLastName: 'Johnson', inviteStatus: 'active', configuredAt: '2024-04-15T10:00:00Z' },
  { id: 'rep-002', name: 'Mountain States Agency', territory: 'Mountain', domain: 'mountainstates.com', contactEmail: 'info@mountainstates.com', contactFirstName: 'Tom', contactLastName: 'Baker', inviteStatus: 'active', configuredAt: '2024-05-20T14:00:00Z' },
  { id: 'rep-003', name: 'Pacific Northwest Sales', territory: 'Pacific NW', domain: 'pnwsales.com', contactEmail: 'sales@pnwsales.com', contactFirstName: 'Emily', inviteStatus: 'active', configuredAt: '2024-06-01T09:00:00Z' },
  { id: 'rep-004', name: 'Southwest Electrical Reps', territory: 'Southwest', domain: 'swereps.com', contactEmail: 'contact@swereps.com', contactFirstName: 'David', contactLastName: 'Garcia', inviteStatus: 'active', configuredAt: '2024-07-10T11:00:00Z' },
  { id: 'rep-005', name: 'Midwest Industrial Sales', territory: 'Midwest', domain: 'midwestindustrial.com', contactEmail: 'info@midwestindustrial.com', inviteStatus: 'pending', invitedAt: '2024-12-01T08:00:00Z' },
];

// Simple rep firm type for issues filters
export type IssueRepFirm = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  territory?: string;
};

export const mockIssueRepFirms: IssueRepFirm[] = [
  { id: 'rep-001', name: 'Northwest Sales Associates', status: 'active', territory: 'WA, OR, ID' },
  { id: 'rep-002', name: 'Mountain States Rep Group', status: 'active', territory: 'CO, UT, WY' },
  { id: 'rep-003', name: 'Pacific Coast Representatives', status: 'active', territory: 'CA, NV, AZ' },
  { id: 'rep-004', name: 'Southwest Electrical Reps', status: 'pending', territory: 'TX, NM' },
  { id: 'rep-005', name: 'Midwest Industrial Sales', status: 'inactive', territory: 'IL, WI, MN' },
];

// ============================================
// ISSUE TYPES AND MOCK DATA (Distributor & Manufacturer)
// ============================================

export type IssueSeverity = 'blocking' | 'warning' | 'fyi';

export interface IssueRow {
  rowNumber: number;
  originalValue: string;
  fixedValue?: string;
  customerName?: string;
  catalogNumber?: string;
}

export interface DistributorIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  whyMatters: string;
  affectedRows: number;
  manufacturers: string[];
  field?: string;
  fileName: string;
  period: string;
  sendMethod: 'file' | 'api' | 'sftp' | 'email';
  uploadedAt: string;
  exampleRows: IssueRow[];
}

export interface ManufacturerSendIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  whyMatters: string;
  affectedRows: number;
  repFirms: string[];
  field?: string;
  fileName: string;
  period: string;
  sendMethod: 'file' | 'api' | 'sftp' | 'email';
  uploadedAt: string;
  exampleRows: IssueRow[];
}

export const mockDistributorIssues: DistributorIssue[] = [
  {
    id: 'issue-1',
    severity: 'blocking',
    title: 'Selling branch zip code missing',
    whyMatters: 'Branch zip is needed to determine territory credit.',
    affectedRows: 12,
    manufacturers: ['FlowTech Industries', 'Precision Valve Corp'],
    field: 'sellingBranchZip',
    fileName: 'pos_export_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 45, originalValue: '', customerName: 'Cascade Water Systems', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 89, originalValue: '', customerName: 'Portland Plumbing Supply', catalogNumber: 'FT-PMP-1050' },
      { rowNumber: 156, originalValue: '', customerName: 'Boise Industrial', catalogNumber: 'FT-VAL-3036' },
      { rowNumber: 201, originalValue: '', customerName: 'Seattle Mechanical', catalogNumber: 'PV-CTL-500' },
      { rowNumber: 234, originalValue: '', customerName: 'Tacoma Supply Co', catalogNumber: 'FT-VAL-2024' },
    ],
  },
  {
    id: 'issue-2',
    severity: 'blocking',
    title: 'No product identifier found',
    whyMatters: 'Need Catalog # OR UPC OR SKU to identify products.',
    affectedRows: 5,
    manufacturers: ['FlowTech Industries'],
    field: 'catalogNumber',
    fileName: 'pos_export_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 23, originalValue: '', customerName: 'Cascade Water Systems' },
      { rowNumber: 67, originalValue: '', customerName: 'Portland Plumbing Supply' },
      { rowNumber: 98, originalValue: '', customerName: 'Boise Industrial' },
    ],
  },
  {
    id: 'issue-3',
    severity: 'blocking',
    title: 'Invalid ZIP code format',
    whyMatters: 'ZIP must be 5 or 9 digits for territory assignment.',
    affectedRows: 3,
    manufacturers: ['Precision Valve Corp'],
    field: 'customerZip',
    fileName: 'precision_valve_dec.xlsx',
    period: 'December 2024',
    sendMethod: 'sftp',
    uploadedAt: '2024-12-27T10:15:00Z',
    exampleRows: [
      { rowNumber: 102, originalValue: '9810', customerName: 'Metro Systems', catalogNumber: 'PV-CTL-500' },
      { rowNumber: 234, originalValue: '1234', customerName: 'Valley Equipment', catalogNumber: 'PV-SEN-200' },
      { rowNumber: 456, originalValue: 'N/A', customerName: 'Mountain Supply', catalogNumber: 'PV-CTL-750' },
    ],
  },
  {
    id: 'issue-4',
    severity: 'blocking',
    title: 'Future date not allowed',
    whyMatters: 'Transaction dates must be in the past.',
    affectedRows: 1,
    manufacturers: ['FlowTech Industries'],
    field: 'transactionDate',
    fileName: 'flowtech_nov_data.csv',
    period: 'November 2024',
    sendMethod: 'api',
    uploadedAt: '2024-12-01T09:00:00Z',
    exampleRows: [
      { rowNumber: 501, originalValue: '2025-01-15', customerName: 'Pacific Industrial', catalogNumber: 'FT-PMP-2000' },
    ],
  },
  {
    id: 'issue-5',
    severity: 'warning',
    title: 'Customer zip code missing',
    whyMatters: 'Customer location helps with territory assignment.',
    affectedRows: 120,
    manufacturers: ['FlowTech Industries', 'Precision Valve Corp'],
    field: 'customerZip',
    fileName: 'pos_export_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 12, originalValue: '', customerName: 'ABC Supply', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 34, originalValue: '', customerName: 'XYZ Industrial', catalogNumber: 'FT-PMP-1050' },
      { rowNumber: 78, originalValue: '', customerName: 'Metro Equipment', catalogNumber: 'PV-CTL-500' },
    ],
  },
  {
    id: 'issue-6',
    severity: 'warning',
    title: 'Unit of measure missing',
    whyMatters: 'UOM helps manufacturers normalize data.',
    affectedRows: 8,
    manufacturers: ['Precision Valve Corp'],
    field: 'unitOfMeasure',
    fileName: 'precision_valve_dec.xlsx',
    period: 'December 2024',
    sendMethod: 'sftp',
    uploadedAt: '2024-12-27T10:15:00Z',
    exampleRows: [
      { rowNumber: 15, originalValue: '', customerName: 'Valley Systems', catalogNumber: 'PV-SEN-200' },
      { rowNumber: 89, originalValue: '', customerName: 'Mountain Industrial', catalogNumber: 'PV-CTL-750' },
    ],
  },
  {
    id: 'issue-7',
    severity: 'warning',
    title: 'Price variance detected',
    whyMatters: 'Extended price differs >5% from quantity times unit cost.',
    affectedRows: 15,
    manufacturers: ['FlowTech Industries'],
    field: 'extendedPrice',
    fileName: 'flowtech_nov_data.csv',
    period: 'November 2024',
    sendMethod: 'api',
    uploadedAt: '2024-12-01T09:00:00Z',
    exampleRows: [
      { rowNumber: 45, originalValue: '$2,450.00 (expected $2,500.00)', customerName: 'Pacific Systems', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 112, originalValue: '$8,200.00 (expected $8,400.00)', customerName: 'Cascade Supply', catalogNumber: 'FT-PMP-1050' },
    ],
  },
  {
    id: 'issue-8',
    severity: 'fyi',
    title: 'Commodity products may not be attributable',
    whyMatters: 'Some commodity products cannot be reliably attributed to a supplier in many ERPs.',
    affectedRows: 45,
    manufacturers: ['FlowTech Industries', 'Precision Valve Corp'],
    fileName: 'pos_export_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [],
  },
  {
    id: 'issue-9',
    severity: 'fyi',
    title: 'Private label rules are manufacturer-specific',
    whyMatters: 'Private label classification may be handled by the manufacturer.',
    affectedRows: 23,
    manufacturers: ['Precision Valve Corp'],
    fileName: 'precision_valve_dec.xlsx',
    period: 'December 2024',
    sendMethod: 'sftp',
    uploadedAt: '2024-12-27T10:15:00Z',
    exampleRows: [],
  },
];

export const mockManufacturerSendIssues: ManufacturerSendIssue[] = [
  {
    id: 'issue-1',
    severity: 'blocking',
    title: 'Territory code missing',
    whyMatters: 'Territory is required for rep firm commission calculations.',
    affectedRows: 18,
    repFirms: ['Northwest Sales Associates', 'Mountain States Rep Group'],
    field: 'territoryCode',
    fileName: 'pos_repfirm_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 45, originalValue: '', customerName: 'Cascade Water Systems', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 89, originalValue: '', customerName: 'Portland Plumbing Supply', catalogNumber: 'FT-PMP-1050' },
      { rowNumber: 156, originalValue: '', customerName: 'Boise Industrial', catalogNumber: 'FT-VAL-3036' },
      { rowNumber: 201, originalValue: '', customerName: 'Seattle Mechanical', catalogNumber: 'PV-CTL-500' },
      { rowNumber: 234, originalValue: '', customerName: 'Tacoma Supply Co', catalogNumber: 'FT-VAL-2024' },
    ],
  },
  {
    id: 'issue-2',
    severity: 'blocking',
    title: 'Customer ZIP outside rep territory',
    whyMatters: 'Some customer ZIPs fall outside assigned rep territories.',
    affectedRows: 7,
    repFirms: ['Northwest Sales Associates'],
    field: 'customerZip',
    fileName: 'pos_repfirm_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 23, originalValue: '85001', customerName: 'Arizona Supply' },
      { rowNumber: 67, originalValue: '90210', customerName: 'California Industrial' },
      { rowNumber: 98, originalValue: '33101', customerName: 'Florida Equipment' },
    ],
  },
  {
    id: 'issue-3',
    severity: 'blocking',
    title: 'Duplicate transaction IDs',
    whyMatters: 'Each transaction must have a unique identifier to avoid double-counting.',
    affectedRows: 4,
    repFirms: ['Mountain States Rep Group'],
    field: 'transactionId',
    fileName: 'mountain_states_dec.xlsx',
    period: 'December 2024',
    sendMethod: 'sftp',
    uploadedAt: '2024-12-27T10:15:00Z',
    exampleRows: [
      { rowNumber: 102, originalValue: 'TXN-2024-001', customerName: 'Denver Systems', catalogNumber: 'PV-CTL-500' },
      { rowNumber: 234, originalValue: 'TXN-2024-001', customerName: 'Salt Lake Supply', catalogNumber: 'PV-SEN-200' },
    ],
  },
  {
    id: 'issue-4',
    severity: 'warning',
    title: 'Commission rate not specified',
    whyMatters: 'Default commission rate will be applied if not specified.',
    affectedRows: 45,
    repFirms: ['Northwest Sales Associates', 'Mountain States Rep Group'],
    field: 'commissionRate',
    fileName: 'pos_repfirm_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [
      { rowNumber: 12, originalValue: '', customerName: 'ABC Supply', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 34, originalValue: '', customerName: 'XYZ Industrial', catalogNumber: 'FT-PMP-1050' },
      { rowNumber: 78, originalValue: '', customerName: 'Metro Equipment', catalogNumber: 'PV-CTL-500' },
    ],
  },
  {
    id: 'issue-5',
    severity: 'warning',
    title: 'End customer name missing',
    whyMatters: 'End customer information helps reps identify sales opportunities.',
    affectedRows: 22,
    repFirms: ['Mountain States Rep Group'],
    field: 'endCustomerName',
    fileName: 'mountain_states_dec.xlsx',
    period: 'December 2024',
    sendMethod: 'sftp',
    uploadedAt: '2024-12-27T10:15:00Z',
    exampleRows: [
      { rowNumber: 15, originalValue: '', catalogNumber: 'PV-SEN-200' },
      { rowNumber: 89, originalValue: '', catalogNumber: 'PV-CTL-750' },
    ],
  },
  {
    id: 'issue-6',
    severity: 'warning',
    title: 'Product category not mapped',
    whyMatters: 'Category helps reps understand product mix for their territories.',
    affectedRows: 15,
    repFirms: ['Northwest Sales Associates'],
    field: 'productCategory',
    fileName: 'pos_repfirm_nov2024.csv',
    period: 'November 2024',
    sendMethod: 'api',
    uploadedAt: '2024-12-01T09:00:00Z',
    exampleRows: [
      { rowNumber: 45, originalValue: '', customerName: 'Pacific Systems', catalogNumber: 'FT-VAL-2024' },
      { rowNumber: 112, originalValue: '', customerName: 'Cascade Supply', catalogNumber: 'FT-PMP-1050' },
    ],
  },
  {
    id: 'issue-7',
    severity: 'fyi',
    title: 'Split territory transactions detected',
    whyMatters: 'Some transactions may need manual review for territory credit allocation.',
    affectedRows: 12,
    repFirms: ['Northwest Sales Associates', 'Mountain States Rep Group'],
    fileName: 'pos_repfirm_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [],
  },
  {
    id: 'issue-8',
    severity: 'fyi',
    title: 'House account sales included',
    whyMatters: 'House accounts may have different commission structures.',
    affectedRows: 8,
    repFirms: ['Northwest Sales Associates'],
    fileName: 'pos_repfirm_dec2024.csv',
    period: 'December 2024',
    sendMethod: 'file',
    uploadedAt: '2024-12-28T14:30:00Z',
    exampleRows: [],
  },
];

// Alias types
export type EntityAlias = {
  id: string;
  entityId: string;
  entityName: string;
  alias: string;
};

// Mock unmatched entities
export type UnmatchedEntity = {
  id: string;
  name: string;
  firstSeen: string;
  recordCount: number;
};

export const mockUnmatchedManufacturers: UnmatchedEntity[] = [
  { id: 'unmatched-1', name: 'FlowTech Inc', firstSeen: '2024-12-15', recordCount: 234 },
  { id: 'unmatched-2', name: 'Precision Valve', firstSeen: '2024-12-14', recordCount: 89 },
];

export const mockUnmatchedDistributors: UnmatchedEntity[] = [
  { id: 'unmatched-d1', name: 'ACME Dist Corp', firstSeen: '2024-12-15', recordCount: 156 },
  { id: 'unmatched-d2', name: 'Metro Supplies Inc', firstSeen: '2024-12-14', recordCount: 67 },
];

export const mockUnmatchedRepFirms: UnmatchedEntity[] = [
  { id: 'unmatched-r1', name: 'West Coast Reps', firstSeen: '2024-12-15', recordCount: 156 },
  { id: 'unmatched-r2', name: 'Mountain Rep Agency', firstSeen: '2024-12-14', recordCount: 43 },
];

// Initial aliases
export const mockManufacturerAliases: EntityAlias[] = [
  { id: 'alias-1', entityId: 'mc-001', entityName: 'FlowTech Industries', alias: 'FlowTech' },
  { id: 'alias-2', entityId: 'mc-001', entityName: 'FlowTech Industries', alias: 'FLOWTECH INDUSTRIES INC' },
  { id: 'alias-3', entityId: 'mc-002', entityName: 'Precision Valve Corp', alias: 'PVC' },
  { id: 'alias-4', entityId: 'mc-002', entityName: 'Precision Valve Corp', alias: 'Precision Valve Corporation' },
];

export const mockDistributorAliases: EntityAlias[] = [
  { id: 'alias-d1', entityId: 'dc-001', entityName: 'Acme Distribution', alias: 'ACME' },
  { id: 'alias-d2', entityId: 'dc-001', entityName: 'Acme Distribution', alias: 'Acme Dist' },
  { id: 'alias-d3', entityId: 'dc-002', entityName: 'Metro Supply Co', alias: 'Metro' },
];

export const mockRepFirmAliases: EntityAlias[] = [
  { id: 'alias-r1', entityId: 'rep-001', entityName: 'Western Region Reps', alias: 'WRR' },
  { id: 'alias-r2', entityId: 'rep-001', entityName: 'Western Region Reps', alias: 'Western Reps' },
  { id: 'alias-r3', entityId: 'rep-002', entityName: 'Mountain States Agency', alias: 'MSA' },
  { id: 'alias-r4', entityId: 'rep-002', entityName: 'Mountain States Agency', alias: 'Mountain Agency' },
];

// Rep Field Mapping Types and Mock Data
export type RequirementLevel = 'required' | 'highly-suggested' | 'optional' | 'one-of-group';
export type POSFieldSection = 'transaction' | 'selling-branch' | 'territory' | 'shipping-branch' | 'bill-to' | 'product-id' | 'quantity-pricing';
export type POTFieldSection = 'transaction' | 'transfer-branch' | 'selling-branch' | 'bill-to' | 'product-id' | 'quantity-cost';

export interface FieldDefinition {
  name: string;
  apiName: string;
  section: POSFieldSection | POTFieldSection;
  requirement: RequirementLevel;
  groupId?: string;
  isPreferred?: boolean;
  description: string;
}

export interface FieldReceiptStatus {
  isMapped: boolean;
  isVisibleToRep: boolean;
  hiddenBy?: 'manufacturer' | 'distributor';
  repMapping?: string;
}

export interface CustomField {
  name: string;
  source: string;
  description: string;
  repMapping?: string;
}

export interface RepSystemField {
  value: string;
  label: string;
}

export interface SectionConfig {
  title: string;
  description: string;
  order: number;
}

// POS Fields
export const mockPosFieldDefinitions: FieldDefinition[] = [
  { name: 'Transaction Date', apiName: 'transactionDate', section: 'transaction', requirement: 'required', description: 'The date of the transaction or invoice.' },
  { name: 'Order Type', apiName: 'orderType', section: 'transaction', requirement: 'optional', description: 'Identifies the type of order (e.g., STANDARD, LOT, DIRECT_SHIP, PROJECT).' },
  { name: 'Selling Branch #', apiName: 'sellingBranchNumber', section: 'selling-branch', requirement: 'highly-suggested', description: 'The internal branch number for the selling location.' },
  { name: 'Selling Branch Name / City', apiName: 'sellingBranchNameCity', section: 'selling-branch', requirement: 'highly-suggested', description: 'The name or city of the selling branch.' },
  { name: 'Selling Branch Zip Code', apiName: 'sellingBranchZipCode', section: 'territory', requirement: 'one-of-group', groupId: 'territory-zip', description: 'ZIP code of the branch that sold the material.' },
  { name: 'Customer Zip Code', apiName: 'customerZipCode', section: 'territory', requirement: 'one-of-group', groupId: 'territory-zip', description: 'ZIP code of the customer location.' },
  { name: 'Shipping Branch #', apiName: 'shippingBranchNumber', section: 'shipping-branch', requirement: 'highly-suggested', description: 'The internal branch number for the shipping location.' },
  { name: 'Shipping Branch Name / City', apiName: 'shippingBranchNameCity', section: 'shipping-branch', requirement: 'highly-suggested', description: 'The name or city of the shipping branch.' },
  { name: 'Shipping Branch Zip Code', apiName: 'shippingBranchZipCode', section: 'shipping-branch', requirement: 'optional', description: 'ZIP code of the shipping branch.' },
  { name: 'Bill-To Account / Code', apiName: 'billTo', section: 'bill-to', requirement: 'highly-suggested', description: 'The bill-to account identifier.' },
  { name: 'Bill-To Branch Name / City', apiName: 'billToBranchNameCity', section: 'bill-to', requirement: 'highly-suggested', description: 'The name or city of the billing branch.' },
  { name: 'Bill-To Branch Zip Code', apiName: 'billToBranchZipCode', section: 'bill-to', requirement: 'optional', description: 'ZIP code of the billing branch.' },
  { name: 'Manufacturer Catalog #', apiName: 'manufacturerCatalogNumber', section: 'product-id', requirement: 'one-of-group', groupId: 'product-id', isPreferred: true, description: 'The manufacturer catalog or part number (preferred identifier).' },
  { name: 'Manufacturer SKU #', apiName: 'manufacturerSku', section: 'product-id', requirement: 'one-of-group', groupId: 'product-id', description: 'Alternative product identifier.' },
  { name: 'UPC Code', apiName: 'upcCode', section: 'product-id', requirement: 'one-of-group', groupId: 'product-id', description: 'Cross-reference identifier.' },
  { name: 'Unit of Measure', apiName: 'unitOfMeasure', section: 'product-id', requirement: 'highly-suggested', description: 'Unit of measure (each, carton, etc.).' },
  { name: 'Quantity (# of Units Sold)', apiName: 'quantity', section: 'quantity-pricing', requirement: 'one-of-group', groupId: 'net-price-calc', description: 'Total number of units sold.' },
  { name: 'Distributor Unit Cost', apiName: 'distributorUnitCost', section: 'quantity-pricing', requirement: 'one-of-group', groupId: 'net-price-calc', description: 'Cost in the distributor ERP system.' },
  { name: 'Extended Net Price', apiName: 'extendedNetPrice', section: 'quantity-pricing', requirement: 'one-of-group', groupId: 'net-price-calc', isPreferred: true, description: 'Basis for rep commission calculations (Qty × Unit Cost).' },
];

// POT Fields
export const mockPotFieldDefinitions: FieldDefinition[] = [
  { name: 'Transaction Date', apiName: 'pot_transactionDate', section: 'transaction', requirement: 'required', description: 'Date of the internal transfer.' },
  { name: 'Transfer Branch #', apiName: 'pot_transferBranchNumber', section: 'transfer-branch', requirement: 'highly-suggested', description: 'Origin branch number (ship-from).' },
  { name: 'Transfer Branch Name / City', apiName: 'pot_transferBranchNameCity', section: 'transfer-branch', requirement: 'highly-suggested', description: 'Name or city of the transfer origin.' },
  { name: 'Selling Branch #', apiName: 'pot_sellingBranchNumber', section: 'selling-branch', requirement: 'required', description: 'Credit-owning branch number.' },
  { name: 'Selling Branch Name / City', apiName: 'pot_sellingBranchNameCity', section: 'selling-branch', requirement: 'highly-suggested', description: 'Name or city of the selling branch.' },
  { name: 'Selling Branch Zip Code', apiName: 'pot_sellingBranchZipCode', section: 'selling-branch', requirement: 'required', description: 'ZIP code for territory assignment.' },
  { name: 'Bill-To Branch #', apiName: 'pot_billToBranchNumber', section: 'bill-to', requirement: 'highly-suggested', description: 'Bill-to branch number.' },
  { name: 'Bill-To Branch Name / City', apiName: 'pot_billToBranchNameCity', section: 'bill-to', requirement: 'highly-suggested', description: 'Name or city of the bill-to branch.' },
  { name: 'Manufacturer Catalog #', apiName: 'pot_manufacturerCatalogNumber', section: 'product-id', requirement: 'one-of-group', groupId: 'pot-product-id', isPreferred: true, description: 'Product identifier.' },
  { name: 'UPC Code', apiName: 'pot_upcCode', section: 'product-id', requirement: 'one-of-group', groupId: 'pot-product-id', description: 'Cross-reference identifier.' },
  { name: 'Unit of Measure', apiName: 'pot_unitOfMeasure', section: 'product-id', requirement: 'highly-suggested', description: 'Unit of measure.' },
  { name: 'Quantity (# of Units)', apiName: 'pot_quantity', section: 'quantity-cost', requirement: 'required', description: 'Units transferred.' },
  { name: 'Distributor Unit Cost', apiName: 'pot_distributorUnitCost', section: 'quantity-cost', requirement: 'one-of-group', groupId: 'pot-net-value', description: 'Per-unit cost.' },
  { name: 'Extended Price', apiName: 'pot_extendedPrice', section: 'quantity-cost', requirement: 'one-of-group', groupId: 'pot-net-value', description: 'Total transfer value.' },
];

// Section Configs
export const mockPosSectionConfig: Record<POSFieldSection, SectionConfig> = {
  'transaction': { title: 'Transaction', description: 'Basic transaction info', order: 1 },
  'selling-branch': { title: 'Selling Branch (Credit Owner)', description: 'Which branch gets rep credit', order: 2 },
  'territory': { title: 'Territory (ZIP Codes)', description: 'Used for rep territory assignment', order: 3 },
  'shipping-branch': { title: 'Shipping Branch (Fulfillment)', description: 'Where the order ships from', order: 4 },
  'bill-to': { title: 'Bill-To (Billing Context)', description: 'Billing information', order: 5 },
  'product-id': { title: 'Product Identification', description: 'Product identifiers', order: 6 },
  'quantity-pricing': { title: 'Quantity & Pricing', description: 'Used for commission calculations', order: 7 },
};

export const mockPotSectionConfig: Record<POTFieldSection, SectionConfig> = {
  'transaction': { title: 'Transaction', description: 'Transfer date', order: 1 },
  'transfer-branch': { title: 'Transfer Branch (Origin)', description: 'Where inventory came from', order: 2 },
  'selling-branch': { title: 'Selling Branch (Credit Owner)', description: 'Which branch gets credit', order: 3 },
  'bill-to': { title: 'Bill-To Branch', description: 'Billing entity', order: 4 },
  'product-id': { title: 'Product Identification', description: 'Product identifiers', order: 5 },
  'quantity-cost': { title: 'Quantity & Cost', description: 'Transfer values', order: 6 },
};

// Rep System Fields
export const mockRepSystemFields: RepSystemField[] = [
  { value: 'none', label: 'Do not import' },
  { value: 'invoice_date', label: 'Invoice Date' },
  { value: 'order_date', label: 'Order Date' },
  { value: 'transaction_type', label: 'Transaction Type' },
  { value: 'branch_id', label: 'Branch ID' },
  { value: 'branch_name', label: 'Branch Name' },
  { value: 'branch_city', label: 'Branch City' },
  { value: 'branch_zip', label: 'Branch ZIP' },
  { value: 'customer_zip', label: 'Customer ZIP' },
  { value: 'ship_from_id', label: 'Ship From ID' },
  { value: 'ship_from_name', label: 'Ship From Name' },
  { value: 'ship_from_zip', label: 'Ship From ZIP' },
  { value: 'bill_to_id', label: 'Bill To ID' },
  { value: 'bill_to_name', label: 'Bill To Name' },
  { value: 'bill_to_zip', label: 'Bill To ZIP' },
  { value: 'part_number', label: 'Part Number' },
  { value: 'sku', label: 'SKU' },
  { value: 'upc', label: 'UPC' },
  { value: 'qty', label: 'Quantity' },
  { value: 'uom', label: 'Unit of Measure' },
  { value: 'unit_cost', label: 'Unit Cost' },
  { value: 'unit_price', label: 'Unit Price' },
  { value: 'extended_cost', label: 'Extended Cost' },
  { value: 'extended_price', label: 'Extended Price' },
  { value: 'net_sales', label: 'Net Sales' },
  { value: 'custom_1', label: 'Custom Field 1' },
  { value: 'custom_2', label: 'Custom Field 2' },
  { value: 'custom_3', label: 'Custom Field 3' },
];

// Field Receipt Status
export const mockFieldReceiptStatus: Record<string, FieldReceiptStatus> = {
  transactionDate: { isMapped: true, isVisibleToRep: true, repMapping: 'invoice_date' },
  orderType: { isMapped: false, isVisibleToRep: true },
  sellingBranchNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_id' },
  sellingBranchNameCity: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_name' },
  sellingBranchZipCode: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_zip' },
  customerZipCode: { isMapped: true, isVisibleToRep: true, repMapping: 'customer_zip' },
  shippingBranchNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'ship_from_id' },
  shippingBranchNameCity: { isMapped: false, isVisibleToRep: true },
  shippingBranchZipCode: { isMapped: false, isVisibleToRep: true },
  billTo: { isMapped: true, isVisibleToRep: false, hiddenBy: 'manufacturer' },
  billToBranchNameCity: { isMapped: true, isVisibleToRep: false, hiddenBy: 'manufacturer' },
  billToBranchZipCode: { isMapped: false, isVisibleToRep: true },
  manufacturerCatalogNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'part_number' },
  manufacturerSku: { isMapped: false, isVisibleToRep: true },
  upcCode: { isMapped: true, isVisibleToRep: true, repMapping: 'upc' },
  quantity: { isMapped: true, isVisibleToRep: true, repMapping: 'qty' },
  unitOfMeasure: { isMapped: true, isVisibleToRep: true, repMapping: 'uom' },
  distributorUnitCost: { isMapped: true, isVisibleToRep: false, hiddenBy: 'distributor' },
  extendedNetPrice: { isMapped: true, isVisibleToRep: true, repMapping: 'net_sales' },
  pot_transactionDate: { isMapped: true, isVisibleToRep: true, repMapping: 'invoice_date' },
  pot_transferBranchNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'ship_from_id' },
  pot_transferBranchNameCity: { isMapped: true, isVisibleToRep: true, repMapping: 'ship_from_name' },
  pot_sellingBranchNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_id' },
  pot_sellingBranchNameCity: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_name' },
  pot_sellingBranchZipCode: { isMapped: true, isVisibleToRep: true, repMapping: 'branch_zip' },
  pot_billToBranchNumber: { isMapped: false, isVisibleToRep: true },
  pot_billToBranchNameCity: { isMapped: false, isVisibleToRep: true },
  pot_manufacturerCatalogNumber: { isMapped: true, isVisibleToRep: true, repMapping: 'part_number' },
  pot_upcCode: { isMapped: false, isVisibleToRep: true },
  pot_quantity: { isMapped: true, isVisibleToRep: true, repMapping: 'qty' },
  pot_unitOfMeasure: { isMapped: true, isVisibleToRep: true, repMapping: 'uom' },
  pot_distributorUnitCost: { isMapped: true, isVisibleToRep: false, hiddenBy: 'manufacturer' },
  pot_extendedPrice: { isMapped: true, isVisibleToRep: true, repMapping: 'extended_price' },
};

// Custom Fields
export const mockCustomFields: CustomField[] = []
// Example
// [
//   { name: 'Project Name', source: 'FlowTech Industries', description: 'Customer project or job name', repMapping: 'custom_1' },
//   { name: 'Sales Rep ID', source: 'Pacific Supply Company', description: 'Distributor internal sales rep identifier', repMapping: '' },
//   { name: 'Customer PO', source: 'FlowTech Industries', description: 'Customer purchase order number', repMapping: 'custom_2' },
//   { name: 'End User', source: 'Midwest Distribution', description: 'End user or contractor name', repMapping: '' },
//   { name: 'Job Site ZIP', source: 'Pacific Supply Company', description: 'ZIP code of job site location', repMapping: 'custom_3' },
// ];

// ============================================
// SEND METHOD CONFIGURATION
// ============================================

export type SendMethodType = 'file' | 'api' | 'sftp' | 'email';

export type ApiCredentials = {
  baseUrl: string;
  apiKey: string;
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
  }>;
  rateLimit: {
    requestsPerMinute: number;
    maxRecordsPerBatch: number;
  };
  requiredFields: Array<{ name: string; format: string }>;
  errorCodes: Array<{ code: string; description: string }>;
  batchStatuses: Array<{ status: string; description: string }>;
};

export type SftpConfig = {
  host: string;
  username: string;
  directory: string;
  port: number;
};

export type EmailConfig = {
  forwardingAddress: string;
};

export type SendMethodConfig = {
  activeSendMethod: SendMethodType;
  api: ApiCredentials;
  sftp: SftpConfig;
  email: EmailConfig;
};

// Distributor send method config (sending to FlowConnect)
export const mockDistributorSendMethodConfig: SendMethodConfig = {
  activeSendMethod: 'file',
  api: {
    baseUrl: 'https://api.flowconnect.io/v1',
    apiKey: 'fc_live_k7x9m2p4q8r1s5t3',
    endpoints: [
      { method: 'POST', path: '/pos/upload', description: 'Upload POS batch' },
      { method: 'GET', path: '/pos/batches/{batchId}', description: 'Check batch status' },
      { method: 'GET', path: '/pos/batches/{batchId}/errors', description: 'Get row-level errors' },
    ],
    rateLimit: { requestsPerMinute: 1000, maxRecordsPerBatch: 100000 },
    requiredFields: [
      { name: 'transactionDate', format: 'YYYY-MM-DD' },
      { name: 'sellingBranchZip', format: '5 or 9 digits' },
      { name: 'customerZip', format: '5 or 9 digits' },
      { name: 'catalogNumber', format: 'string' },
      { name: 'quantity', format: 'integer' },
      { name: 'unitCost', format: 'decimal' },
      { name: 'extendedPrice', format: 'decimal' },
      { name: 'unitOfMeasure', format: 'EA, CS, etc.' },
    ],
    errorCodes: [
      { code: '400', description: 'Invalid payload' },
      { code: '401', description: 'Invalid API key' },
      { code: '413', description: 'Batch too large' },
      { code: '429', description: 'Rate limited' },
    ],
    batchStatuses: [
      { status: 'received', description: 'Batch queued' },
      { status: 'validating', description: 'Processing' },
      { status: 'accepted', description: 'All records valid' },
      { status: 'partial', description: 'Some errors' },
      { status: 'rejected', description: 'All records failed' },
    ],
  },
  sftp: {
    host: 'sftp.flowconnect.io',
    username: 'pacific-supply-co',
    directory: '/uploads/pos/',
    port: 22,
  },
  email: {
    forwardingAddress: 'pos-upload-abc123@flowconnect.io',
  },
};

// Manufacturer send method config (sending to rep firms via FlowConnect)
export const mockManufacturerSendMethodConfig: SendMethodConfig = {
  activeSendMethod: 'file',
  api: {
    baseUrl: 'https://api.flowconnect.io/v1',
    apiKey: 'fc_mfr_live_m4n7p9q2r5s8t1',
    endpoints: [
      { method: 'POST', path: '/pos/rep-sends', description: 'Submit POS records to rep firms' },
      { method: 'GET', path: '/pos/rep-sends/{batchId}', description: 'Check batch status' },
      { method: 'GET', path: '/pos/rep-sends/{batchId}/errors', description: 'Get row-level errors' },
    ],
    rateLimit: { requestsPerMinute: 1000, maxRecordsPerBatch: 100000 },
    requiredFields: [
      { name: 'transactionDate', format: 'YYYY-MM-DD' },
      { name: 'distributorName', format: 'string' },
      { name: 'sellingBranchZip', format: '5 or 9 digits' },
      { name: 'customerZip', format: '5 or 9 digits' },
      { name: 'catalogNumber', format: 'string' },
      { name: 'quantity', format: 'integer' },
      { name: 'unitCost', format: 'decimal' },
      { name: 'extendedPrice', format: 'decimal' },
    ],
    errorCodes: [
      { code: '400', description: 'Invalid payload' },
      { code: '401', description: 'Invalid API key' },
      { code: '404', description: 'Rep firm not found' },
      { code: '429', description: 'Rate limited' },
    ],
    batchStatuses: [
      { status: 'received', description: 'Batch queued' },
      { status: 'validating', description: 'Processing' },
      { status: 'delivering', description: 'Sending to rep' },
      { status: 'delivered', description: 'Successfully sent' },
      { status: 'partial', description: 'Some errors' },
      { status: 'rejected', description: 'All records failed' },
    ],
  },
  sftp: {
    host: 'sftp.flowconnect.io',
    username: 'flowtech-industries-mfr',
    directory: '/outgoing/rep-sends/',
    port: 22,
  },
  email: {
    forwardingAddress: 'rep-sends-flowtech@flowconnect.io',
  },
};

// ============================================
// SEND HISTORY DATA (Manufacturer & Distributor)
// ============================================

export type SendStatus = 'sent' | 'sent_with_warnings' | 'failed' | 'blocked';
export type SendHistoryMethod = 'file' | 'api' | 'sftp' | 'email';
export type SendHistoryDataType = 'POS' | 'POT' | 'POS + POT';

export interface DeliveryIssues {
  blocking: number;
  warnings: number;
  fyi: number;
}

export interface RepFirmDelivery {
  id: string;
  name: string;
  territories: string[];
  status: SendStatus;
  recordCount: number;
  issues: DeliveryIssues;
  sentAt: string;
  fileName?: string;
}

export interface ManufacturerDelivery {
  id: string;
  name: string;
  status: SendStatus;
  recordCount: number;
  issues: DeliveryIssues;
  sentAt: string;
  fileName?: string;
}

export interface ManufacturerMonthSend {
  id: string;
  period: string;
  dataType: SendHistoryDataType;
  sendMethod: SendHistoryMethod;
  fileName?: string;
  repFirms: RepFirmDelivery[];
  totalRecords: number;
  sentAt: string;
}

export interface DistributorMonthSend {
  id: string;
  period: string;
  dataType: SendHistoryDataType;
  sendMethod: SendHistoryMethod;
  fileName?: string;
  manufacturers: ManufacturerDelivery[];
  totalRecords: number;
  sentAt: string;
}

// Mock history data for manufacturers sending to rep firms
export const mockManufacturerHistorySends: ManufacturerMonthSend[] = [
  {
    id: 'hist-1',
    period: 'November 2024',
    dataType: 'POS',
    sendMethod: 'file',
    fileName: 'pos_repfirm_nov2024.csv',
    totalRecords: 4523,
    sentAt: '2024-12-05T14:35:00Z',
    repFirms: [
      {
        id: 'rf-001',
        name: 'Northwest Sales Associates',
        territories: ['WA', 'OR', 'ID'],
        status: 'sent',
        recordCount: 1823,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-12-05T14:35:00Z',
        fileName: 'pos_repfirm_nov2024.csv',
      },
      {
        id: 'rf-002',
        name: 'Mountain States Rep Group',
        territories: ['CO', 'UT', 'WY', 'MT'],
        status: 'sent',
        recordCount: 2700,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
        sentAt: '2024-12-05T14:35:00Z',
        fileName: 'pos_repfirm_nov2024.csv',
      },
    ],
  },
  {
    id: 'hist-2',
    period: 'October 2024',
    dataType: 'POS',
    sendMethod: 'api',
    totalRecords: 4102,
    sentAt: '2024-11-06T10:20:00Z',
    repFirms: [
      {
        id: 'rf-001',
        name: 'Northwest Sales Associates',
        territories: ['WA', 'OR', 'ID'],
        status: 'sent_with_warnings',
        recordCount: 1680,
        issues: { blocking: 0, warnings: 2, fyi: 0 },
        sentAt: '2024-11-06T10:20:00Z',
      },
      {
        id: 'rf-002',
        name: 'Mountain States Rep Group',
        territories: ['CO', 'UT', 'WY', 'MT'],
        status: 'sent',
        recordCount: 2422,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-11-06T10:22:00Z',
      },
    ],
  },
  {
    id: 'hist-3',
    period: 'September 2024',
    dataType: 'POS',
    sendMethod: 'sftp',
    totalRecords: 3854,
    sentAt: '2024-10-04T09:05:00Z',
    repFirms: [
      {
        id: 'rf-001',
        name: 'Northwest Sales Associates',
        territories: ['WA', 'OR', 'ID'],
        status: 'sent',
        recordCount: 1654,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
        sentAt: '2024-10-04T09:05:00Z',
      },
      {
        id: 'rf-002',
        name: 'Mountain States Rep Group',
        territories: ['CO', 'UT', 'WY', 'MT'],
        status: 'sent',
        recordCount: 2200,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
        sentAt: '2024-10-04T09:05:00Z',
      },
    ],
  },
  {
    id: 'hist-4',
    period: 'August 2024',
    dataType: 'POS',
    sendMethod: 'file',
    fileName: 'pos_repfirm_aug2024.csv',
    totalRecords: 3890,
    sentAt: '2024-09-05T11:30:00Z',
    repFirms: [
      {
        id: 'rf-001',
        name: 'Northwest Sales Associates',
        territories: ['WA', 'OR', 'ID'],
        status: 'failed',
        recordCount: 0,
        issues: { blocking: 2, warnings: 0, fyi: 0 },
        sentAt: '2024-09-05T11:30:00Z',
        fileName: 'pos_repfirm_aug2024.csv',
      },
      {
        id: 'rf-002',
        name: 'Mountain States Rep Group',
        territories: ['CO', 'UT', 'WY', 'MT'],
        status: 'sent_with_warnings',
        recordCount: 2445,
        issues: { blocking: 0, warnings: 1, fyi: 0 },
        sentAt: '2024-09-05T11:30:00Z',
        fileName: 'pos_repfirm_aug2024.csv',
      },
    ],
  },
  {
    id: 'hist-5',
    period: 'July 2024',
    dataType: 'POS',
    sendMethod: 'email',
    totalRecords: 3456,
    sentAt: '2024-08-03T08:15:00Z',
    repFirms: [
      {
        id: 'rf-001',
        name: 'Northwest Sales Associates',
        territories: ['WA', 'OR', 'ID'],
        status: 'sent',
        recordCount: 1456,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-08-03T08:15:00Z',
      },
      {
        id: 'rf-002',
        name: 'Mountain States Rep Group',
        territories: ['CO', 'UT', 'WY', 'MT'],
        status: 'sent',
        recordCount: 2000,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
        sentAt: '2024-08-03T08:15:00Z',
      },
    ],
  },
];

// Mock history data for distributors sending to manufacturers
export const mockDistributorHistorySends: DistributorMonthSend[] = [
  {
    id: 'hist-1',
    period: 'November 2024',
    dataType: 'POS',
    sendMethod: 'file',
    fileName: 'pos_export_nov2024.csv',
    totalRecords: 2847,
    sentAt: '2024-12-05T14:35:00Z',
    manufacturers: [
      {
        id: 'mfr-1',
        name: 'FlowTech Industries',
        status: 'sent',
        recordCount: 1523,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-12-05T14:35:00Z',
        fileName: 'pos_export_nov2024.csv',
      },
      {
        id: 'mfr-2',
        name: 'Precision Valve Corp',
        status: 'sent',
        recordCount: 1324,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-12-05T14:35:00Z',
        fileName: 'pos_export_nov2024.csv',
      },
    ],
  },
  {
    id: 'hist-2',
    period: 'October 2024',
    dataType: 'POS + POT',
    sendMethod: 'api',
    totalRecords: 3102,
    sentAt: '2024-11-06T10:20:00Z',
    manufacturers: [
      {
        id: 'mfr-1',
        name: 'FlowTech Industries',
        status: 'sent_with_warnings',
        recordCount: 1680,
        issues: { blocking: 0, warnings: 2, fyi: 0 },
        sentAt: '2024-11-06T10:20:00Z',
      },
      {
        id: 'mfr-2',
        name: 'Precision Valve Corp',
        status: 'sent_with_warnings',
        recordCount: 1422,
        issues: { blocking: 0, warnings: 1, fyi: 1 },
        sentAt: '2024-11-06T10:22:00Z',
      },
    ],
  },
  {
    id: 'hist-3',
    period: 'September 2024',
    dataType: 'POS',
    sendMethod: 'sftp',
    totalRecords: 2654,
    sentAt: '2024-10-04T09:05:00Z',
    manufacturers: [
      {
        id: 'mfr-1',
        name: 'FlowTech Industries',
        status: 'sent',
        recordCount: 2654,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
        sentAt: '2024-10-04T09:05:00Z',
      },
    ],
  },
  {
    id: 'hist-4',
    period: 'August 2024',
    dataType: 'POS',
    sendMethod: 'file',
    fileName: 'pos_export_aug2024.csv',
    totalRecords: 2890,
    sentAt: '2024-09-05T11:30:00Z',
    manufacturers: [
      {
        id: 'mfr-1',
        name: 'FlowTech Industries',
        status: 'failed',
        recordCount: 0,
        issues: { blocking: 2, warnings: 0, fyi: 0 },
        sentAt: '2024-09-05T11:30:00Z',
        fileName: 'pos_export_aug2024.csv',
      },
      {
        id: 'mfr-2',
        name: 'Precision Valve Corp',
        status: 'sent_with_warnings',
        recordCount: 1445,
        issues: { blocking: 0, warnings: 1, fyi: 0 },
        sentAt: '2024-09-05T11:30:00Z',
        fileName: 'pos_export_aug2024.csv',
      },
    ],
  },
  {
    id: 'hist-5',
    period: 'July 2024',
    dataType: 'POS',
    sendMethod: 'email',
    totalRecords: 2456,
    sentAt: '2024-08-03T08:15:00Z',
    manufacturers: [
      {
        id: 'mfr-1',
        name: 'FlowTech Industries',
        status: 'sent',
        recordCount: 2456,
        issues: { blocking: 0, warnings: 0, fyi: 1 },
        sentAt: '2024-08-03T08:15:00Z',
      },
    ],
  },
];

// Status and method configuration for history displays
export const sendStatusConfig = {
  sent: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-700 border-green-200',
    iconColor: 'text-green-600',
  },
  sent_with_warnings: {
    label: 'Sent with warnings',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600',
  },
};

export const sendMethodLabels: Record<SendHistoryMethod, string> = {
  file: 'File Upload',
  api: 'API',
  sftp: 'SFTP',
  email: 'Email',
};

// Utility functions for history status calculations
export function getOverallStatusFromRepFirms(repFirms: RepFirmDelivery[]): SendStatus {
  if (repFirms.some(r => r.status === 'failed' || r.status === 'blocked')) {
    return 'failed';
  }
  if (repFirms.some(r => r.status === 'sent_with_warnings')) {
    return 'sent_with_warnings';
  }
  return 'sent';
}

export function getOverallStatusFromManufacturers(manufacturers: ManufacturerDelivery[]): SendStatus {
  if (manufacturers.some(m => m.status === 'failed' || m.status === 'blocked')) {
    return 'failed';
  }
  if (manufacturers.some(m => m.status === 'sent_with_warnings')) {
    return 'sent_with_warnings';
  }
  return 'sent';
}

export function getTotalIssuesFromDeliveries(deliveries: Array<{ issues: DeliveryIssues }>): DeliveryIssues {
  return deliveries.reduce(
    (acc, d) => ({
      blocking: acc.blocking + d.issues.blocking,
      warnings: acc.warnings + d.issues.warnings,
      fyi: acc.fyi + d.issues.fyi,
    }),
    { blocking: 0, warnings: 0, fyi: 0 }
  );
}

// Available period options for filtering
export const historyPeriodOptions = [
  'November 2024',
  'October 2024',
  'September 2024',
  'August 2024',
  'July 2024',
  'June 2024',
];
// DATA INTAKE METHOD TYPES & MOCKS
// ============================================

export type DataIntakeMethodType = 'flow-rms' | 'api' | 'sftp' | 'file' | 'email';

export type DataIntakeApiEndpoint = {
  method: 'GET' | 'POST';
  path: string;
  description: string;
};

export type DataIntakeApiCredentials = {
  baseUrl: string;
  apiKey: string;
};

export type DataIntakeSftpConfig = {
  host: string;
  directory: string;
  schedule: string;
};

export type DataIntakeEmailConfig = {
  deliveryAddress: string;
  schedule: string;
};

export type DataIntakeFlowRmsConfig = {
  hasInstance: boolean;
  instanceUrl?: string;
};

export type DataIntakeApiConfig = {
  credentials: DataIntakeApiCredentials;
  endpoints: DataIntakeApiEndpoint[];
  quickStartExamples: {
    title: string;
    code: string;
  }[];
  rateLimit: string;
  pagination: string;
};

export type DataIntakeFileConfig = {
  description: string;
  downloadPageUrl: string;
};

export type DataIntakeMethodConfig = {
  role: 'manufacturer' | 'rep';
  activeMethod: DataIntakeMethodType;
  flowRms?: DataIntakeFlowRmsConfig;
  api: DataIntakeApiConfig;
  sftp: DataIntakeSftpConfig;
  file: DataIntakeFileConfig;
  email: DataIntakeEmailConfig;
  entityLabel: string; // 'distributors' for manufacturer, 'manufacturers' for rep
};

export const mockManufacturerDataIntakeConfig: DataIntakeMethodConfig = {
  role: 'manufacturer',
  activeMethod: 'file',
  api: {
    credentials: {
      baseUrl: 'https://api.flowconnect.io/v1',
      apiKey: 'fc_mfr_live_x8k2m5p7q1r4s9t6',
    },
    endpoints: [
      { method: 'GET', path: '/pos/received', description: 'List all received POS data' },
      { method: 'GET', path: '/pos/received/{period}', description: 'Get data for specific period' },
      { method: 'GET', path: '/pos/received/{period}/distributor/{distributorId}', description: 'Get data by distributor' },
      { method: 'GET', path: '/pos/export/{period}', description: 'Export aggregated data' },
    ],
    quickStartExamples: [
      {
        title: '1. List received data',
        code: `curl https://api.flowconnect.io/v1/pos/received \\
  -H "Authorization: Bearer fc_mfr_live_x8k2m5p7q1r4s9t6"

{
  "periods": [
    {
      "period": "2024-12",
      "orgCount": 5,
      "totalRecords": 12847,
      "receivedAt": "2024-12-05T14:36:00Z"
    }
  ]
}`,
      },
      {
        title: '2. Get data for a period',
        code: `curl https://api.flowconnect.io/v1/pos/received/2024-12 \\
  -H "Authorization: Bearer fc_mfr_live_x8k2m5p7q1r4s9t6"

{
  "period": "2024-12",
  "distributors": [
    {
      "id": "dist-001",
      "name": "Pacific Supply Company",
      "recordCount": 2847,
      "receivedAt": "2024-12-05T14:36:00Z"
    }
  ],
  "totalRecords": 12847
}`,
      },
      {
        title: '3. Export aggregated CSV',
        code: `curl https://api.flowconnect.io/v1/pos/export/2024-12 \\
  -H "Authorization: Bearer fc_mfr_live_x8k2m5p7q1r4s9t6" \\
  -H "Accept: text/csv" \\
  -o pos_december_2024.csv`,
      },
    ],
    rateLimit: '1,000 requests/min',
    pagination: 'Use ?page=1&limit=1000 for large datasets',
  },
  sftp: {
    host: 'sftp.yourcompany.com',
    directory: '/incoming/pos/',
    schedule: 'Daily at 6:00 AM EST',
  },
  file: {
    description: 'Download CSV or Excel files directly from the Received Data page. View data by distributor or download aggregated reports.',
    downloadPageUrl: '/nemra-pos/manufacturer/received-data',
  },
  email: {
    deliveryAddress: 'pos-data@flowtechind.com',
    schedule: 'Monthly summary on the 5th',
  },
  entityLabel: 'distributors',
};

export const mockRepDataIntakeConfig: DataIntakeMethodConfig = {
  role: 'rep',
  activeMethod: 'flow-rms',
  flowRms: {
    hasInstance: true,
    instanceUrl: 'https://flowrms.com',
  },
  api: {
    credentials: {
      baseUrl: 'https://api.flowconnect.io/v1',
      apiKey: 'fc_rep_live_j3n8k2m5p7q1r4s9',
    },
    endpoints: [
      { method: 'GET', path: '/pos/received', description: 'List all received POS data' },
      { method: 'GET', path: '/pos/received/{period}', description: 'Get data for specific period' },
      { method: 'GET', path: '/pos/received/{period}/manufacturer/{manufacturerId}', description: 'Get data by manufacturer' },
      { method: 'GET', path: '/pos/export/{period}', description: 'Export aggregated data' },
    ],
    quickStartExamples: [
      {
        title: '1. List received data',
        code: `curl https://api.flowconnect.io/v1/pos/received \\
  -H "Authorization: Bearer fc_rep_live_j3n8k2m5p7q1r4s9"

{
  "periods": [
    {
      "period": "2024-12",
      "manufacturerCount": 3,
      "totalRecords": 8421,
      "receivedAt": "2024-12-05T14:36:00Z"
    }
  ]
}`,
      },
      {
        title: '2. Get data for a period',
        code: `curl https://api.flowconnect.io/v1/pos/received/2024-12 \\
  -H "Authorization: Bearer fc_rep_live_j3n8k2m5p7q1r4s9"

{
  "period": "2024-12",
  "manufacturers": [
    {
      "id": "mfr-001",
      "name": "FlowTech Industries",
      "recordCount": 2847,
      "receivedAt": "2024-12-05T14:36:00Z"
    }
  ],
  "totalRecords": 8421
}`,
      },
      {
        title: '3. Export aggregated CSV',
        code: `curl https://api.flowconnect.io/v1/pos/export/2024-12 \\
  -H "Authorization: Bearer fc_rep_live_j3n8k2m5p7q1r4s9" \\
  -H "Accept: text/csv" \\
  -o pos_december_2024.csv`,
      },
    ],
    rateLimit: '1,000 requests/min',
    pagination: 'Use ?page=1&limit=1000 for large datasets',
  },
  sftp: {
    host: 'sftp.yourcompany.com',
    directory: '/incoming/pos/',
    schedule: 'Daily at 6:00 AM EST',
  },
  file: {
    description: 'Download CSV or Excel files directly from the POS Data page. View data by manufacturer or download aggregated reports.',
    downloadPageUrl: '/nemra-pos/rep/data-grid',
  },
  email: {
    deliveryAddress: 'pos-data@acmereps.com',
    schedule: 'Monthly summary on the 5th',
  },
  entityLabel: 'manufacturers',
};

// ============================================
// POS RECORD TYPES (FOR DATA GRID / RECEIVED DATA)
// ============================================

export type POSRecord = {
  id: string;
  transactionDate: string;
  sellingBranch: string;
  territory?: string;
  catalogNumber: string;
  quantity: number;
  extendedPrice: number;
};

export type ExtendedPOSRecord = POSRecord & {
  manufacturer: string;
  month: string;
  orderType: string;
  sellingBranchZip: string;
  customerZip: string;
  shippingBranch: string;
  billTo: string;
  uom: string;
};

// ============================================
// MANUFACTURER RECEIVED DATA TYPES
// ============================================

export type ReceivedDataFile = {
  id: string;
  distributorId: string;
  distributorName: string;
  period: string;
  receivedAt: string;
  recordCount: number;
  status: 'complete' | 'partial' | 'pending';
  fileSize: string;
};

export type ManufacturerReceivedDataResult = {
  receivedData: ReceivedDataFile[];
  distributors: DistributorContact[];
  summary: {
    activeDistributors: number;
    totalRecords: number;
    reportingPeriods: number;
  };
};

// ============================================
// REP DATA GRID TYPES
// ============================================

export type RepDataGridResult = {
  records: ExtendedPOSRecord[];
  manufacturers: ManufacturerReporting[];
  summary: {
    totalRecords: number;
    totalValue: number;
    manufacturerCount: number;
    uniqueProducts: number;
  };
};

// ============================================
// MOCK DATA - RECEIVED DATA DISTRIBUTORS
// ============================================

export const mockReceivedDataDistributors: DistributorContact[] = [
  { id: 'dc-001', name: 'Pacific Supply Company', inviteStatus: 'active', contactEmail: 'pos@pacificsupply.com', lastSendDate: '2024-12-05T14:36:00Z' },
  { id: 'dc-002', name: 'Midwest Industrial Supply', inviteStatus: 'active', contactEmail: 'data@midwestindustrial.com', lastSendDate: '2024-12-04T09:15:00Z' },
  { id: 'dc-003', name: 'Eastern Wholesale', inviteStatus: 'pending', contactEmail: 'reports@easternwholesale.com' },
  { id: 'dc-004', name: 'Southern Distribution Co', inviteStatus: 'active', contactEmail: 'pos@southerndist.com', lastSendDate: '2024-12-03T16:20:00Z' },
  { id: 'dc-005', name: 'Mountain States Supply', inviteStatus: 'expired', contactEmail: 'data@mountainstates.com' },
];

// ============================================
// MOCK DATA - RECEIVED DATA (MANUFACTURER)
// ============================================

export const mockReceivedData: ReceivedDataFile[] = [
  { id: 'rd-001', distributorId: 'dc-001', distributorName: 'Pacific Supply Company', period: 'December 2024', receivedAt: '2024-12-05T14:36:00Z', recordCount: 2847, status: 'complete', fileSize: '1.2 MB' },
  { id: 'rd-002', distributorId: 'dc-002', distributorName: 'Midwest Industrial Supply', period: 'December 2024', receivedAt: '2024-12-04T09:15:00Z', recordCount: 1892, status: 'complete', fileSize: '856 KB' },
  { id: 'rd-003', distributorId: 'dc-004', distributorName: 'Southern Distribution Co', period: 'December 2024', receivedAt: '2024-12-03T16:20:00Z', recordCount: 1456, status: 'complete', fileSize: '678 KB' },
  { id: 'rd-004', distributorId: 'dc-001', distributorName: 'Pacific Supply Company', period: 'November 2024', receivedAt: '2024-11-05T14:30:00Z', recordCount: 2654, status: 'complete', fileSize: '1.1 MB' },
  { id: 'rd-005', distributorId: 'dc-002', distributorName: 'Midwest Industrial Supply', period: 'November 2024', receivedAt: '2024-11-04T10:20:00Z', recordCount: 1756, status: 'complete', fileSize: '798 KB' },
  { id: 'rd-006', distributorId: 'dc-004', distributorName: 'Southern Distribution Co', period: 'November 2024', receivedAt: '2024-11-03T11:45:00Z', recordCount: 1342, status: 'complete', fileSize: '612 KB' },
  { id: 'rd-007', distributorId: 'dc-001', distributorName: 'Pacific Supply Company', period: 'October 2024', receivedAt: '2024-10-04T09:05:00Z', recordCount: 2456, status: 'complete', fileSize: '1.0 MB' },
  { id: 'rd-008', distributorId: 'dc-002', distributorName: 'Midwest Industrial Supply', period: 'October 2024', receivedAt: '2024-10-03T11:45:00Z', recordCount: 1623, status: 'complete', fileSize: '742 KB' },
];

// ============================================
// MOCK DATA - POS RECORDS
// ============================================

export const mockPOSRecords: POSRecord[] = [
  { id: 'pos-001', transactionDate: '2024-11-15', sellingBranch: 'Seattle Branch', territory: 'Northwest', catalogNumber: 'VLV-2001', quantity: 25, extendedPrice: 1250 },
  { id: 'pos-002', transactionDate: '2024-11-14', sellingBranch: 'Portland Branch', territory: 'Northwest', catalogNumber: 'PMP-3045', quantity: 10, extendedPrice: 3500 },
  { id: 'pos-003', transactionDate: '2024-11-14', sellingBranch: 'Boise Branch', territory: 'Mountain', catalogNumber: 'VLV-2001', quantity: 15, extendedPrice: 750 },
  { id: 'pos-004', transactionDate: '2024-11-13', sellingBranch: 'Spokane Branch', territory: 'Northwest', catalogNumber: 'FLT-1089', quantity: 50, extendedPrice: 2500 },
  { id: 'pos-005', transactionDate: '2024-11-13', sellingBranch: 'Seattle Branch', territory: 'Northwest', catalogNumber: 'PMP-3045', quantity: 8, extendedPrice: 2800 },
  { id: 'pos-006', transactionDate: '2024-11-12', sellingBranch: 'Portland Branch', territory: 'Northwest', catalogNumber: 'CTL-5567', quantity: 30, extendedPrice: 1800 },
  { id: 'pos-007', transactionDate: '2024-11-12', sellingBranch: 'Boise Branch', territory: 'Mountain', catalogNumber: 'VLV-2002', quantity: 20, extendedPrice: 1200 },
  { id: 'pos-008', transactionDate: '2024-11-11', sellingBranch: 'Seattle Branch', territory: 'Northwest', catalogNumber: 'FLT-1090', quantity: 45, extendedPrice: 2025 },
  { id: 'pos-009', transactionDate: '2024-11-11', sellingBranch: 'Spokane Branch', territory: 'Northwest', catalogNumber: 'PMP-3046', quantity: 12, extendedPrice: 4200 },
  { id: 'pos-010', transactionDate: '2024-11-10', sellingBranch: 'Portland Branch', territory: 'Northwest', catalogNumber: 'CTL-5568', quantity: 35, extendedPrice: 2100 },
  { id: 'pos-011', transactionDate: '2024-11-10', sellingBranch: 'Boise Branch', territory: 'Mountain', catalogNumber: 'VLV-2003', quantity: 18, extendedPrice: 1080 },
  { id: 'pos-012', transactionDate: '2024-11-09', sellingBranch: 'Seattle Branch', territory: 'Northwest', catalogNumber: 'FLT-1091', quantity: 40, extendedPrice: 1800 },
];


// ============================================
// MOCK EXTENDED POS RECORDS (FOR REP DATA GRID)
// ============================================

export const mockExtendedPOSRecords: ExtendedPOSRecord[] = mockPOSRecords.map((r, i) => ({
  ...r,
  manufacturer: ['FlowTech Industries', 'Precision Valve Corp', 'Industrial Flow Systems'][i % 3],
  month: 'November 2024',
  orderType: ['STANDARD', 'DIRECT_SHIP', 'PROJECT', 'LOT'][i % 4],
  sellingBranchZip: ['98101', '97201', '83702', '99201'][i % 4],
  customerZip: ['98102', '97202', '83703', '99202'][i % 4],
  shippingBranch: ['Seattle DC', 'Portland DC', 'Boise DC', 'Spokane DC'][i % 4],
  billTo: ['CUST-' + (1000 + i), 'ACCT-' + (2000 + i)][i % 2],
  uom: ['EA', 'CTN', 'BOX', 'PK'][i % 4],
}));

// ============================================
// HELPER FUNCTIONS FOR RECEIVED DATA / DATA GRID
// ============================================

export function getManufacturerReceivedDataMock(): ManufacturerReceivedDataResult {
  const activeDistributors = mockReceivedDataDistributors.filter(d => d.inviteStatus === 'active');
  const totalRecords = mockReceivedData.reduce((sum, d) => sum + d.recordCount, 0);
  const periods = new Set(mockReceivedData.map(d => d.period));

  return {
    receivedData: mockReceivedData,
    distributors: mockReceivedDataDistributors,
    summary: {
      activeDistributors: activeDistributors.length,
      totalRecords,
      reportingPeriods: periods.size,
    },
  };
}

export function getRepDataGridMock(): RepDataGridResult {
  const records = mockExtendedPOSRecords;
  const manufacturers = mockManufacturerReporting.filter(m => m.status === 'reporting');
  const totalValue = records.reduce((sum, r) => sum + r.extendedPrice, 0);
  const uniqueProducts = new Set(records.map(r => r.catalogNumber)).size;

  return {
    records,
    manufacturers: mockManufacturerReporting,
    summary: {
      totalRecords: records.length,
      totalValue,
      manufacturerCount: manufacturers.length,
      uniqueProducts,
    },
  };
}

// ============================================
// DIRECTORY DATA FOR MANUFACTURERS PAGE (DISTRIBUTOR VIEW)
// ============================================

export type MembershipTier = 'nemra-free' | 'nemra-paid' | 'flowconnect';

export type POSContact = { name: string; email: string; phone: string };

export type ManufacturerDirectoryEntry = {
  id: string;
  name: string;
  domain: string;
  posContacts?: POSContact[];
  membershipTier: MembershipTier;
  orgCount: number;
  category: string;
};

export const flowConnectManufacturerDirectory: ManufacturerDirectoryEntry[] = [
  { id: 'dir-001', name: 'FlowTech Industries', domain: 'flowtech.com', posContacts: [{ name: 'Sarah Chen', email: 'schen@flowtech.com', phone: '(555) 123-4567' }, { name: 'Tom Richards', email: 'trichards@flowtech.com', phone: '(555) 123-4568' }], membershipTier: 'flowconnect', orgCount: 145, category: 'Valves & Controls' },
  { id: 'dir-002', name: 'Precision Valve Corp', domain: 'precisionvalve.com', posContacts: [{ name: 'Mike Johnson', email: 'mjohnson@precisionvalve.com', phone: '(555) 234-5678' }], membershipTier: 'flowconnect', orgCount: 89, category: 'Valves & Controls' },
  { id: 'dir-003', name: 'Industrial Flow Systems', domain: 'industrialflow.com', posContacts: [{ name: 'Jennifer Smith', email: 'jsmith@industrialflow.com', phone: '(555) 345-6789' }, { name: 'Mark Thompson', email: 'mthompson@industrialflow.com', phone: '(555) 345-6790' }, { name: 'Rachel Green', email: 'rgreen@industrialflow.com', phone: '(555) 345-6791' }], membershipTier: 'nemra-paid', orgCount: 234, category: 'Pumps & Systems' },
  { id: 'dir-004', name: 'TechPipe Solutions', domain: 'techpipe.com', posContacts: [{ name: 'David Brown', email: 'dbrown@techpipe.com', phone: '(555) 456-7890' }], membershipTier: 'nemra-free', orgCount: 0, category: 'Pipes & Fittings' },
  { id: 'dir-005', name: 'HydroMax Manufacturing', domain: 'hydromax.com', posContacts: [{ name: 'Lisa Williams', email: 'lwilliams@hydromax.com', phone: '(555) 567-8901' }, { name: 'Kevin Park', email: 'kpark@hydromax.com', phone: '(555) 567-8902' }], membershipTier: 'nemra-paid', orgCount: 178, category: 'Pumps & Systems' },
  { id: 'dir-006', name: 'American Valve Co', domain: 'americanvalve.com', posContacts: [{ name: 'Robert Taylor', email: 'rtaylor@americanvalve.com', phone: '(555) 678-9012' }], membershipTier: 'flowconnect', orgCount: 312, category: 'Valves & Controls' },
  { id: 'dir-007', name: 'Global Fittings Inc', domain: 'globalfittings.com', posContacts: [{ name: 'Amanda Davis', email: 'adavis@globalfittings.com', phone: '(555) 789-0123' }], membershipTier: 'nemra-free', orgCount: 0, category: 'Pipes & Fittings' },
  { id: 'dir-008', name: 'ProFlow Equipment', domain: 'proflowequip.com', posContacts: [{ name: 'Chris Miller', email: 'cmiller@proflowequip.com', phone: '(555) 890-1234' }, { name: 'Diana Ross', email: 'dross@proflowequip.com', phone: '(555) 890-1235' }], membershipTier: 'flowconnect', orgCount: 67, category: 'Equipment & Tools' },
  { id: 'dir-009', name: 'Elite Piping Solutions', domain: 'elitepiping.com', posContacts: [{ name: 'Nicole Anderson', email: 'nanderson@elitepiping.com', phone: '(555) 901-2345' }], membershipTier: 'nemra-paid', orgCount: 156, category: 'Pipes & Fittings' },
  { id: 'dir-010', name: 'WaterWorks Manufacturing', domain: 'waterworksco.com', posContacts: [{ name: 'James Wilson', email: 'jwilson@waterworksco.com', phone: '(555) 012-3456' }], membershipTier: 'nemra-free', orgCount: 0, category: 'Pumps & Systems' },
];

// ============================================
// DIRECTORY DATA FOR DISTRIBUTORS PAGE (MANUFACTURER VIEW)
// ============================================

export type DistributorDirectoryEntry = {
  id: string;
  name: string;
  domain: string;
  posContacts: POSContact[];
  membershipTier: MembershipTier;
  manufacturerCount: number;
  category: string;
};

export type ExtendedDistributorContact = DistributorContact & {
  hasCustomMappings?: boolean;
  lastReceiveDate?: string;
};

export const mockExtendedDistributorContacts: ExtendedDistributorContact[] = [
  { id: 'dc-001', name: 'Acme Distribution', domain: 'acmedist.com', contactEmail: 'pos@acmedist.com', contactFirstName: 'John', contactLastName: 'Smith', inviteStatus: 'active', configuredAt: '2024-05-10T09:00:00Z', lastSendDate: '2024-12-04T10:00:00Z', hasCustomMappings: true, lastReceiveDate: '2024-12-04T10:00:00Z' },
  { id: 'dc-002', name: 'Metro Supply Co', domain: 'metrosupply.com', contactEmail: 'data@metrosupply.com', contactFirstName: 'Lisa', contactLastName: 'Wong', inviteStatus: 'active', configuredAt: '2024-06-20T11:00:00Z', lastSendDate: '2024-12-03T14:00:00Z', hasCustomMappings: false, lastReceiveDate: '2024-12-03T14:00:00Z' },
  { id: 'dc-003', name: 'Pacific Supply Company', domain: 'pacificsupply.com', contactEmail: 'info@pacificsupply.com', contactFirstName: 'Robert', inviteStatus: 'pending', invitedAt: '2024-12-05T08:00:00Z' },
  { id: 'dc-004', name: 'National Electric Supply', domain: 'nationalelectric.com', inviteStatus: 'no_invite' },
  { id: 'dc-005', name: 'Midwest Industrial Supply', domain: 'midwestindustrial.com', inviteStatus: 'no_invite' },
];

export const flowConnectDistributorDirectory: DistributorDirectoryEntry[] = [
  {
    id: 'dir-d001',
    name: 'Pacific Supply Company',
    domain: 'pacificsupply.com',
    posContacts: [
      { name: 'Sarah Mitchell', email: 'smitchell@pacificsupply.com', phone: '(555) 123-4567' },
      { name: 'Tom Williams', email: 'twilliams@pacificsupply.com', phone: '(555) 123-4568' },
    ],
    membershipTier: 'flowconnect',
    manufacturerCount: 45,
    category: 'Full Line Distribution',
  },
  {
    id: 'dir-d002',
    name: 'Midwest Industrial Supply',
    domain: 'midwestindustrial.com',
    posContacts: [
      { name: 'Robert Smith', email: 'rsmith@midwestindustrial.com', phone: '(555) 234-5678' },
    ],
    membershipTier: 'flowconnect',
    manufacturerCount: 32,
    category: 'Industrial Supplies',
  },
  {
    id: 'dir-d003',
    name: 'Southern Equipment Distributors',
    domain: 'southernequip.com',
    posContacts: [
      { name: 'Emily Johnson', email: 'ejohnson@southernequip.com', phone: '(555) 345-6789' },
      { name: 'Mark Davis', email: 'mdavis@southernequip.com', phone: '(555) 345-6790' },
      { name: 'Rachel White', email: 'rwhite@southernequip.com', phone: '(555) 345-6791' },
    ],
    membershipTier: 'nemra-paid',
    manufacturerCount: 67,
    category: 'Equipment & Tools',
  },
  {
    id: 'dir-d004',
    name: 'Eastern Pipeline Corp',
    domain: 'easternpipeline.com',
    posContacts: [
      { name: 'David Brown', email: 'dbrown@easternpipeline.com', phone: '(555) 456-7890' },
    ],
    membershipTier: 'nemra-free',
    manufacturerCount: 0,
    category: 'Pipes & Fittings',
  },
  {
    id: 'dir-d005',
    name: 'Great Lakes Distribution',
    domain: 'greatlakesdist.com',
    posContacts: [
      { name: 'Lisa Anderson', email: 'landerson@greatlakesdist.com', phone: '(555) 567-8901' },
      { name: 'Kevin Park', email: 'kpark@greatlakesdist.com', phone: '(555) 567-8902' },
    ],
    membershipTier: 'nemra-paid',
    manufacturerCount: 54,
    category: 'Full Line Distribution',
  },
  {
    id: 'dir-d006',
    name: 'Western Supply Co',
    domain: 'westernsupply.com',
    posContacts: [
      { name: 'Robert Taylor', email: 'rtaylor@westernsupply.com', phone: '(555) 678-9012' },
    ],
    membershipTier: 'flowconnect',
    manufacturerCount: 89,
    category: 'Full Line Distribution',
  },
  {
    id: 'dir-d007',
    name: 'Central States Wholesale',
    domain: 'centralstateswholesale.com',
    posContacts: [
      { name: 'Amanda Davis', email: 'adavis@centralstateswholesale.com', phone: '(555) 789-0123' },
    ],
    membershipTier: 'nemra-free',
    manufacturerCount: 0,
    category: 'Wholesale Distribution',
  },
  {
    id: 'dir-d008',
    name: 'Northeast Distribution Partners',
    domain: 'nedistpartners.com',
    posContacts: [
      { name: 'Chris Miller', email: 'cmiller@nedistpartners.com', phone: '(555) 890-1234' },
      { name: 'Diana Ross', email: 'dross@nedistpartners.com', phone: '(555) 890-1235' },
    ],
    membershipTier: 'flowconnect',
    manufacturerCount: 41,
    category: 'Industrial Supplies',
  },
  {
    id: 'dir-d009',
    name: 'Sunbelt Industrial',
    domain: 'sunbeltindustrial.com',
    posContacts: [
      { name: 'Nicole Anderson', email: 'nanderson@sunbeltindustrial.com', phone: '(555) 901-2345' },
    ],
    membershipTier: 'nemra-paid',
    manufacturerCount: 38,
    category: 'Industrial Supplies',
  },
  {
    id: 'dir-d010',
    name: 'Mountain West Supply',
    domain: 'mountainwestsupply.com',
    posContacts: [
      { name: 'James Wilson', email: 'jwilson@mountainwestsupply.com', phone: '(555) 012-3456' },
    ],
    membershipTier: 'nemra-free',
    manufacturerCount: 0,
    category: 'Full Line Distribution',
  },
];

// ============================================
// REP FIRMS (MANUFACTURER VIEW)
// ============================================

export type RepFirmStatus = 'active' | 'pending' | 'not_connected';

export type RepFirmForManufacturer = {
  id: string;
  name: string;
  territories: string[];
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
  status: RepFirmStatus;
  connectedAt?: string;
  lastDataSent?: string;
  orgCount?: number;
  hasAgreement?: boolean;
};

export const mockRepFirms: RepFirmForManufacturer[] = [
  { id: 'rf-001', name: 'Northwest Sales Associates', territories: ['WA', 'OR', 'ID'], contactEmail: 'jpark@nwsalesassoc.com', contactName: 'Jennifer Park', contactPhone: '(555) 123-4567', status: 'active', connectedAt: '2024-06-16T14:30:00Z', lastDataSent: '2024-12-05T14:37:00Z', orgCount: 12, hasAgreement: true },
  { id: 'rf-002', name: 'Mountain States Rep Group', territories: ['CO', 'UT', 'WY', 'MT'], contactEmail: 'info@mountainstatesrep.com', contactName: 'Robert Anderson', contactPhone: '(555) 234-5678', status: 'active', connectedAt: '2024-07-02T11:15:00Z', lastDataSent: '2024-12-05T14:37:00Z', orgCount: 8, hasAgreement: true },
  { id: 'rf-003', name: 'Great Lakes Agency', territories: ['MI', 'OH', 'IN'], contactEmail: 'sales@greatlakesagency.com', contactName: 'Emily Thompson', status: 'pending' },
  { id: 'rf-004', name: 'Southeast Industrial Reps', territories: ['FL', 'GA', 'AL', 'SC', 'NC'], contactEmail: 'contact@southeastreps.com', status: 'not_connected' },
  { id: 'rf-005', name: 'Texas Territory Partners', territories: ['TX', 'OK', 'LA'], contactEmail: 'info@texasterritory.com', contactName: 'Michael Davis', status: 'not_connected' },
];

export type RepFirmDirectoryEntry = {
  id: string;
  name: string;
  territories: string[];
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  manufacturerCount: number;
  membershipTier: 'nemra' | 'flowconnect';
};

export const flowConnectRepDirectory: RepFirmDirectoryEntry[] = [
  { id: 'dir-r001', name: 'Northwest Sales Associates', territories: ['WA', 'OR', 'ID'], contactEmail: 'jpark@nwsalesassoc.com', contactName: 'Jennifer Park', contactPhone: '(555) 123-4567', manufacturerCount: 15, membershipTier: 'flowconnect' },
  { id: 'dir-r002', name: 'Mountain States Rep Group', territories: ['CO', 'UT', 'WY', 'MT'], contactEmail: 'info@mountainstatesrep.com', contactName: 'Robert Anderson', contactPhone: '(555) 234-5678', manufacturerCount: 22, membershipTier: 'flowconnect' },
  { id: 'dir-r003', name: 'Great Lakes Agency', territories: ['MI', 'OH', 'IN'], contactEmail: 'sales@greatlakesagency.com', contactName: 'Emily Thompson', contactPhone: '(555) 345-6789', manufacturerCount: 18, membershipTier: 'nemra' },
  { id: 'dir-r004', name: 'Southeast Industrial Reps', territories: ['FL', 'GA', 'AL', 'SC', 'NC'], contactEmail: 'contact@southeastreps.com', contactName: 'David Wilson', contactPhone: '(555) 456-7890', manufacturerCount: 25, membershipTier: 'flowconnect' },
  { id: 'dir-r005', name: 'Texas Territory Partners', territories: ['TX', 'OK', 'LA'], contactEmail: 'info@texasterritory.com', contactName: 'Michael Davis', contactPhone: '(555) 567-8901', manufacturerCount: 30, membershipTier: 'flowconnect' },
  { id: 'dir-r006', name: 'New England Sales Agency', territories: ['MA', 'CT', 'RI', 'NH', 'VT', 'ME'], contactEmail: 'info@nesalesagency.com', contactName: 'Sarah Johnson', contactPhone: '(555) 678-9012', manufacturerCount: 20, membershipTier: 'nemra' },
  { id: 'dir-r007', name: 'Pacific Coast Representatives', territories: ['CA', 'NV', 'AZ'], contactEmail: 'sales@pacificcoastreps.com', contactName: 'James Miller', contactPhone: '(555) 789-0123', manufacturerCount: 35, membershipTier: 'flowconnect' },
  { id: 'dir-r008', name: 'Midwest Industrial Group', territories: ['IL', 'WI', 'MN', 'IA'], contactEmail: 'contact@midwestindustrial.com', contactName: 'Lisa Brown', contactPhone: '(555) 890-1234', manufacturerCount: 28, membershipTier: 'flowconnect' },
];

// Rep firm colors for map visualization
export const repFirmColors: Record<string, string> = {
  'rf-001': '#3b82f6', // blue
  'rf-002': '#10b981', // green
  'rf-003': '#f59e0b', // amber
  'rf-004': '#8b5cf6', // purple
  'rf-005': '#ef4444', // red
};

// ============================================
// REP MANUFACTURERS (REP VIEW)
// ============================================



export type ManufacturerDirectoryForRep = {
  id: string;
  name: string;
  domain: string;
  posContacts: POSContact[];
  membershipTier: MembershipTier;
  repCount: number;
  category: string;
  territories?: string[];
};

export const flowConnectManufacturerDirectoryForRep: ManufacturerDirectoryForRep[] = [
  { id: 'dir-m001', name: 'FlowTech Industries', domain: 'flowtech.com', posContacts: [{ name: 'Sarah Chen', email: 'schen@flowtech.com', phone: '(555) 123-4567' }], membershipTier: 'flowconnect', repCount: 12, category: 'Valves & Controls', territories: ['WA', 'OR', 'ID', 'MT'] },
  { id: 'dir-m002', name: 'Precision Valve Corp', domain: 'precisionvalve.com', posContacts: [{ name: 'Mike Johnson', email: 'mjohnson@precisionvalve.com', phone: '(555) 234-5678' }], membershipTier: 'flowconnect', repCount: 8, category: 'Valves & Controls', territories: ['WA', 'OR'] },
  { id: 'dir-m003', name: 'Industrial Flow Systems', domain: 'industrialflow.com', posContacts: [{ name: 'Jennifer Smith', email: 'jsmith@industrialflow.com', phone: '(555) 345-6789' }], membershipTier: 'nemra-paid', repCount: 15, category: 'Pumps & Systems' },
  { id: 'dir-m004', name: 'TechPipe Solutions', domain: 'techpipe.com', posContacts: [{ name: 'David Brown', email: 'dbrown@techpipe.com', phone: '(555) 456-7890' }], membershipTier: 'nemra-free', repCount: 3, category: 'Pipes & Fittings' },
  { id: 'dir-m005', name: 'HydroMax Manufacturing', domain: 'hydromax.com', posContacts: [{ name: 'Lisa Williams', email: 'lwilliams@hydromax.com', phone: '(555) 567-8901' }], membershipTier: 'nemra-paid', repCount: 10, category: 'Pumps & Systems' },
];

// ============================================
// REP DISTRIBUTORS (REP VIEW)
// ============================================

export type RepDistributorStatus = 'on_flowconnect' | 'invited' | 'not_invited';

export type RepDistributorContact = {
  id: string;
  name: string;
  domain: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  status: RepDistributorStatus;
  invitedAt?: string;
  connectedManufacturers?: number;
  totalManufacturers?: number;
};

export const mockRepDistributorContacts: RepDistributorContact[] = [
  { id: 'rd-001', name: 'Acme Distribution', domain: 'acmedist.com', contactEmail: 'pos@acmedist.com', contactFirstName: 'John', contactLastName: 'Smith', status: 'on_flowconnect', connectedManufacturers: 2, totalManufacturers: 45 },
  { id: 'rd-002', name: 'Metro Supply Co', domain: 'metrosupply.com', contactEmail: 'data@metrosupply.com', contactFirstName: 'Lisa', contactLastName: 'Wong', status: 'on_flowconnect', connectedManufacturers: 1, totalManufacturers: 32 },
  { id: 'rd-003', name: 'Pacific Supply Company', domain: 'pacificsupply.com', contactEmail: 'info@pacificsupply.com', contactFirstName: 'Robert', status: 'invited', invitedAt: '2024-12-05T08:00:00Z' },
  { id: 'rd-004', name: 'National Electric Supply', domain: 'nationalelectric.com', status: 'not_invited' },
  { id: 'rd-005', name: 'Midwest Industrial Supply', domain: 'midwestindustrial.com', status: 'not_invited' },
];

// ============================================
// FIELD VISIBILITY (REP VIEW)
// ============================================

export type POSField = {
  fieldName: string;
  fieldLabel: string;
  section: string;
};

export const allPOSFields: POSField[] = [
  { fieldName: 'transactionDate', fieldLabel: 'Transaction Date', section: 'Transaction' },
  { fieldName: 'orderType', fieldLabel: 'Order Type', section: 'Transaction' },
  { fieldName: 'sellingBranchNumber', fieldLabel: 'Selling Branch #', section: 'Selling Branch' },
  { fieldName: 'sellingBranchZip', fieldLabel: 'Selling Branch Zip', section: 'Selling Branch' },
  { fieldName: 'customerZip', fieldLabel: 'Customer Zip', section: 'Territory' },
  { fieldName: 'catalogNumber', fieldLabel: 'Catalog Number', section: 'Product' },
  { fieldName: 'quantity', fieldLabel: 'Quantity', section: 'Pricing' },
  { fieldName: 'unitCost', fieldLabel: 'Unit Cost', section: 'Pricing' },
  { fieldName: 'extendedPrice', fieldLabel: 'Extended Price', section: 'Pricing' },
];

export type ManufacturerFieldVisibility = {
  manufacturerId: string;
  manufacturerName: string;
  hiddenFields: string[];
};

export type DistributorFieldVisibility = {
  distributorId: string;
  distributorName: string;
  manufacturerId: string;
  hiddenFromRep: string[];
};

export const mockManufacturerFieldVisibility: ManufacturerFieldVisibility[] = [
  { manufacturerId: 'rm-001', manufacturerName: 'FlowTech Industries', hiddenFields: [] },
  { manufacturerId: 'rm-002', manufacturerName: 'Precision Valve Corp', hiddenFields: ['unitCost', 'orderType'] },
];

export const mockDistributorFieldVisibility: DistributorFieldVisibility[] = [
  { distributorId: 'rd-001', distributorName: 'Acme Distribution', manufacturerId: 'rm-002', hiddenFromRep: ['sellingBranchNumber'] },
  { distributorId: 'rd-002', distributorName: 'Metro Supply Co', manufacturerId: 'rm-002', hiddenFromRep: [] },
];
// SEND PAGE DATA - Rep Firms & Data Sources
// ============================================

export type RepFirmSend = {
  id: string;
  name: string;
  territory: string;
  status: 'active' | 'pending' | 'expired';
  lastSendDate?: string;
};

export const mockRepFirmSends: RepFirmSend[] = [
  { id: 'rep-001', name: 'Western Region Reps', territory: 'West', status: 'active', lastSendDate: '2024-12-05T14:35:00Z' },
  { id: 'rep-002', name: 'Mountain States Agency', territory: 'Mountain', status: 'active', lastSendDate: '2024-12-05T14:35:00Z' },
  { id: 'rep-003', name: 'Pacific Northwest Sales', territory: 'Pacific NW', status: 'active', lastSendDate: '2024-12-04T10:00:00Z' },
  { id: 'rep-004', name: 'Southwest Electrical Reps', territory: 'Southwest', status: 'active', lastSendDate: '2024-12-04T10:00:00Z' },
  { id: 'rep-005', name: 'Midwest Industrial Sales', territory: 'Midwest', status: 'pending' },
];

export type DataSource = {
  id: string;
  type: 'erp' | 'file' | 'api' | 'sftp';
  name: string;
  status: 'active' | 'error' | 'pending';
  lastSync?: string;
  recordCount?: number;
  period?: string;
};

export const mockDataSources: DataSource[] = [
  { id: 'ds-001', type: 'erp', name: 'SAP ERP Integration', status: 'active', lastSync: '2024-12-28T08:00:00Z', recordCount: 15234, period: 'December 2024' },
  { id: 'ds-002', type: 'file', name: 'Manual Upload', status: 'active', lastSync: '2024-12-27T14:30:00Z', recordCount: 3456, period: 'December 2024' },
  { id: 'ds-003', type: 'api', name: 'NetSuite API', status: 'pending' },
];
