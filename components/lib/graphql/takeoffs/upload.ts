/**
 * Takeoffs Upload Functions
 * File upload and takeoff creation with files
 */

import { flowAIGraphQLMultipartRequest } from '../flow-ai-client';
import { type FileResponse } from '../files';
import { UPLOAD_TAKEOFF_DOCUMENT } from './mutations';
import { createTakeoff, fetchTakeoff } from './api';
import type {
  TakeoffResponse,
  TakeoffDocumentInput,
  CreateTakeoffInput,
  UploadProgressCallback,
  CreateTakeoffWithFilesInput,
  UploadedFileInfo,
  TakeoffUploadResponse,
} from './types';

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

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, 0, 'uploading');

    try {
      const uploadResult = await uploadFileToFlowAI(file, folderPath);
      onProgress?.(i, 50, 'uploading');

      const crmFile: FileResponse = {
        id: uploadResult.fileId,
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
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return 0;
    }

    // Dynamic import for pdfjs-dist (works with v5.x)
    const pdfjs = await import('pdfjs-dist');

    // Set worker source using unpkg CDN
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    return pdf.numPages;
  } catch {
    // Failed to get PDF page count - return 0 to continue with upload
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
  // Step 1: Get page counts from PDFs (in parallel for performance)
  const pageCountPromises = input.files.map(async (file) => {
    const pages = await getPdfPageCount(file);
    return { name: file.name, pages };
  });
  const pageCounts = await Promise.all(pageCountPromises);
  const pageCountMap = new Map(pageCounts.map(({ name, pages }) => [name, pages]));

  // Step 2: Upload files and get presigned URLs
  let uploadedFiles;
  try {
    uploadedFiles = await uploadFilesToStorage(
      input.files,
      input.title.replace(/[^a-zA-Z0-9]/g, '_'),
      onProgress
    );
  } catch (uploadError) {
    console.error('[createTakeoffWithFiles] S3 Upload failed:', uploadError);
    throw new Error(`S3 Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
  }

  // Step 3: Create takeoff with document file IDs and page counts
  const documents: TakeoffDocumentInput[] = uploadedFiles.map(({ file, crmFile }) => ({
    fileId: crmFile.id,
    pages: pageCountMap.get(file.name) || 0,
    abridged: false,
  }));

  const takeoffInput: CreateTakeoffInput = {
    title: input.title,
    source: input.source || 'Manual Upload',
    status: 'CLASSIFICATION',
    metadata: input.metadata || null,
    documents,
  };

  let result = await createTakeoff(takeoffInput);

  // If documents weren't returned, fetch the takeoff again to get documents
  if (!result.documents || result.documents.length === 0) {
    const refetchedTakeoff = await fetchTakeoff(result.id);
    if (refetchedTakeoff?.documents && refetchedTakeoff.documents.length > 0) {
      result = refetchedTakeoff;
    } else {
      console.warn('[createTakeoffWithFiles] Still no documents after refetch, constructing from input');
      result.documents = uploadedFiles.map(({ file, crmFile, presignedUrl }, index) => ({
        id: `temp-${index}-${Date.now()}`,
        takeoffId: result.id,
        fileId: crmFile.id,
        name: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: crmFile.fileSize || file.size,
        documentUrl: presignedUrl ?? null,
        abridgedUrl: null,
        pages: pageCountMap.get(file.name) || 0,
        abridged: false,
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
 */
export async function uploadFileToTakeoff(
  takeoffId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadedFileInfo> {
  const [uploadedFile] = await uploadFilesToStorage([file], `takeoffs/${takeoffId}`, onProgress);
  return uploadedFile;
}
