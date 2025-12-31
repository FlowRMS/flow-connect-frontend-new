/**
 * Takeoffs GraphQL Module
 * GraphQL queries and API functions for Takeoffs
 * Uses flow-ai backend for AI-powered document processing
 * File uploads are handled directly by flow-ai
 */

import { flowAIGraphQLRequest, flowAIGraphQLMultipartRequest } from './flow-ai-client';
import { type FileResponse } from './files';

// ============================================================================
// Types
// ============================================================================

export type TakeoffStatusEnum = 'CLASSIFICATION' | 'ABRIDGMENT' | 'PARSING' | 'COMPLETE';

export interface TakeoffDocumentResponse {
  id: string;
  takeoffId: string;
  name: string;
  fileType: string;
  fileSize: string;
  documentUrl: string | null;
  classification: string | null;
  confidence: number | null;
  pages: number;
  abridged: boolean;
  abridgedPages: number | null;
  reductionPercentage: number | null;
  pageAnalyses: PageAnalysis[] | null;
  products: unknown;
  parsedItems: ParsedItem[] | null;
  createdAt: string;
}

export interface TakeoffResponse {
  id: string;
  title: string;
  source: string;
  createdBy: string;
  status: TakeoffStatusEnum;
  quoteId: string | null;
  userId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  documents: TakeoffDocumentResponse[];
}

export interface PageAnalysis {
  pageNumber: number;
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
  mainTopic: string;
}

export interface ParsedItem {
  id?: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer?: boolean;
  isCrossed?: boolean;
  crossedManufacturer?: string;
  crossedPartNumber?: string;
  crossedDescription?: string;
}

export interface TakeoffDocumentInput {
  name: string;
  fileType?: string;
  fileSize: string;
  documentUrl?: string | null;
  classification?: string | null;
  confidence?: number | null;
  pages?: number;
  abridged?: boolean;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  pageAnalyses?: PageAnalysis[] | null;
  products?: unknown;
  parsedItems?: ParsedItem[] | null;
}

export interface CreateTakeoffInput {
  title: string;
  source?: string;
  createdBy: string;
  status?: TakeoffStatusEnum;
  quoteId?: string | null;
  metadata?: Record<string, unknown> | null;
  documents?: TakeoffDocumentInput[] | null;
}

export interface UpdateTakeoffInput {
  title?: string | null;
  source?: string | null;
  status?: TakeoffStatusEnum | null;
  quoteId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateTakeoffDocumentInput {
  name?: string | null;
  classification?: string | null;
  confidence?: number | null;
  pages?: number | null;
  abridged?: boolean | null;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  pageAnalyses?: PageAnalysis[] | null;
  products?: unknown;
  parsedItems?: ParsedItem[] | null;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_USER_TAKEOFFS = `
  query GetUserTakeoffs($limit: Int, $offset: Int, $search: String, $status: String, $source: String) {
    getUserTakeoffs(limit: $limit, offset: $offset, search: $search, status: $status, source: $source) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

const GET_TAKEOFF = `
  query GetTakeoff($takeoffId: UUID!) {
    getTakeoff(takeoffId: $takeoffId) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        pageAnalyses
        products
        parsedItems
        createdAt
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_TAKEOFF = `
  mutation CreateTakeoff($input: CreateTakeoffInput!) {
    createTakeoff(input: $input) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
      documents {
        id
        takeoffId
        name
        fileType
        fileSize
        documentUrl
        classification
        confidence
        pages
        abridged
        abridgedPages
        reductionPercentage
        createdAt
      }
    }
  }
`;

const UPDATE_TAKEOFF = `
  mutation UpdateTakeoff($takeoffId: UUID!, $input: UpdateTakeoffInput!) {
    updateTakeoff(takeoffId: $takeoffId, input: $input) {
      id
      title
      source
      createdBy
      status
      quoteId
      userId
      metadata
      createdAt
    }
  }
`;

const DELETE_TAKEOFF = `
  mutation DeleteTakeoff($takeoffId: UUID!) {
    deleteTakeoff(takeoffId: $takeoffId)
  }
`;

const UPDATE_TAKEOFF_DOCUMENT = `
  mutation UpdateTakeoffDocument($documentId: UUID!, $input: UpdateTakeoffDocumentInput!) {
    updateTakeoffDocument(documentId: $documentId, input: $input) {
      id
      takeoffId
      name
      fileType
      fileSize
      documentUrl
      classification
      confidence
      pages
      abridged
      abridgedPages
      reductionPercentage
      pageAnalyses
      products
      parsedItems
      createdAt
    }
  }
`;

// ============================================================================
// Document Processing Queries (Classification, Abridgement, Product Cross)
// ============================================================================

const CLASSIFY_DOCUMENT = `
  query ClassifyDocument($documentUrl: String!, $filename: String!) {
    classifyDocument(documentUrl: $documentUrl, filename: $filename) {
      success
      category
      confidence
      reasoning
      documentType
      error
    }
  }
`;

const ABRIDGE_DOCUMENT = `
  query AbridgeDocument($documentUrl: String!, $filename: String!, $instructions: [String!]!) {
    abridgeDocument(documentUrl: $documentUrl, filename: $filename, instructions: $instructions) {
      success
      abridgedUrl
      originalPages
      abridgedPages
      reductionPercentage
      pageAnalyses {
        pageNumber
        isRelevant
        confidence
        reasoning
        mainTopic
      }
      error
    }
  }
`;

const CROSS_PRODUCTS = `
  query CrossProducts($products: [JSON!]!, $crossTypes: [ProductCrossTypeEnum!]!, $samplePrompts: [String!]) {
    crossProducts(products: $products, crossTypes: $crossTypes, samplePrompts: $samplePrompts) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
        }
        promptUsed
        notes
      }
    }
  }
`;

const PRODUCT_CROSS_FROM_PARSED_DOCUMENT = `
  query ProductCrossFromParsedDocument($documentUrl: String!, $filename: String!, $crossTypes: [ProductCrossTypeEnum!]!, $samplePrompts: [String!]) {
    productCrossFromParsedDocument(documentUrl: $documentUrl, filename: $filename, crossTypes: $crossTypes, samplePrompts: $samplePrompts) {
      original
      crosses {
        crossType
        originalProduct
        alternatives {
          name
          description
          price
          source
          crossType
        }
        promptUsed
        notes
      }
    }
  }
`;

// ============================================================================
// Document Processing Types
// ============================================================================

export interface ClassificationResult {
  success: boolean;
  category: string | null;
  confidence: number | null;
  reasoning: string | null;
  documentType: string | null;
  error: string | null;
}

export interface AbridgementPageAnalysis {
  pageNumber: number;
  isRelevant: boolean;
  confidence: number;
  reasoning: string;
  mainTopic: string;
}

export interface AbridgementResult {
  success: boolean;
  abridgedUrl: string | null;
  originalPages: number | null;
  abridgedPages: number | null;
  reductionPercentage: number | null;
  pageAnalyses: AbridgementPageAnalysis[] | null;
  error: string | null;
}

export type ProductCrossType = 'SIMPLE' | 'VALUE' | 'UPGRADE';

export interface ProductAlternative {
  name: string;
  description: string | null;
  price: number | null;
  source: string | null;
  crossType: ProductCrossType;
}

export interface ProductCrossResult {
  crossType: ProductCrossType;
  originalProduct: string;
  alternatives: ProductAlternative[];
  promptUsed: string;
  notes: string | null;
}

export interface ParsedProductCross {
  original: Record<string, unknown>;
  crosses: ProductCrossResult[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Classify a document using AI
 */
export async function classifyDocument(
  documentUrl: string,
  filename: string
): Promise<ClassificationResult> {
  const response = await flowAIGraphQLRequest<{ classifyDocument: ClassificationResult }>({
    query: CLASSIFY_DOCUMENT,
    variables: { documentUrl, filename },
  });

  if (response.errors) {
    return {
      success: false,
      category: null,
      confidence: null,
      reasoning: null,
      documentType: null,
      error: response.errors[0]?.message || 'Failed to classify document',
    };
  }

  return response.data?.classifyDocument || {
    success: false,
    category: null,
    confidence: null,
    reasoning: null,
    documentType: null,
    error: 'No response from server',
  };
}

/**
 * Abridge a document using AI - extracts relevant pages
 */
export async function abridgeDocument(
  documentUrl: string,
  filename: string,
  instructions: string[] = ['Extract relevant product and fixture information']
): Promise<AbridgementResult> {
  const response = await flowAIGraphQLRequest<{ abridgeDocument: AbridgementResult }>({
    query: ABRIDGE_DOCUMENT,
    variables: { documentUrl, filename, instructions },
  });

  if (response.errors) {
    return {
      success: false,
      abridgedUrl: null,
      originalPages: null,
      abridgedPages: null,
      reductionPercentage: null,
      pageAnalyses: null,
      error: response.errors[0]?.message || 'Failed to abridge document',
    };
  }

  return response.data?.abridgeDocument || {
    success: false,
    abridgedUrl: null,
    originalPages: null,
    abridgedPages: null,
    reductionPercentage: null,
    pageAnalyses: null,
    error: 'No response from server',
  };
}

/**
 * Cross products with alternatives
 */
export async function crossProducts(
  products: Record<string, unknown>[],
  crossTypes: ProductCrossType[] = ['SIMPLE'],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{ crossProducts: ParsedProductCross[] }>({
    query: CROSS_PRODUCTS,
    variables: { products, crossTypes, samplePrompts },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products');
  }

  return response.data?.crossProducts || [];
}

/**
 * Cross products from a parsed document
 */
export async function productCrossFromParsedDocument(
  documentUrl: string,
  filename: string,
  crossTypes: ProductCrossType[] = ['SIMPLE'],
  samplePrompts?: string[]
): Promise<ParsedProductCross[]> {
  const response = await flowAIGraphQLRequest<{ productCrossFromParsedDocument: ParsedProductCross[] }>({
    query: PRODUCT_CROSS_FROM_PARSED_DOCUMENT,
    variables: { documentUrl, filename, crossTypes, samplePrompts },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to cross products from document');
  }

  return response.data?.productCrossFromParsedDocument || [];
}

/**
 * Parameters for fetching takeoffs with filters
 */
export interface FetchTakeoffsParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  source?: string;
}

/**
 * Fetch takeoffs for the current user with optional filtering
 */
export async function fetchUserTakeoffs(params?: FetchTakeoffsParams): Promise<TakeoffResponse[]> {
  const response = await flowAIGraphQLRequest<{ getUserTakeoffs: TakeoffResponse[] }>({
    query: GET_USER_TAKEOFFS,
    variables: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      search: params?.search || null,
      status: params?.status || null,
      source: params?.source || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffs || [];
}

/**
 * Fetch a single takeoff by ID
 */
export async function fetchTakeoff(takeoffId: string): Promise<TakeoffResponse | null> {
  const response = await flowAIGraphQLRequest<{ getTakeoff: TakeoffResponse | null }>({
    query: GET_TAKEOFF,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoff');
  }

  return response.data?.getTakeoff || null;
}

/**
 * Create a new takeoff
 */
export async function createTakeoff(input: CreateTakeoffInput): Promise<TakeoffResponse> {
  const response = await flowAIGraphQLRequest<{ createTakeoff: TakeoffResponse }>({
    query: CREATE_TAKEOFF,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create takeoff');
  }

  if (!response.data?.createTakeoff) {
    throw new Error('No takeoff returned from create mutation');
  }

  return response.data.createTakeoff;
}

/**
 * Update an existing takeoff
 */
export async function updateTakeoff(
  takeoffId: string,
  input: UpdateTakeoffInput
): Promise<TakeoffResponse> {
  const response = await flowAIGraphQLRequest<{ updateTakeoff: TakeoffResponse }>({
    query: UPDATE_TAKEOFF,
    variables: { takeoffId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update takeoff');
  }

  if (!response.data?.updateTakeoff) {
    throw new Error('No takeoff returned from update mutation');
  }

  return response.data.updateTakeoff;
}

/**
 * Delete a takeoff
 */
export async function deleteTakeoff(takeoffId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteTakeoff: boolean }>({
    query: DELETE_TAKEOFF,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete takeoff');
  }

  return response.data?.deleteTakeoff || false;
}

/**
 * Update a takeoff document
 */
export async function updateTakeoffDocument(
  documentId: string,
  input: UpdateTakeoffDocumentInput
): Promise<TakeoffDocumentResponse> {
  const response = await flowAIGraphQLRequest<{ updateTakeoffDocument: TakeoffDocumentResponse }>({
    query: UPDATE_TAKEOFF_DOCUMENT,
    variables: { documentId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update takeoff document');
  }

  if (!response.data?.updateTakeoffDocument) {
    throw new Error('No document returned from update mutation');
  }

  return response.data.updateTakeoffDocument;
}

// ============================================================================
// Integrated Upload Functions
// ============================================================================

export interface UploadProgressCallback {
  (fileIndex: number, progress: number, status: 'uploading' | 'complete' | 'error', error?: string): void;
}

export interface CreateTakeoffWithFilesInput {
  title: string;
  source?: string;
  createdBy: string;
  metadata?: {
    clientName?: string;
    bidDate?: string;
    estimatedValue?: string;
    city?: string;
    state?: string;
  };
  files: File[];
}

export interface UploadedFileInfo {
  file: File;
  crmFile: FileResponse;
  presignedUrl: string;
}

// GraphQL mutation for uploading takeoff documents to flow-ai
const UPLOAD_TAKEOFF_DOCUMENT = `
  mutation UploadTakeoffDocument($file: Upload!, $fileName: String!, $folder: String) {
    uploadTakeoffDocument(file: $file, fileName: $fileName, folder: $folder) {
      s3Key
      presignedUrl
      fileName
      fileSize
      contentType
    }
  }
`;

interface TakeoffUploadResponse {
  s3Key: string;
  presignedUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * Upload a single file to flow-ai S3 storage
 * Returns the presigned URL for the uploaded file
 */
async function uploadFileToFlowAI(
  file: File,
  folder: string = 'takeoffs'
): Promise<TakeoffUploadResponse> {
  const response = await flowAIGraphQLMultipartRequest<{
    uploadTakeoffDocument: TakeoffUploadResponse;
  }>({
    query: UPLOAD_TAKEOFF_DOCUMENT,
    variables: {
      file,
      fileName: file.name,
      folder,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to upload file');
  }

  if (!response.data?.uploadTakeoffDocument) {
    throw new Error('Upload failed: No response data');
  }

  return response.data.uploadTakeoffDocument;
}

/**
 * Upload files to flow-ai S3 and get presigned URLs
 * Returns array of uploaded file info with presigned URLs
 */
export async function uploadFilesToStorage(
  files: File[],
  folderPath: string = 'takeoffs',
  onProgress?: UploadProgressCallback
): Promise<UploadedFileInfo[]> {
  const results: UploadedFileInfo[] = [];

  // Upload files one by one for better progress tracking
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.(i, 0, 'uploading');

    try {
      // Upload to flow-ai S3
      const uploadResult = await uploadFileToFlowAI(file, folderPath);

      onProgress?.(i, 50, 'uploading');

      // Create a compatible file response
      const crmFile: FileResponse = {
        id: uploadResult.s3Key,
        fileName: uploadResult.fileName,
        filePath: uploadResult.s3Key,
        fileSha: '',
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.contentType || file.type || 'application/pdf',
        folderId: null,
        archived: false,
        createdAt: new Date().toISOString(),
        createdBy: null,
      };

      results.push({
        file,
        crmFile,
        presignedUrl: uploadResult.presignedUrl,
      });

      onProgress?.(i, 100, 'complete');
    } catch (error) {
      onProgress?.(i, 0, 'error', error instanceof Error ? error.message : 'Upload failed');
      throw error;
    }
  }

  return results;
}

/**
 * Create a takeoff with files - handles complete flow:
 * 1. Upload files directly to S3 and get presigned URLs
 * 2. Create takeoff in flow-ai with document URLs
 */
export async function createTakeoffWithFiles(
  input: CreateTakeoffWithFilesInput,
  onProgress?: UploadProgressCallback
): Promise<TakeoffResponse> {
  // Step 1 & 2: Upload files and get presigned URLs
  const uploadedFiles = await uploadFilesToStorage(
    input.files,
    `takeoffs/${input.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
    onProgress
  );

  // Step 3: Create takeoff with document URLs
  const documents: TakeoffDocumentInput[] = uploadedFiles.map(({ file, crmFile, presignedUrl }) => ({
    name: file.name,
    fileType: file.type || 'application/pdf',
    fileSize: crmFile.fileSize ? `${(crmFile.fileSize / 1024).toFixed(1)} KB` : `${(file.size / 1024).toFixed(1)} KB`,
    documentUrl: presignedUrl,
    pages: 0,
    abridged: false,
  }));

  const takeoffInput: CreateTakeoffInput = {
    title: input.title,
    source: input.source || 'Upload',
    createdBy: input.createdBy,
    status: 'CLASSIFICATION',
    metadata: input.metadata || null,
    documents,
  };

  return createTakeoff(takeoffInput);
}

/**
 * Upload a single file and add it to an existing takeoff
 * Note: This requires adding a document to an existing takeoff
 * Currently not directly supported - would need addDocumentToTakeoff mutation
 */
export async function uploadFileToTakeoff(
  takeoffId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadedFileInfo> {
  const [uploadedFile] = await uploadFilesToStorage([file], `takeoffs/${takeoffId}`, onProgress);
  return uploadedFile;
}
