// ============================================
// RE-EXPORTS FROM ORGANIZATIONS SDK
// ============================================

// Organization-level queries and mutations are now in organizationsGqlSdk.ts
export {
  createOrganization,
  searchOrganizations,
  createOrganizationConnection,
  inviteConnection,
  uploadAgreement,
  type PosContactInput,
  type ManufacturerInput,
  type ConnectionStatus,
  type AgreementResponse,
  type OrganizationLiteResponse,
  type ManufacturerContact,
  type ManufacturerDirectoryEntry,
  type MembershipTier,
  type POSContact,
} from './organizationsGqlSdk';

import { safeRequest } from './graphql';
import { type FieldDefinition, type CustomField } from './nemra-pos-data';

export type Send = {
  id: string;
  date: string;
  period: string;
  recordCount: number;
  manufacturers: string[];
  status: 'sent' | 'partial' | 'failed';
};

export type GetDistributorStatsResult = {
  distributorStats: {
    totalSends: number;
    totalManufacturers: number;
    recentSends: Send[];
  };
};

const GetDistributorStatsQuery = `
query GetDistributorStats {
  distributorStats {
    totalSends
    totalManufacturers
    recentSends {
      id
      date
      period
      recordCount
      manufacturers
      status
    }
  }
}
`;

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

export type PendingManufacturer = { id: string; name: string; invitedAt?: string; status: 'pending' | 'expired' | 'active' };

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

export type GetDistributorDashboardResult = {
  distributorStats: {
    totalSends: number;
    totalManufacturers: number;
    recentSends: Send[];
  };
  manufacturers: PendingManufacturer[];
  actionIssues: ActionIssue[];
  messages: Message[];
};

const GetDistributorDashboardQuery = `
query GetDistributorDashboard {
  distributorStats {
    totalSends
    totalManufacturers
    recentSends {
      id
      date
      period
      recordCount
      manufacturers
      status
    }
  }

  manufacturers {
    id
    name
    inviteStatus
  }

  actionIssues {
    id
    severity
    title
    description
    context {
      fileName
      period
      manufacturer
      affectedRows
    }
    linkTo
  }

  messages {
    id
    from
    fromType
    companyName
    subject
    preview
    receivedAt
    read
    fileRef
  }
}
`;

export async function getDistributorStats(token?: string) {
  const data = await safeRequest<GetDistributorStatsResult>(GetDistributorStatsQuery, undefined, token);
  return data.distributorStats;
}

import { mockDataSends, mockManufacturerContacts, mockPendingManufacturers, mockActionIssues, mockMessages } from './nemra-pos-data';

export async function getDistributorDashboard(token?: string) {
  try {
    const data = await safeRequest<GetDistributorDashboardResult>(GetDistributorDashboardQuery, undefined, token);
    return data;
  } catch (e) {
    // Fallback - if safeRequest throws because no GraphQL URL, emulate expected shape
    console.warn('getDistributorDashboard falling back to mocks', e);
    return {
      distributorStats: {
        totalSends: 6,
        totalManufacturers: 12,
        recentSends: mockDataSends,
      },
      manufacturers: mockManufacturerContacts.map((m: typeof mockManufacturerContacts[number]) => ({ id: m.id, name: m.name, status: m.inviteStatus ?? 'active' })),
      actionIssues: mockActionIssues as ActionIssue[],
      messages: mockMessages as Message[],
    } as GetDistributorDashboardResult;
  }
}

// Manufacturer dashboard
export type GetManufacturerDashboardResult = {
  distributors: {
    id: string;
    name: string;
    status: 'active' | 'forwarding' | 'inactive' | 'pending';
    recordCount?: number;
    lastReceived?: string;
  }[];
  repFirms: {
    id: string;
    name: string;
    status: 'active' | 'pending' | 'inactive';
  }[];
  lotOrders: {
    id: string;
    distributor: string;
    orderNumber: string;
    orderType: 'direct_ship' | 'project';
    productInfo: string;
    value: number;
    submittedAt: string;
  }[];
  pendingDistributors: {
    id: string;
    name: string;
    requestedAt: string;
    status: 'pending' | 'expired';
  }[];
  pendingRepFirms: {
    id: string;
    name: string;
    territories: string[];
    requestedAt: string;
    status: 'pending' | 'awaiting_data';
  }[];
  actionIssues: ActionIssue[];
  messages: Message[];
};

const GetManufacturerDashboardQuery = `
query GetManufacturerDashboard {
  distributors {
    id
    name
    status
    recordCount
    lastReceived
  }

  repFirms {
    id
    name
    status
  }

  lotOrders {
    id
    distributor
    orderNumber
    orderType
    productInfo
    value
    submittedAt
  }

  pendingDistributors {
    id
    name
    requestedAt
    status
  }

  pendingRepFirms {
    id
    name
    territories
    requestedAt
    status
  }

  actionIssues {
    id
    severity
    title
    description
    context {
      fileName
      period
      manufacturer
      affectedRows
    }
    linkTo
  }

  messages {
    id
    from
    fromType
    companyName
    subject
    preview
    receivedAt
    read
    fileRef
  }
}
`;

import { mockDistributorSources, mockRepFirmContacts, mockLotOrders, mockPendingDistributors, mockPendingRepFirms } from './nemra-pos-data';

export async function getManufacturerDashboard(token?: string) {
  try {
    const data = await safeRequest<GetManufacturerDashboardResult>(GetManufacturerDashboardQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getManufacturerDashboard falling back to mocks', e);
    return {
      distributors: mockDistributorSources,
      repFirms: mockRepFirmContacts.map(rf => ({
        id: rf.id,
        name: rf.name,
        status: rf.inviteStatus === 'no_invite' ? 'inactive' : rf.inviteStatus === 'expired' ? 'inactive' : rf.inviteStatus as 'active' | 'pending' | 'inactive',
      })),
      lotOrders: mockLotOrders,
      pendingDistributors: mockPendingDistributors,
      pendingRepFirms: mockPendingRepFirms,
      actionIssues: mockActionIssues as ActionIssue[],
      messages: mockMessages as Message[],
    } as GetManufacturerDashboardResult;
  }
}

// Rep dashboard
export type GetRepDashboardResult = {
  stats: {
    totalRecords: number;
    totalAmount: number;
  };
  manufacturers: {
    id: string;
    name: string;
    status: 'reporting' | 'not_reporting';
    monthsReported: { month: string; receivedAt: string; recordCount: number }[];
  }[];
  actionItems: {
    id: string;
    severity: 'blocking' | 'warning' | 'info';
    title: string;
    description: string;
    context: { manufacturer?: string; distributor?: string; month?: string; daysOverdue?: number };
    actionLabel: string;
    linkTo: string;
  }[];
  messages: {
    id: string;
    from: string;
    fromType: 'manufacturer' | 'distributor';
    companyName: string;
    subject: string;
    preview: string;
    receivedAt: string;
    read: boolean;
    fileRef?: string;
  }[];
  pendingConnections: {
    id: string;
    name: string;
    type: 'manufacturer' | 'distributor';
    requestedAt: string;
    status: 'pending' | 'expired';
  }[];
};

const GetRepDashboardQuery = `
query GetRepDashboard {
  stats {
    totalRecords
    totalAmount
  }

  manufacturers {
    id
    name
    status
    monthsReported {
      month
      receivedAt
      recordCount
    }
  }

  actionItems {
    id
    severity
    title
    description
    context {
      manufacturer
      distributor
      month
      daysOverdue
    }
    actionLabel
    linkTo
  }

  messages {
    id
    from
    fromType
    companyName
    subject
    preview
    receivedAt
    read
    fileRef
  }

  pendingConnections {
    id
    name
    type
    requestedAt
    status
  }
}
`;

import { mockManufacturerReporting, mockRepActionItems, mockPendingConnections, mockMessages as rawMockMessages, mockRepManufacturerContacts } from './nemra-pos-data';

export async function getRepDashboard(token?: string) {
  try {
    const data = await safeRequest<GetRepDashboardResult>(GetRepDashboardQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getRepDashboard falling back to mocks', e);
    const messages = rawMockMessages.map((m) => ({
      ...m,
      fromType: m.fromType === 'rep' ? 'distributor' : (m.fromType as 'manufacturer' | 'distributor'),
    })) as GetRepDashboardResult['messages'];

    return {
      stats: {
        totalRecords: mockManufacturerReporting.reduce((sum, m) => sum + m.monthsReported.reduce((s, mo) => s + mo.recordCount, 0), 0),
        totalAmount: Math.round(mockManufacturerReporting.reduce((sum, m) => sum + m.monthsReported.reduce((s, mo) => s + mo.recordCount, 0), 0) * 12.5),
      },
      manufacturers: mockManufacturerReporting.map((m) => ({ id: m.id, name: m.name, status: m.status, monthsReported: m.monthsReported })),
      actionItems: mockRepActionItems as GetRepDashboardResult['actionItems'],
      messages,
      pendingConnections: mockPendingConnections,
    } as GetRepDashboardResult;
  }
}

// Rep Field Mapping Types
export type RepSystemField = {
  value: string;
  label: string;
};

export type SectionConfig = {
  title: string;
  description: string;
  order: number;
};

export type GetRepFieldMappingResult = {
  manufacturers: Array<{ id: string; name: string; status: 'active' | 'pending' | 'expired' }>;
  posFieldDefinitions: FieldDefinition[];
  potFieldDefinitions: FieldDefinition[];
  posSectionConfig: Record<string, SectionConfig>;
  potSectionConfig: Record<string, SectionConfig>;
  fieldReceiptStatus: Record<string, any>;
  repSystemFields: RepSystemField[];
  customFields: CustomField[];
};

const GetRepFieldMappingQuery = `
query GetRepFieldMapping {
  manufacturers {
    id
    name
    status
  }

  posFieldDefinitions {
    apiName
    name
    section
    requirement
    groupId
    isPreferred
    description
  }

  potFieldDefinitions {
    apiName
    name
    section
    requirement
    groupId
    isPreferred
    description
  }

  posSectionConfig {
    transaction { title, description, order }
    selling_branch { title, description, order }
    territory { title, description, order }
    shipping_branch { title, description, order }
    bill_to { title, description, order }
    product_id { title, description, order }
    quantity_pricing { title, description, order }
  }

  potSectionConfig {
    transaction { title, description, order }
    transfer_branch { title, description, order }
    selling_branch { title, description, order }
    bill_to { title, description, order }
    product_id { title, description, order }
    quantity_cost { title, description, order }
  }

  fieldReceiptStatus {
    apiName
    isMapped
    isVisibleToRep
    hiddenBy
    repMapping
  }

  repSystemFields {
    value
    label
  }

  customFields {
    name
    source
    description
    repMapping
  }
}
`;

export async function getRepFieldMapping(token?: string) {
  try {
    const data = await safeRequest<GetRepFieldMappingResult>(GetRepFieldMappingQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getRepFieldMapping falling back to mocks', e);
    const { mockRepManufacturerContacts, mockPosFieldDefinitions, mockPotFieldDefinitions, mockPosSectionConfig, mockPotSectionConfig, mockFieldReceiptStatus, mockRepSystemFields, mockCustomFields } = await import('./nemra-pos-data');

    return {
      manufacturers: mockRepManufacturerContacts.filter((m) => m.status === 'active'),
      posFieldDefinitions: mockPosFieldDefinitions,
      potFieldDefinitions: mockPotFieldDefinitions,
      posSectionConfig: mockPosSectionConfig,
      potSectionConfig: mockPotSectionConfig,
      fieldReceiptStatus: mockFieldReceiptStatus,
      repSystemFields: mockRepSystemFields,
      customFields: mockCustomFields,
    } as GetRepFieldMappingResult;
  }
}

// ============================================
// SEND METHOD CONFIG
// ============================================

export type { SendMethodConfig, SendMethodType, ApiCredentials, SftpConfig, EmailConfig } from './nemra-pos-data';

import type { SendMethodConfig } from './nemra-pos-data';

export async function getDistributorSendMethodConfig(_token?: string): Promise<SendMethodConfig> {
  const { mockDistributorSendMethodConfig } = await import('./nemra-pos-data');
  return mockDistributorSendMethodConfig;
}

export async function getManufacturerSendMethodConfig(_token?: string): Promise<SendMethodConfig> {
  const { mockManufacturerSendMethodConfig } = await import('./nemra-pos-data');
  return mockManufacturerSendMethodConfig;
}

// ============================================
// DATA INTAKE METHOD CONFIG
// ============================================

export type { DataIntakeMethodConfig, DataIntakeMethodType } from './nemra-pos-data';

import type { DataIntakeMethodConfig } from './nemra-pos-data';

const GetDataIntakeConfigQuery = `
query GetDataIntakeConfig($role: String!) {
  dataIntakeConfig(role: $role) {
    role
    activeMethod
    flowRms {
      hasInstance
      instanceUrl
    }
    api {
      credentials {
        baseUrl
        apiKey
      }
      endpoints {
        method
        path
        description
      }
      quickStartExamples {
        title
        code
      }
      rateLimit
      pagination
    }
    sftp {
      host
      directory
      schedule
    }
    file {
      description
      downloadPageUrl
    }
    email {
      deliveryAddress
      schedule
    }
    entityLabel
  }
}
`;

export async function getDataIntakeConfig(role: 'manufacturer' | 'rep', token?: string): Promise<DataIntakeMethodConfig> {
  try {
    const data = await safeRequest<{ dataIntakeConfig: DataIntakeMethodConfig }>(GetDataIntakeConfigQuery, { role }, token);
    return data.dataIntakeConfig;
  } catch (e) {
    console.warn(`getDataIntakeConfig(${role}) falling back to mocks`, e);
    const { mockManufacturerDataIntakeConfig, mockRepDataIntakeConfig } = await import('./nemra-pos-data');
    return role === 'manufacturer' ? mockManufacturerDataIntakeConfig : mockRepDataIntakeConfig;
  }
}

// ============================================
// MANUFACTURER RECEIVED DATA
// ============================================

export type { ManufacturerReceivedDataResult, ReceivedDataFile, DistributorContact } from './nemra-pos-data';

import type { ManufacturerReceivedDataResult } from './nemra-pos-data';

const GetManufacturerReceivedDataQuery = `
query GetManufacturerReceivedData($period: String) {
  manufacturerReceivedData(period: $period) {
    receivedData {
      id
      distributorId
      distributorName
      period
      receivedAt
      recordCount
      status
      fileSize
    }
    distributors {
      id
      name
      inviteStatus
      email
      lastSent
    }
    summary {
      activeDistributors
      totalRecords
      reportingPeriods
    }
  }
}
`;

export async function getManufacturerReceivedData(period?: string, token?: string): Promise<ManufacturerReceivedDataResult> {
  try {
    const data = await safeRequest<{ manufacturerReceivedData: ManufacturerReceivedDataResult }>(
      GetManufacturerReceivedDataQuery,
      { period },
      token
    );
    return data.manufacturerReceivedData;
  } catch (e) {
    console.warn('getManufacturerReceivedData falling back to mocks', e);
    const { getManufacturerReceivedDataMock } = await import('./nemra-pos-data');
    const mockData = getManufacturerReceivedDataMock();

    // Filter by period if specified
    if (period && period !== 'all') {
      mockData.receivedData = mockData.receivedData.filter(d => d.period === period);
      mockData.summary.totalRecords = mockData.receivedData.reduce((sum, d) => sum + d.recordCount, 0);
    }

    return mockData;
  }
}

// ============================================
// REP DATA GRID
// ============================================

export type { RepDataGridResult, ExtendedPOSRecord, ManufacturerReporting } from './nemra-pos-data';

import type { RepDataGridResult } from './nemra-pos-data';

const GetRepDataGridQuery = `
query GetRepDataGrid($manufacturer: String, $month: String, $search: String, $page: Int, $pageSize: Int) {
  repDataGrid(manufacturer: $manufacturer, month: $month, search: $search, page: $page, pageSize: $pageSize) {
    records {
      id
      transactionDate
      manufacturer
      month
      orderType
      sellingBranch
      sellingBranchZip
      customerZip
      shippingBranch
      billTo
      territory
      catalogNumber
      uom
      quantity
      extendedPrice
    }
    manufacturers {
      id
      name
      status
      monthsReported {
        month
        receivedAt
        recordCount
      }
    }
    summary {
      totalRecords
      totalValue
      manufacturerCount
      uniqueProducts
    }
  }
}
`;

export async function getRepDataGrid(
  filters?: { manufacturer?: string; month?: string; search?: string; page?: number; pageSize?: number },
  token?: string
): Promise<RepDataGridResult> {
  try {
    const data = await safeRequest<{ repDataGrid: RepDataGridResult }>(
      GetRepDataGridQuery,
      filters,
      token
    );
    return data.repDataGrid;
  } catch (e) {
    console.warn('getRepDataGrid falling back to mocks', e);
    const { getRepDataGridMock, mockExtendedPOSRecords, mockManufacturerReporting } = await import('./nemra-pos-data');
    const mockData = getRepDataGridMock();

    // Apply filters client-side for mock data
    let filteredRecords = [...mockExtendedPOSRecords];

    if (filters?.manufacturer && filters.manufacturer !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.manufacturer === filters.manufacturer);
    }

    if (filters?.month && filters.month !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.month === filters.month);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredRecords = filteredRecords.filter(r =>
        r.catalogNumber.toLowerCase().includes(searchLower) ||
        r.sellingBranch.toLowerCase().includes(searchLower) ||
        r.manufacturer.toLowerCase().includes(searchLower)
      );
    }

    const totalValue = filteredRecords.reduce((sum, r) => sum + r.extendedPrice, 0);
    const uniqueProducts = new Set(filteredRecords.map(r => r.catalogNumber)).size;
    const manufacturers = mockManufacturerReporting.filter(m => m.status === 'reporting');

    return {
      records: filteredRecords,
      manufacturers: mockManufacturerReporting,
      summary: {
        totalRecords: filteredRecords.length,
        totalValue,
        manufacturerCount: manufacturers.length,
        uniqueProducts,
      },
    };
  }
}

// ============================================
// DISTRIBUTOR MANUFACTURERS PAGE
// ============================================

import type { ManufacturerContact, ManufacturerDirectoryEntry, POSContact } from './nemra-pos-data';

export type GetDistributorManufacturersResult = {
  manufacturerContacts: ManufacturerContact[];
  manufacturerDirectory: ManufacturerDirectoryEntry[];
};

const GetDistributorManufacturersQuery = `
query GetDistributorManufacturers {
  manufacturerContacts {
    id
    name
    domain
    contactEmail
    contactFirstName
    contactLastName
    inviteStatus
    configuredAt
    lastSendDate
    invitedAt
    hasCustomMappings
  }

  manufacturerDirectory {
    id
    name
    domain
    posContacts {
      name
      email
      phone
    }
    membershipTier
    orgCount
    category
  }
}
`;

export async function getDistributorManufacturers(token?: string): Promise<GetDistributorManufacturersResult> {
  try {
    const data = await safeRequest<GetDistributorManufacturersResult>(GetDistributorManufacturersQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getDistributorManufacturers falling back to mocks', e);
    const { mockManufacturerContacts, flowConnectManufacturerDirectory } = await import('./nemra-pos-data');
    return {
      manufacturerContacts: mockManufacturerContacts,
      manufacturerDirectory: flowConnectManufacturerDirectory,
    };
  }
}

// ============================================
// REP MANUFACTURERS PAGE
// ============================================

export type { RepManufacturerContact, ManufacturerDirectoryForRep } from './nemra-pos-data';

import type { RepManufacturerContact, ManufacturerDirectoryForRep } from './nemra-pos-data';

export type GetRepManufacturersResult = {
  manufacturerContacts: RepManufacturerContact[];
  manufacturerDirectory: ManufacturerDirectoryForRep[];
};

const GetRepManufacturersQuery = `
query GetRepManufacturers {
  manufacturerContacts {
    id
    name
    domain
    contactEmail
    contactFirstName
    contactLastName
    status
    lastReportedDate
    configuredAt
    dataVisibility
    territories
    hasDataAgreement
  }

  manufacturerDirectory {
    id
    name
    domain
    posContacts {
      name
      email
      phone
    }
    membershipTier
    repCount
    category
    territories
  }
}
`;

export async function getRepManufacturers(token?: string): Promise<GetRepManufacturersResult> {
  try {
    const data = await safeRequest<GetRepManufacturersResult>(GetRepManufacturersQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getRepManufacturers falling back to mocks', e);
    const { mockRepManufacturerContacts, flowConnectManufacturerDirectoryForRep } = await import('./nemra-pos-data');
    return {
      manufacturerContacts: mockRepManufacturerContacts,
      manufacturerDirectory: flowConnectManufacturerDirectoryForRep,
    };
  }
}

// ============================================
// REP DISTRIBUTORS PAGE
// ============================================

export type { RepDistributorContact, RepDistributorStatus } from './nemra-pos-data';

import type { RepDistributorContact } from './nemra-pos-data';

export type DistributorDirectoryEntry = {
  id: string;
  name: string;
  domain: string;
  posContacts: { name: string; email: string; phone: string }[];
  membershipTier: 'nemra-free' | 'nemra-paid' | 'flowconnect';
  manufacturerCount: number;
  category: string;
};

export type GetRepDistributorsResult = {
  distributorContacts: RepDistributorContact[];
  distributorDirectory: DistributorDirectoryEntry[];
};

const GetRepDistributorsQuery = `
query GetRepDistributors {
  distributorContacts {
    id
    name
    domain
    contactEmail
    contactFirstName
    contactLastName
    status
    invitedAt
    connectedManufacturers
    totalManufacturers
  }

  distributorDirectory {
    id
    name
    domain
    posContacts {
      name
      email
      phone
    }
    membershipTier
    manufacturerCount
    category
  }
}
`;

export async function getRepDistributors(token?: string): Promise<GetRepDistributorsResult> {
  try {
    const data = await safeRequest<GetRepDistributorsResult>(GetRepDistributorsQuery, undefined, token);
    return data;
  } catch (e) {
    console.warn('getRepDistributors falling back to mocks', e);
    const { mockRepDistributorContacts, flowConnectDistributorDirectory } = await import('./nemra-pos-data');
    return {
      distributorContacts: mockRepDistributorContacts,
      distributorDirectory: flowConnectDistributorDirectory,
    };
  }
}