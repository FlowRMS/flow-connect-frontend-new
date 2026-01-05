'use client'

import * as XLSX from 'xlsx';

// Use the FlowAI GraphQL proxy which handles WorkOS auth
const GRAPHQL_ENDPOINT = '/api/flow-ai/graphql';

type GraphQLError = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

async function performGraphQLRequest<T>(
  query: string,
  token: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors && payload.errors.length > 0) {
    const aggregatedMessage = payload.errors.map((err) => err.message).join('; ');
    throw new Error(aggregatedMessage || 'Unknown GraphQL error');
  }

  if (!payload.data) {
    throw new Error('GraphQL response missing data');
  }

  return payload.data;
}

const GET_FILE_INFO = /* GraphQL */ `
  query GetFileInfo($id: ID!) {
    getFileInfo(id: $id) {
      id
      fileName
      fileType
    }
  }
`;

export interface FileInfoSummary {
  id: string;
  fileName?: string | null;
  fileType?: string | null;
}

export async function fetchFileInfo(
  token: string,
  fileId: string
): Promise<FileInfoSummary> {
  const data = await performGraphQLRequest<{ getFileInfo: FileInfoSummary }>(
    GET_FILE_INFO,
    token,
    { id: fileId }
  );

  return data.getFileInfo;
}

const GENERATE_PRESIGNED_URL = /* GraphQL */ `
  query GeneratePresignedUrl($id: ID!, $includeFlowbotUrls: Boolean, $includeTabularUrl: Boolean) {
    generatePresignedUrl(
      id: $id
      includeFlowbotUrls: $includeFlowbotUrls
      includeTabularUrl: $includeTabularUrl
    ) {
      renderFilePresignedUrl
      downloadFilePresignedUrl
      tabularPresignedUrl
      flowbotUrls {
        fileUploadProcessId
        downloadFilePresignedUrl
      }
    }
  }
`;

export interface PresignedUrlResponse {
  renderFilePresignedUrl: string;
  downloadFilePresignedUrl: string;
  tabularPresignedUrl?: string | null;
  flowbotUrls: Array<{
    fileUploadProcessId: string;
    downloadFilePresignedUrl: string;
  }>;
}

export async function fetchPresignedUrls(
  token: string,
  fileId: string,
  _refreshToken: string
): Promise<PresignedUrlResponse> {
  void _refreshToken;
  const data = await performGraphQLRequest<{
    generatePresignedUrl: PresignedUrlResponse;
  }>(GENERATE_PRESIGNED_URL, token, {
    id: fileId,
    includeFlowbotUrls: true,
    includeTabularUrl: true,
  });

  return data.generatePresignedUrl;
}

export async function fetchCsvData(presignedUrl: string): Promise<unknown[][]> {
  try {
    const response = await fetch(presignedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Use XLSX to parse CSV data correctly handling quoted newlines
    const workbook = XLSX.read(buffer, { type: 'array', raw: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
    
  } catch (error) {
    console.error('Error fetching CSV data:', error);
    throw error;
  }
}

