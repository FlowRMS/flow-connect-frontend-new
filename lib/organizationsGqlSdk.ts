import { safeRequest } from './graphql';

// ============================================
// TYPES
// ============================================

export type PosContactInput = {
  email: string;
};

export type ManufacturerInput = {
  name: string;
  domain: string;
  contact?: PosContactInput | null;
};

export type ConnectionStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type AgreementResponse = {
  id: string;
  connectedOrgId: string;
  fileName: string;
  fileSize: number;
  presignedUrl: string;
  createdAt: string;
};

export type OrganizationAliasResponse = {
  id: string;
  connectedOrgId: string;
  connectedOrgName: string;
  alias: string;
  createdAt?: string;
};

export type OrganizationAliasGroupResponse = {
  connectedOrgId: string;
  connectedOrgName: string;
  aliases: OrganizationAliasResponse[];
};

export type PosContactResponse = {
  id: string;
  name: string;
  email: string;
};

export type OrganizationLiteResponse = {
  id: string;
  name: string;
  domain?: string;
  members: number;
  posContactsCount: number;
  flowConnectMember: boolean;
  connectionStatus?: ConnectionStatus;
  posContacts?: PosContactResponse[];
};

// Re-export types from nemra-pos-data
export type { ManufacturerContact, ManufacturerDirectoryEntry, MembershipTier, POSContact } from './nemra-pos-data';

// ============================================
// CREATE ORGANIZATION MUTATION
// ============================================

const CreateOrganizationMutation = `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      domain
      members
      posContactsCount
      flowConnectMember
      connectionStatus
    }
  }
`;

export async function createOrganization(input: ManufacturerInput, token?: string) {
  const data = await safeRequest<{ createOrganization: OrganizationLiteResponse }>(
    CreateOrganizationMutation,
    { input },
    token
  );
  return data.createOrganization;
}

// ============================================
// SEARCH ORGANIZATIONS (MANUFACTURERS)
// ============================================

const OrgSearchQuery = `
query connectionSearch($searchTerm: String!, $active: Boolean = true, $flowConnectMember: Boolean, $connected: Boolean, $limit: Int = 20, $repFirms: Boolean = false) {
  connectionSearch(searchTerm: $searchTerm, active: $active, flowConnectMember: $flowConnectMember, connected: $connected, limit: $limit, repFirms: $repFirms) {
    id
    name
    domain
    members
    posContactsCount
    flowConnectMember
    connectionStatus
    posContacts {
      id
      name
      email
    }
  }
}
`;

/**
 * Search organizations using the backend connectionSearch query.
 * Accepts all backend variables as a single options object.
 * @param options.repFirms - Set to true to search rep firms, false for manufacturers/distributors
 */
export async function searchOrganizations(
  options: {
    searchTerm: string;
    active?: boolean;
    flowConnectMember?: boolean | null;
    connected?: boolean | null;
    limit?: number;
    repFirms?: boolean;
  },
  token?: string
): Promise<OrganizationLiteResponse[]> {
  const {
    searchTerm,
    active = true,
    flowConnectMember = null,
    connected = null,
    limit = 20,
    repFirms = false,
  } = options;
  const data = await safeRequest<{ connectionSearch: OrganizationLiteResponse[] }>(
    OrgSearchQuery,
    { searchTerm, active, flowConnectMember, connected, limit, repFirms },
    token
  );
  return data.connectionSearch;
}

// ============================================
// ORGANIZATION ALIASES QUERY
// ============================================

const OrganizationAliasesQuery = `
  query organizationAliases {
    organizationAliases {
      connectedOrgId
      connectedOrgName
      aliases {
        id
        connectedOrgId
        connectedOrgName
        alias
        createdAt
      }
    }
  }
`;

/**
 * Fetches all organization aliases grouped by connected organization.
 * @param token Optional auth token
 * @returns Promise<OrganizationAliasGroupResponse[]> with grouped aliases
 */
export async function fetchOrganizationAliases(
  token?: string
): Promise<OrganizationAliasGroupResponse[]> {
  const data = await safeRequest<{ organizationAliases: OrganizationAliasGroupResponse[] }>(
    OrganizationAliasesQuery,
    {},
    token
  );
  return data.organizationAliases;
}

// ============================================
// CREATE CONNECTION MUTATION
// ============================================

const CreateConnectionMutation = `
  mutation createConnection($targetOrgId: ID!, $draft: Boolean!) {
    createConnection(targetOrgId: $targetOrgId, draft: $draft)
  }
`;

/**
 * Calls the backend createConnection mutation.
 * @param targetOrgId The organization to connect to
 * @param draft Whether to create as draft (default false)
 * @param token Optional auth token
 * @returns Promise<boolean> indicating success
 */
export async function createOrganizationConnection(targetOrgId: string, draft = false, token?: string): Promise<boolean> {
  const data = await safeRequest<{ createConnection: boolean }>(
    CreateConnectionMutation,
    { targetOrgId, draft },
    token
  );
  return data.createConnection;
}

// ============================================
// INVITE CONNECTION MUTATION
// ============================================

const InviteConnectionMutation = `
  mutation inviteConnection($targetOrgId: ID!) {
    inviteConnection(targetOrgId: $targetOrgId)
  }
`;

/**
 * Sends an invitation to an existing connection.
 * @param targetOrgId The organization to invite
 * @param token Optional auth token
 * @returns Promise<boolean> indicating success
 */
export async function inviteConnection(targetOrgId: string, token?: string): Promise<boolean> {
  const data = await safeRequest<{ inviteConnection: boolean }>(
    InviteConnectionMutation,
    { targetOrgId },
    token
  );
  return data.inviteConnection;
}

// ============================================
// UPLOAD AGREEMENT MUTATION
// ============================================

const UploadAgreementMutation = `
  mutation uploadAgreement($connectedOrgId: ID!, $file: Upload!) {
    uploadAgreement(connectedOrgId: $connectedOrgId, file: $file) {
      id
      connectedOrgId
      fileName
      fileSize
      presignedUrl
      createdAt
    }
  }
`;

/**
 * Uploads a data sharing agreement for a connected organization.
 * Uses GraphQL multipart request spec for file upload.
 * @param connectedOrgId The organization ID to upload the agreement for
 * @param file The file to upload
 * @param token Optional auth token
 * @returns Promise<AgreementResponse> with agreement details
 */
export async function uploadAgreement(
  connectedOrgId: string,
  file: File,
  token?: string
): Promise<AgreementResponse> {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL || process.env.GRAPHQL_URL;
  if (!url) {
    throw new Error('No GraphQL URL configured (set GRAPHQL_URL)');
  }

  // Build headers
  const headers: Record<string, string> = {};
  const apiKey = process.env.GRAPHQL_API_KEY || process.env.NEXT_PUBLIC_GRAPHQL_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Create multipart form data following GraphQL multipart request spec
  const formData = new FormData();

  // operations: the GraphQL query with variables (file as null placeholder)
  const operations = JSON.stringify({
    query: UploadAgreementMutation,
    variables: {
      connectedOrgId,
      file: null, // Placeholder for file
    },
  });
  formData.append('operations', operations);

  // map: maps file field names to variable paths
  const map = JSON.stringify({
    '0': ['variables.file'],
  });
  formData.append('map', map);

  // Append the actual file
  formData.append('0', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.errors?.length) {
      throw new Error(result.errors[0].message || 'GraphQL error during upload');
    }

    return result.data.uploadAgreement;
  } catch (err: any) {
    throw new Error(`Failed to upload agreement: ${err?.message ?? err}`);
  }
}

// ============================================
// CREATE ORGANIZATION ALIAS MUTATION
// ============================================

const CreateOrganizationAliasMutation = `
  mutation createOrganizationAlias($input: CreateOrganizationAliasInput!) {
    createOrganizationAlias(input: $input) {
      id
      connectedOrgId
      connectedOrgName
      alias
      createdAt
    }
  }
`;

/**
 * Creates an alias for a connected organization.
 * @param connectedOrgId The ID of the connected organization
 * @param alias The alias string to create
 * @param token Optional auth token
 * @returns Promise<OrganizationAliasResponse> with the created alias details
 */
export async function createOrganizationAlias(
  connectedOrgId: string,
  alias: string,
  token?: string
): Promise<OrganizationAliasResponse> {
  const data = await safeRequest<{ createOrganizationAlias: OrganizationAliasResponse }>(
    CreateOrganizationAliasMutation,
    { input: { connectedOrgId, alias } },
    token
  );
  return data.createOrganizationAlias;
}

// ============================================
// DELETE ORGANIZATION ALIAS MUTATION
// ============================================

const DeleteOrganizationAliasMutation = `
  mutation deleteOrganizationAlias($id: ID!) {
    deleteOrganizationAlias(id: $id)
  }
`;

/**
 * Deletes an organization alias.
 * @param id The ID of the alias to delete
 * @param token Optional auth token
 * @returns Promise<boolean> indicating success
 */
export async function deleteOrganizationAlias(
  id: string,
  token?: string
): Promise<boolean> {
  const data = await safeRequest<{ deleteOrganizationAlias: boolean }>(
    DeleteOrganizationAliasMutation,
    { id },
    token
  );
  return data.deleteOrganizationAlias;
}
