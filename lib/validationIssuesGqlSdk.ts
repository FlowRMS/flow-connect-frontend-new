import { requestGraphQL } from './graphqlClient';

// Enums
export type ValidationTypeEnum = 'STANDARD_VALIDATION' | 'VALIDATION_WARNING';

// Types matching GraphQL schema
export interface FileValidationIssueLite {
  id: string;
  rowNumber: number;
  title: string;
  columnName: string | null;
  validationType: ValidationTypeEnum;
  fileId: string;
  fileName: string;
}

// Full issue details (returned by fileValidationIssue query)
export interface FileValidationIssueDetail {
  id: string;
  rowNumber: number;
  title: string;
  columnName: string | null;
  validationKey: string;
  message: string;
  validationType: ValidationTypeEnum;
  fileId: string;
  fileName: string;
  // rowData can be a JSON string or parsed object depending on the backend
  rowData: Record<string, unknown> | string | null;
}

export interface GetFileValidationIssueResult {
  fileValidationIssue: FileValidationIssueDetail;
}

export interface ValidationIssueGroup {
  items: FileValidationIssueLite[];
  count: number;
}

export interface FileValidationIssuesResponse {
  blocking: ValidationIssueGroup;
  warning: ValidationIssueGroup;
  fyi: ValidationIssueGroup;
}

export interface GetFileValidationIssuesResult {
  fileValidationIssues: FileValidationIssuesResponse;
}

// GraphQL Queries
const GetFileValidationIssuesQuery = `
  query GetFileValidationIssues {
    fileValidationIssues {
      blocking {
        count
        items {
          id
          rowNumber
          title
          columnName
          validationType
          fileId
          fileName
        }
      }
      warning {
        count
        items {
          id
          rowNumber
          title
          columnName
          validationType
          fileId
          fileName
        }
      }
      fyi {
        count
        items {
          id
          rowNumber
          title
          columnName
          validationType
          fileId
          fileName
        }
      }
    }
  }
`;

const GetFileValidationIssueQuery = `
  query GetFileValidationIssue($id: ID!) {
    fileValidationIssue(id: $id) {
      id
      rowNumber
      title
      columnName
      validationKey
      message
      validationType
      fileId
      fileName
      rowData
    }
  }
`;

// Mock data for development/fallback
export const mockFileValidationIssues: FileValidationIssuesResponse = {
  blocking: {
    count: 0,
    items: [],
  },
  warning: {
    count: 0,
    items: [],
  },
  fyi: {
    count: 0,
    items: [],
  },
};

/**
 * Fetch file validation issues from GraphQL.
 * Returns empty data if no GraphQL URL is configured (dev mode).
 * Throws on actual API errors so the UI can handle them.
 */
export async function fetchFileValidationIssues(
  token?: string
): Promise<FileValidationIssuesResponse> {
  // Check if GraphQL is configured
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!graphqlUrl) {
    console.info('No NEXT_PUBLIC_GRAPHQL_URL configured, using mock data');
    return mockFileValidationIssues;
  }

  try {
    const result = await requestGraphQL<GetFileValidationIssuesResult>(
      GetFileValidationIssuesQuery,
      {},
      token
    );
    return result.fileValidationIssues;
  } catch (error) {
    console.error('Failed to fetch file validation issues:', error);
    // Re-throw to let the UI handle the error
    throw error;
  }
}

/**
 * Fetch a single file validation issue by ID.
 * Returns full details including rowData.
 */
export async function fetchFileValidationIssue(
  id: string,
  token?: string
): Promise<FileValidationIssueDetail> {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!graphqlUrl) {
    throw new Error('No NEXT_PUBLIC_GRAPHQL_URL configured');
  }

  try {
    const result = await requestGraphQL<GetFileValidationIssueResult>(
      GetFileValidationIssueQuery,
      { id },
      token
    );
    return result.fileValidationIssue;
  } catch (error) {
    console.error('Failed to fetch file validation issue:', error);
    throw error;
  }
}
