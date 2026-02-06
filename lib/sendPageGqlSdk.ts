import { requestGraphQL } from './graphqlClient';
import {
  mockRepFirmSends,
  mockDataSources,
  mockManufacturerContacts,
  type RepFirmSend,
  type DataSource,
  type ManufacturerContact,
} from './nemra-pos-data';

// ============================================
// Types
// ============================================

export type ManufacturerSendPageData = {
  repFirms: RepFirmSend[];
  dataSources: DataSource[];
};

export type DistributorSendPageData = {
  manufacturers: ManufacturerContact[];
  dataSources: DataSource[];
};

// ============================================
// GraphQL Queries
// ============================================

const GetManufacturerSendDataQuery = `
  query GetManufacturerSendData {
    repFirms {
      id
      name
      territory
      status
      lastSendDate
    }
    dataSources {
      id
      type
      name
      status
      lastSync
      recordCount
      period
    }
  }
`;

const GetDistributorSendDataQuery = `
  query GetDistributorSendData {
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
      hasCustomMappings
    }
    dataSources {
      id
      type
      name
      status
      lastSync
      recordCount
      period
    }
  }
`;

// ============================================
// Fetch Functions
// ============================================

export async function fetchManufacturerSendData(
  token?: string
): Promise<ManufacturerSendPageData> {
  try {
    const result = await requestGraphQL<ManufacturerSendPageData>(
      GetManufacturerSendDataQuery,
      {},
      token
    );
    return result;
  } catch (error) {
    console.warn('Failed to fetch manufacturer send data from GraphQL, using mock data:', error);
    return {
      repFirms: mockRepFirmSends,
      dataSources: mockDataSources,
    };
  }
}

export async function fetchDistributorSendData(
  token?: string
): Promise<DistributorSendPageData> {
  try {
    const result = await requestGraphQL<DistributorSendPageData>(
      GetDistributorSendDataQuery,
      {},
      token
    );
    return result;
  } catch (error) {
    console.warn('Failed to fetch distributor send data from GraphQL, using mock data:', error);
    return {
      manufacturers: mockManufacturerContacts,
      dataSources: mockDataSources,
    };
  }
}
