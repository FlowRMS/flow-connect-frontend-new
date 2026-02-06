/**
 * Manual multipart GraphQL file upload following the GraphQL multipart request spec
 * https://github.com/jaydenseric/graphql-multipart-request-spec
 */
async function multipartGraphQLRequest<T>(
  query: string,
  variables: Record<string, any>,
  token?: string
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!url) {
    throw new Error('No GraphQL URL configured (set NEXT_PUBLIC_GRAPHQL_URL)');
  }

  // Build the multipart form data
  const formData = new FormData();

  // Extract operation name from query
  const operationNameMatch = query.match(/(?:mutation|query)\s+(\w+)/);
  const operationName = operationNameMatch ? operationNameMatch[1] : null;

  // Create operations object (GraphQL query + variables without files)
  const operations = {
    query,
    variables: JSON.parse(JSON.stringify(variables, (_key, value) => {
      // Replace File objects with null in the operations JSON
      if (value instanceof File) return null;
      return value;
    })),
    ...(operationName && { operationName })
  };

  formData.append('operations', JSON.stringify(operations));

  // Create map object (maps files to their variable paths)
  const map: Record<string, string[]> = {};
  const files: File[] = [];

  // Extract files and build map
  function extractFiles(obj: any, path: string = 'variables') {
    if (obj instanceof File) {
      const fileIndex = files.length;
      files.push(obj);
      if (!map[fileIndex]) map[fileIndex] = [];
      map[fileIndex].push(path);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => extractFiles(item, `${path}.${index}`));
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => extractFiles(obj[key], `${path}.${key}`));
    }
  }

  extractFiles(variables);

  console.log('Operations:', JSON.stringify(operations, null, 2));
  console.log('Map:', JSON.stringify(map, null, 2));
  console.log('Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

  formData.append('map', JSON.stringify(map));

  // Append files
  files.forEach((file, index) => {
    formData.append(index.toString(), file);
    console.log(`Appending file ${index}:`, file.name);
  });

  // Make request
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const apiKey = process.env.NEXT_PUBLIC_GRAPHQL_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphQL request failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Types matching the backend schema
export interface UploadExchangeFileInput {
  files: File[];
  reportingPeriod: string;
  isPos: boolean;
  isPot: boolean;
  targetOrgIds: string[];
}

export interface ExchangeFileResponse {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  status: string;
  rowCount: number;
}

const UploadExchangeFilesMutation = `
  mutation UploadExchangeFiles($data: UploadExchangeFileInput!) {
    uploadExchangeFiles(data: $data) {
      id
      fileName
      fileSize
      createdAt
      status
      rowCount
    }
  }
`;

/**
 * Upload exchange files with reporting period and data type
 * @param input - Upload input containing files and metadata
 * @param token - Optional authentication token
 * @returns Promise with array of upload responses
 */
export async function uploadExchangeFiles(
  input: UploadExchangeFileInput,
  token?: string
): Promise<ExchangeFileResponse[]> {
  const variables = {
    data: {
      files: input.files,
      reportingPeriod: input.reportingPeriod,
      isPos: input.isPos,
      isPot: input.isPot,
      targetOrgIds: input.targetOrgIds,
    }
  };

  console.log('Uploading files:', input.files.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type
  })));

  const data = await multipartGraphQLRequest<{ uploadExchangeFiles: ExchangeFileResponse[] }>(
    UploadExchangeFilesMutation,
    variables,
    token
  );

  return data.uploadExchangeFiles;
}
