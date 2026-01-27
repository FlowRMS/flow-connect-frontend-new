/**
 * Chunked Upload Utility
 *
 * Provides utilities for uploading large files in chunks with progress tracking.
 * This is useful for files >50MB where network reliability is a concern.
 *
 * NOTE: The current implementation uses the standard upload endpoint with progress tracking.
 * For true multipart uploads to S3, the backend would need to provide:
 * 1. initiate_multipart_upload endpoint
 * 2. get_upload_part_url endpoint (for presigned URLs)
 * 3. complete_multipart_upload endpoint
 *
 * This utility provides the frontend structure for when those endpoints are available.
 */

export interface ChunkedUploadOptions {
  file: File;
  chunkSize?: number; // Default 5MB
  onProgress?: (progress: ChunkedUploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export interface ChunkedUploadProgress {
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  status: 'preparing' | 'uploading' | 'completing' | 'completed' | 'error';
}

// Default chunk size: 5MB
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

// Maximum file size we support: 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Split a file into chunks
 */
export function splitFileIntoChunks(file: File, chunkSize: number = DEFAULT_CHUNK_SIZE): Blob[] {
  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
}

/**
 * Calculate total number of chunks for a file
 */
export function calculateTotalChunks(fileSize: number, chunkSize: number = DEFAULT_CHUNK_SIZE): number {
  return Math.ceil(fileSize / chunkSize);
}

/**
 * Validate file size for upload
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatBytes(file.size)}) exceeds maximum allowed size (${formatBytes(MAX_FILE_SIZE)})`,
    };
  }
  return { valid: true };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Determine if a file should use chunked upload
 * Files larger than 50MB are recommended for chunked upload
 */
export function shouldUseChunkedUpload(file: File): boolean {
  const CHUNKED_UPLOAD_THRESHOLD = 50 * 1024 * 1024; // 50MB
  return file.size > CHUNKED_UPLOAD_THRESHOLD;
}

/**
 * FUTURE IMPLEMENTATION:
 *
 * The chunkedUpload function below is a placeholder for when the backend
 * supports multipart uploads to S3. The flow would be:
 *
 * 1. Call initiateMultipartUpload to get an uploadId
 * 2. For each chunk:
 *    a. Get a presigned URL for that part
 *    b. Upload the chunk directly to S3
 *    c. Collect the ETag returned by S3
 * 3. Call completeMultipartUpload with all ETags to finalize
 *
 * Backend endpoints needed:
 * - POST /api/files/multipart/initiate - Returns uploadId
 * - POST /api/files/multipart/part-url - Returns presigned URL for a part
 * - POST /api/files/multipart/complete - Completes the upload
 * - POST /api/files/multipart/abort - Aborts the upload (cleanup)
 *
 * Example backend mutation signatures:
 *
 * mutation InitiateMultipartUpload($input: InitiateMultipartUploadInput!) {
 *   initiateMultipartUpload(input: $input) {
 *     uploadId
 *     key
 *   }
 * }
 *
 * mutation GetMultipartUploadPartUrl($input: GetMultipartUploadPartUrlInput!) {
 *   getMultipartUploadPartUrl(input: $input) {
 *     presignedUrl
 *     partNumber
 *   }
 * }
 *
 * mutation CompleteMultipartUpload($input: CompleteMultipartUploadInput!) {
 *   completeMultipartUpload(input: $input) {
 *     success
 *     fileUrl
 *   }
 * }
 */

// Placeholder for future chunked upload implementation
// export async function chunkedUpload(options: ChunkedUploadOptions): Promise<string> {
//   const { file, chunkSize = DEFAULT_CHUNK_SIZE, onProgress, onChunkComplete } = options;
//
//   // Validate file size
//   const validation = validateFileSize(file);
//   if (!validation.valid) {
//     throw new Error(validation.error);
//   }
//
//   const chunks = splitFileIntoChunks(file, chunkSize);
//   const totalChunks = chunks.length;
//   let uploadedBytes = 0;
//
//   // Report initial progress
//   onProgress?.({
//     totalBytes: file.size,
//     uploadedBytes: 0,
//     percentage: 0,
//     currentChunk: 0,
//     totalChunks,
//     status: 'preparing',
//   });
//
//   // TODO: Implement when backend supports multipart upload
//   // 1. Initiate multipart upload
//   // 2. Upload each chunk
//   // 3. Complete upload
//
//   throw new Error('Chunked upload not yet implemented - waiting for backend support');
// }
