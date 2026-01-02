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
  id: string;
  documentId?: string; // Track which document this item came from for backend persistence
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer: boolean;
  isCrossed: boolean;
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
  discipline?: string | null; // Added for discipline persistence
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
  query GetUserTakeoffs(
    $limit: Int,
    $offset: Int,
    $search: String,
    $status: String,
    $source: String,
    $title: String,
    $createdBy: String
  ) {
    getUserTakeoffs(
      limit: $limit,
      offset: $offset,
      search: $search,
      status: $status,
      source: $source,
      title: $title,
      createdBy: $createdBy
    ) {
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

const GET_USER_TAKEOFFS_PAGINATED = `
  query GetUserTakeoffsPaginated(
    $limit: Int,
    $offset: Int,
    $search: String,
    $status: String,
    $source: String,
    $title: String,
    $createdBy: String
  ) {
    getUserTakeoffsPaginated(
      limit: $limit,
      offset: $offset,
      search: $search,
      status: $status,
      source: $source,
      title: $title,
      createdBy: $createdBy
    ) {
      totalCount
      takeoffs {
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
 * Parse schedule document to extract product items
 * Uses productCrossFromParsedDocument API and extracts only the parsed items
 * @param documentUrl - URL of the document to parse
 * @param filename - Original filename
 * @param documentId - Optional ID of the source document for backend persistence
 */
export async function parseScheduleDocument(
  documentUrl: string,
  filename: string,
  documentId?: string
): Promise<ParsedItem[]> {
  // Use the product cross API to parse the document
  // We pass minimal cross types since we only want the parsed items
  const results = await productCrossFromParsedDocument(documentUrl, filename, ['SIMPLE']);

  // Extract parsed items from the results
  const parsedItems: ParsedItem[] = results.map((result, index) => {
    const original = result.original as Record<string, unknown>;
    return {
      id: `parsed-${index}-${Date.now()}`,
      documentId, // Track source document for backend persistence
      manufacturer: (original.manufacturer as string) || (original.Manufacturer as string) || 'Unknown',
      partNumber: (original.partNumber as string) || (original.PartNumber as string) || (original.model as string) || '',
      description: (original.description as string) || (original.Description as string) || '',
      quantity: (original.quantity as number) || (original.Quantity as number) || 1,
      isOurManufacturer: false,
      isCrossed: false,
    };
  });

  return parsedItems;
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
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  title?: string;
}

/**
 * Paginated result for takeoffs
 */
export interface TakeoffsPaginatedResult {
  takeoffs: TakeoffResponse[];
  totalCount: number;
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
      title: params?.title || null,
      createdBy: params?.createdBy || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffs || [];
}

/**
 * Fetch takeoffs with pagination info (total count)
 */
export async function fetchUserTakeoffsPaginated(params?: FetchTakeoffsParams): Promise<TakeoffsPaginatedResult> {
  const response = await flowAIGraphQLRequest<{
    getUserTakeoffsPaginated: { takeoffs: TakeoffResponse[]; totalCount: number };
  }>({
    query: GET_USER_TAKEOFFS_PAGINATED,
    variables: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      search: params?.search || null,
      status: params?.status || null,
      source: params?.source || null,
      title: params?.title || null,
      createdBy: params?.createdBy || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch takeoffs');
  }

  return response.data?.getUserTakeoffsPaginated || { takeoffs: [], totalCount: 0 };
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
  console.log('[createTakeoff] Sending mutation with input:', input);
  console.log('[createTakeoff] Documents count:', input.documents?.length || 0);

  const response = await flowAIGraphQLRequest<{ createTakeoff: TakeoffResponse }>({
    query: CREATE_TAKEOFF,
    variables: { input },
  });

  console.log('[createTakeoff] GraphQL response:', JSON.stringify(response, null, 2));

  if (response.errors) {
    console.error('[createTakeoff] GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create takeoff');
  }

  if (!response.data?.createTakeoff) {
    console.error('[createTakeoff] No takeoff in response');
    throw new Error('No takeoff returned from create mutation');
  }

  console.log('[createTakeoff] Created takeoff:', response.data.createTakeoff);
  console.log('[createTakeoff] Documents in response:', response.data.createTakeoff.documents);

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
        folderId: undefined,
        archived: false,
        createdAt: new Date().toISOString(),
        createdBy: undefined,
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
 * Get page count from a PDF file using pdf.js
 * Returns 0 if unable to determine page count
 */
async function getPdfPageCount(file: File): Promise<number> {
  try {
    // Only process PDF files
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return 0;
    }

    // Dynamically import pdf.js to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source - using unpkg CDN for better compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    return pdf.numPages;
  } catch (error) {
    console.error('Failed to get PDF page count:', error);
    return 0;
  }
}

/**
 * Create a takeoff with files - handles complete flow:
 * 1. Get page counts from PDF files
 * 2. Upload files directly to S3 and get presigned URLs
 * 3. Create takeoff in flow-ai with document URLs and page counts
 */
export async function createTakeoffWithFiles(
  input: CreateTakeoffWithFilesInput,
  onProgress?: UploadProgressCallback
): Promise<TakeoffResponse> {
  console.log('[createTakeoffWithFiles] Starting with', input.files.length, 'files');
  console.log('[createTakeoffWithFiles] Input:', { title: input.title, metadata: input.metadata });

  // Step 1: Get page counts from PDFs (in parallel for performance)
  console.log('[createTakeoffWithFiles] Step 1: Getting page counts...');
  const pageCountPromises = input.files.map(async (file) => {
    const pages = await getPdfPageCount(file);
    return { name: file.name, pages };
  });
  const pageCounts = await Promise.all(pageCountPromises);
  const pageCountMap = new Map(pageCounts.map(({ name, pages }) => [name, pages]));
  console.log('[createTakeoffWithFiles] Page counts:', pageCounts);

  // Step 2: Upload files and get presigned URLs
  console.log('[createTakeoffWithFiles] Step 2: Uploading files to S3...');
  let uploadedFiles;
  try {
    uploadedFiles = await uploadFilesToStorage(
      input.files,
      `takeoffs/${input.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
      onProgress
    );
    console.log('[createTakeoffWithFiles] Uploaded files:', uploadedFiles.length);
  } catch (uploadError) {
    console.error('[createTakeoffWithFiles] S3 Upload failed:', uploadError);
    throw new Error(`S3 Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
  }
  console.log('[createTakeoffWithFiles] Presigned URLs:', uploadedFiles.map(f => ({ name: f.file.name, url: f.presignedUrl?.substring(0, 50) + '...' })));

  // Step 3: Create takeoff with document URLs and page counts
  console.log('[createTakeoffWithFiles] Step 3: Creating takeoff with documents...');
  const documents: TakeoffDocumentInput[] = uploadedFiles.map(({ file, crmFile, presignedUrl }) => ({
    name: file.name,
    fileType: file.type || 'application/pdf',
    fileSize: crmFile.fileSize ? `${(crmFile.fileSize / 1024).toFixed(1)} KB` : `${(file.size / 1024).toFixed(1)} KB`,
    documentUrl: presignedUrl,
    pages: pageCountMap.get(file.name) || 0,
    abridged: false,
  }));
  console.log('[createTakeoffWithFiles] Documents to create:', documents);

  const takeoffInput: CreateTakeoffInput = {
    title: input.title,
    source: input.source || 'Manual Upload',
    createdBy: input.createdBy,
    status: 'CLASSIFICATION',
    metadata: input.metadata || null,
    documents,
  };
  console.log('[createTakeoffWithFiles] Takeoff input:', takeoffInput);

  let result = await createTakeoff(takeoffInput);
  console.log('[createTakeoffWithFiles] Created takeoff result:', result);
  console.log('[createTakeoffWithFiles] Result documents:', result.documents);

  // Temporary: If documents weren't returned, fetch the takeoff again to get documents
  if (!result.documents || result.documents.length === 0) {
    console.log('[createTakeoffWithFiles] No documents in response, fetching takeoff again...');
    const refetchedTakeoff = await fetchTakeoff(result.id);
    if (refetchedTakeoff?.documents && refetchedTakeoff.documents.length > 0) {
      console.log('[createTakeoffWithFiles] Got documents from refetch:', refetchedTakeoff.documents.length);
      result = refetchedTakeoff;
    } else {
      console.warn('[createTakeoffWithFiles] Still no documents after refetch, constructing from input');
      // Construct documents from our input as a last resort
      result.documents = documents.map((doc, index) => ({
        id: `temp-${index}-${Date.now()}`,
        name: doc.name,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        documentUrl: doc.documentUrl,
        pages: doc.pages,
        abridged: doc.abridged || false,
        abridgedPages: null,
        reductionPercentage: null,
        classification: null,
        confidence: null,
        createdAt: new Date().toISOString(),
        pageAnalyses: null,
        products: null,
        parsedItems: null,
      }));
    }
  }

  return result;
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

// ============================================================================
// Product Cross Persistence Functions
// ============================================================================

export interface ProductCrossAlternative {
  name: string;
  description: string;
  price?: number | null;
  source?: string | null;
  crossType: 'SIMPLE' | 'UPGRADE' | 'VALUE';
  attributes?: Record<string, string> | null;
  reasoning?: string | null;
  selected?: boolean;
}

export interface SaveProductCrossInput {
  takeoffId: string;
  originalManufacturer: string;
  originalPartNumber: string;
  originalDescription?: string | null;
  originalAttributes?: Record<string, string> | null;
  alternatives: ProductCrossAlternative[];
  crossTypesUsed?: ('SIMPLE' | 'UPGRADE' | 'VALUE')[] | null;
  promptUsed?: string | null;
}

export interface TakeoffProductCrossResponse {
  id: string;
  takeoffId: string;
  originalManufacturer: string;
  originalPartNumber: string;
  originalDescription?: string | null;
  originalAttributes?: Record<string, string> | null;
  alternatives: ProductCrossAlternative[];
  crossTypesUsed?: string[] | null;
  promptUsed?: string | null;
  createdAt: string;
}

const SAVE_PRODUCT_CROSS = `
  mutation SaveProductCross($input: SaveProductCrossInput!) {
    saveProductCross(input: $input) {
      id
      takeoffId
      originalManufacturer
      originalPartNumber
      originalDescription
      originalAttributes
      alternatives
      crossTypesUsed
      promptUsed
      createdAt
    }
  }
`;

const SELECT_CROSS_ALTERNATIVE = `
  mutation SelectCrossAlternative($crossId: UUID!, $alternativeIndex: Int!) {
    selectCrossAlternative(crossId: $crossId, alternativeIndex: $alternativeIndex) {
      id
      takeoffId
      originalManufacturer
      originalPartNumber
      originalDescription
      originalAttributes
      alternatives
      crossTypesUsed
      promptUsed
      createdAt
    }
  }
`;

const DELETE_CROSS_ALTERNATIVE = `
  mutation DeleteCrossAlternative($crossId: UUID!, $alternativeIndex: Int!) {
    deleteCrossAlternative(crossId: $crossId, alternativeIndex: $alternativeIndex) {
      id
      takeoffId
      originalManufacturer
      originalPartNumber
      originalDescription
      originalAttributes
      alternatives
      crossTypesUsed
      promptUsed
      createdAt
    }
  }
`;

const DELETE_PRODUCT_CROSS = `
  mutation DeleteProductCross($crossId: UUID!) {
    deleteProductCross(crossId: $crossId)
  }
`;

const CLEAR_TAKEOFF_CROSSES = `
  mutation ClearTakeoffCrosses($takeoffId: UUID!) {
    clearTakeoffCrosses(takeoffId: $takeoffId)
  }
`;

const GET_TAKEOFF_PRODUCT_CROSSES = `
  query GetTakeoffProductCrosses($takeoffId: UUID!) {
    getTakeoffProductCrosses(takeoffId: $takeoffId) {
      id
      takeoffId
      originalManufacturer
      originalPartNumber
      originalDescription
      originalAttributes
      alternatives
      crossTypesUsed
      promptUsed
      createdAt
    }
  }
`;

/**
 * Save a product cross result to persist it to the database
 */
export async function saveProductCross(
  input: SaveProductCrossInput
): Promise<TakeoffProductCrossResponse> {
  const response = await flowAIGraphQLRequest<{ saveProductCross: TakeoffProductCrossResponse }>({
    query: SAVE_PRODUCT_CROSS,
    variables: {
      input: {
        takeoffId: input.takeoffId,
        originalManufacturer: input.originalManufacturer,
        originalPartNumber: input.originalPartNumber,
        originalDescription: input.originalDescription,
        originalAttributes: input.originalAttributes,
        alternatives: input.alternatives.map(alt => ({
          name: alt.name,
          description: alt.description,
          price: alt.price,
          source: alt.source,
          crossType: alt.crossType,
          attributes: alt.attributes,
          reasoning: alt.reasoning,
          selected: alt.selected || false,
        })),
        crossTypesUsed: input.crossTypesUsed,
        promptUsed: input.promptUsed,
      },
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to save product cross');
  }

  if (!response.data?.saveProductCross) {
    throw new Error('No product cross returned from save mutation');
  }

  return response.data.saveProductCross;
}

/**
 * Select an alternative in a product cross (persists to database)
 */
export async function selectCrossAlternative(
  crossId: string,
  alternativeIndex: number
): Promise<TakeoffProductCrossResponse> {
  const response = await flowAIGraphQLRequest<{ selectCrossAlternative: TakeoffProductCrossResponse }>({
    query: SELECT_CROSS_ALTERNATIVE,
    variables: { crossId, alternativeIndex },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to select cross alternative');
  }

  if (!response.data?.selectCrossAlternative) {
    throw new Error('No product cross returned from select mutation');
  }

  return response.data.selectCrossAlternative;
}

/**
 * Delete an alternative from a product cross (persists to database)
 */
export async function deleteCrossAlternative(
  crossId: string,
  alternativeIndex: number
): Promise<TakeoffProductCrossResponse | null> {
  const response = await flowAIGraphQLRequest<{ deleteCrossAlternative: TakeoffProductCrossResponse | null }>({
    query: DELETE_CROSS_ALTERNATIVE,
    variables: { crossId, alternativeIndex },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete cross alternative');
  }

  return response.data?.deleteCrossAlternative || null;
}

/**
 * Delete an entire product cross
 */
export async function deleteProductCross(crossId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteProductCross: boolean }>({
    query: DELETE_PRODUCT_CROSS,
    variables: { crossId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete product cross');
  }

  return response.data?.deleteProductCross || false;
}

/**
 * Clear all product crosses for a takeoff
 */
export async function clearTakeoffCrosses(takeoffId: string): Promise<number> {
  const response = await flowAIGraphQLRequest<{ clearTakeoffCrosses: number }>({
    query: CLEAR_TAKEOFF_CROSSES,
    variables: { takeoffId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to clear takeoff crosses');
  }

  return response.data?.clearTakeoffCrosses || 0;
}

/**
 * Get all saved product crosses for a takeoff
 * Note: This query may not be implemented in the backend yet
 */
export async function getTakeoffProductCrosses(
  takeoffId: string
): Promise<TakeoffProductCrossResponse[]> {
  try {
    const response = await flowAIGraphQLRequest<{ getTakeoffProductCrosses: TakeoffProductCrossResponse[] }>({
      query: GET_TAKEOFF_PRODUCT_CROSSES,
      variables: { takeoffId },
    });

    if (response.errors) {
      // Log error but don't throw - this query may not be implemented yet
      console.warn('getTakeoffProductCrosses query not available:', response.errors[0]?.message);
      return [];
    }

    return response.data?.getTakeoffProductCrosses || [];
  } catch (error) {
    console.warn('Failed to fetch product crosses (query may not exist):', error);
    return [];
  }
}

// ==================== Prompt Templates ====================

export interface PromptTemplateResponse {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const GET_PROMPT_TEMPLATES = `
  query GetPromptTemplates {
    getPromptTemplates {
      id
      userId
      name
      prompt
      description
      createdAt
      updatedAt
    }
  }
`;

const CREATE_PROMPT_TEMPLATE = `
  mutation CreatePromptTemplate($input: CreatePromptTemplateInput!) {
    createPromptTemplate(input: $input) {
      id
      userId
      name
      prompt
      description
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PROMPT_TEMPLATE = `
  mutation UpdatePromptTemplate($input: UpdatePromptTemplateInput!) {
    updatePromptTemplate(input: $input) {
      id
      userId
      name
      prompt
      description
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PROMPT_TEMPLATE = `
  mutation DeletePromptTemplate($templateId: UUID!) {
    deletePromptTemplate(templateId: $templateId)
  }
`;

/**
 * Get all prompt templates for the current user
 */
export async function getPromptTemplates(): Promise<PromptTemplateResponse[]> {
  const response = await flowAIGraphQLRequest<{ getPromptTemplates: PromptTemplateResponse[] }>({
    query: GET_PROMPT_TEMPLATES,
    variables: {},
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getPromptTemplates || [];
}

/**
 * Create a new prompt template
 */
export async function createPromptTemplate(input: {
  name: string;
  prompt: string;
  description?: string;
}): Promise<PromptTemplateResponse> {
  const response = await flowAIGraphQLRequest<{ createPromptTemplate: PromptTemplateResponse }>({
    query: CREATE_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create prompt template');
  }

  return response.data!.createPromptTemplate;
}

/**
 * Update a prompt template
 */
export async function updatePromptTemplate(input: {
  id: string;
  name?: string;
  prompt?: string;
  description?: string;
}): Promise<PromptTemplateResponse> {
  const response = await flowAIGraphQLRequest<{ updatePromptTemplate: PromptTemplateResponse }>({
    query: UPDATE_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update prompt template');
  }

  return response.data!.updatePromptTemplate;
}

/**
 * Delete a prompt template
 */
export async function deletePromptTemplate(templateId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deletePromptTemplate: boolean }>({
    query: DELETE_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete prompt template');
  }

  return response.data?.deletePromptTemplate || false;
}
