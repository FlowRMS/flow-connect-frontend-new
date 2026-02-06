import { safeRequest } from '../graphql';
import type { ExtendedDistributorContact, DistributorDirectoryEntry } from '../nemra-pos-data';
import { mockExtendedDistributorContacts, flowConnectDistributorDirectory } from '../nemra-pos-data';

// ============================================
// TYPES
// ============================================

export type ManufacturerDistributorsResult = {
  distributors: ExtendedDistributorContact[];
};

export type DistributorDirectoryResult = {
  distributorDirectory: DistributorDirectoryEntry[];
};

export type SendInviteResult = {
  sendDistributorInvite: {
    success: boolean;
    message: string;
    distributorId: string;
  };
};

export type AddDistributorResult = {
  addDistributor: {
    success: boolean;
    message: string;
    distributor: ExtendedDistributorContact;
  };
};

// ============================================
// QUERIES
// ============================================

const GetManufacturerDistributorsQuery = `
query GetManufacturerDistributors {
  distributors {
    id
    name
    domain
    contactEmail
    contactFirstName
    contactLastName
    inviteStatus
    invitedAt
    configuredAt
    lastSendDate
    hasCustomMappings
    lastReceiveDate
  }
}
`;

const GetDistributorDirectoryQuery = `
query GetDistributorDirectory {
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

// ============================================
// MUTATIONS
// ============================================

const SendDistributorInviteMutation = `
mutation SendDistributorInvite($distributorId: ID!) {
  sendDistributorInvite(distributorId: $distributorId) {
    success
    message
    distributorId
  }
}
`;

const AddDistributorMutation = `
mutation AddDistributor($input: AddDistributorInput!) {
  addDistributor(input: $input) {
    success
    message
    distributor {
      id
      name
      domain
      contactEmail
      contactFirstName
      contactLastName
      inviteStatus
    }
  }
}
`;

const UploadDistributorListMutation = `
mutation UploadDistributorList($file: Upload!) {
  uploadDistributorList(file: $file) {
    success
    message
    addedCount
    skippedCount
  }
}
`;

// ============================================
// SDK FUNCTIONS
// ============================================

export async function getManufacturerDistributors(): Promise<ManufacturerDistributorsResult | null> {
  try {
    const result = await safeRequest<ManufacturerDistributorsResult>(GetManufacturerDistributorsQuery, {});
    return result;
  } catch (error) {
    // Fallback to mock data if GraphQL request fails
    console.log('Using mock data for manufacturer distributors');
    return {
      distributors: mockExtendedDistributorContacts,
    };
  }
}

export async function getDistributorDirectory(): Promise<DistributorDirectoryResult | null> {
  try {
    const result = await safeRequest<DistributorDirectoryResult>(GetDistributorDirectoryQuery, {});
    return result;
  } catch (error) {
    // Fallback to mock data if GraphQL request fails
    console.log('Using mock data for distributor directory');
    return {
      distributorDirectory: flowConnectDistributorDirectory,
    };
  }
}

export async function sendDistributorInvite(distributorId: string): Promise<SendInviteResult | null> {
  return safeRequest<SendInviteResult>(SendDistributorInviteMutation, { distributorId });
}

export async function addDistributor(input: {
  domain: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
}): Promise<AddDistributorResult | null> {
  return safeRequest<AddDistributorResult>(AddDistributorMutation, { input });
}

export async function uploadDistributorList(file: File): Promise<{ success: boolean; message: string; addedCount: number; skippedCount: number } | null> {
  return safeRequest<{ uploadDistributorList: { success: boolean; message: string; addedCount: number; skippedCount: number } }>(
    UploadDistributorListMutation,
    { file }
  ).then((result) => result?.uploadDistributorList || null);
}
