import { requestGraphQL } from './graphqlClient';

// Types matching the backend schema
export enum ExchangeFileStatus {
  PENDING = 'PENDING',
  SENT = 'SENT'
}

export enum ValidationStatus {
  NOT_VALIDATED = 'NOT_VALIDATED',
  VALIDATING = 'VALIDATING',
  VALID = 'VALID',
  INVALID = 'INVALID'
}

export interface ExchangeFileTargetOrgResponse {
  id: string;
  connectedOrgId: string;
}

export interface ExchangeFileResponse {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  rowCount: number;
  status: ExchangeFileStatus;
  validationStatus: ValidationStatus;
  reportingPeriod: string;
  isPos: boolean;
  isPot: boolean;
  createdAt: string;
  targetOrganizations: ExchangeFileTargetOrgResponse[];
}

const PendingExchangeFilesQuery = `
  query PendingExchangeFiles {
    pendingExchangeFiles {
      id
      fileName
      fileSize
      fileType
      rowCount
      status
      validationStatus
      reportingPeriod
      isPos
      isPot
      createdAt
      targetOrganizations {
        id
        connectedOrgId
      }
    }
  }
`;

const DeleteExchangeFileMutation = `
  mutation DeleteExchangeFile($fileId: ID!) {
    deleteExchangeFile(fileId: $fileId)
  }
`;

const SendPendingExchangeFilesMutation = `
  mutation SendPendingExchangeFiles {
    sendPendingExchangeFiles {
      success
      filesSent
    }
  }
`;

const SentExchangeFilesQuery = `
  query SentExchangeFiles($period: String, $organizations: [ID!], $isPos: Boolean, $isPot: Boolean) {
    sentExchangeFiles(period: $period, organizations: $organizations, isPos: $isPos, isPot: $isPot) {
      reportingPeriod
      organizations {
        connectedOrgId
        connectedOrgName
        count
        files {
          id
          fileName
          fileSize
          fileType
          rowCount
          status
          validationStatus
          reportingPeriod
          isPos
          isPot
          createdAt
          targetOrganizations {
            id
            connectedOrgId
          }
        }
      }
    }
  }
`;

export interface SendPendingFilesResponse {
  success: boolean;
  filesSent: number;
}

// Types for sentExchangeFiles query
export interface SentExchangeFilesByOrgResponse {
  connectedOrgId: string;
  connectedOrgName: string;
  files: ExchangeFileResponse[];
  count: number;
}

export interface SentExchangeFilesByPeriodResponse {
  reportingPeriod: string;
  organizations: SentExchangeFilesByOrgResponse[];
}

/**
 * Fetch pending exchange files
 * @param token - Optional authentication token
 * @returns Promise with array of pending exchange files
 */
export async function fetchPendingExchangeFiles(
  token?: string
): Promise<ExchangeFileResponse[]> {
  const data = await requestGraphQL<{ pendingExchangeFiles: ExchangeFileResponse[] }>(
    PendingExchangeFilesQuery,
    undefined,
    token
  );
  return data.pendingExchangeFiles;
}

/**
 * Delete an exchange file
 * @param fileId - ID of the file to delete
 * @param token - Optional authentication token
 * @returns Promise with boolean indicating success
 */
export async function deleteExchangeFile(
  fileId: string,
  token?: string
): Promise<boolean> {
  const data = await requestGraphQL<{ deleteExchangeFile: boolean }>(
    DeleteExchangeFileMutation,
    { fileId },
    token
  );
  return data.deleteExchangeFile;
}

/**
 * Send all pending exchange files
 * @param token - Optional authentication token
 * @returns Promise with success status and count of files sent
 */
export async function sendPendingExchangeFiles(
  token?: string
): Promise<SendPendingFilesResponse> {
  const data = await requestGraphQL<{ sendPendingExchangeFiles: SendPendingFilesResponse }>(
    SendPendingExchangeFilesMutation,
    undefined,
    token
  );
  return data.sendPendingExchangeFiles;
}

export interface SentExchangeFilesParams {
  period?: string;
  organizations?: string[];
  isPos?: boolean;
  isPot?: boolean;
}

/**
 * Fetch sent exchange files grouped by period and organization
 * @param params - Optional filter parameters
 * @param token - Optional authentication token
 * @returns Promise with array of sent exchange files grouped by period
 */
export async function fetchSentExchangeFiles(
  params?: SentExchangeFilesParams,
  token?: string
): Promise<SentExchangeFilesByPeriodResponse[]> {
  const data = await requestGraphQL<{ sentExchangeFiles: SentExchangeFilesByPeriodResponse[] }>(
    SentExchangeFilesQuery,
    params,
    token
  );
  return data.sentExchangeFiles;
}
