/**
 * Files GraphQL Module
 * GraphQL queries and mutations for file management
 *
 * This module provides centralized file operations that can be used
 * across all entity types (Quotes, Orders, Jobs, etc.)
 */

import { crmGraphQLRequest, crmGraphQLMultipartRequest, mapFormattedCreatedBy } from './client';
import type { CRMEntityType } from './types';

// ============================================================================
// Types
// ============================================================================

export interface FileCreatedBy {
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  id: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface FileResponse {
  id: string;
  fileName: string;
  filePath: string;
  fileSha?: string;
  fileSize?: number;
  fileType?: string;
  folderId?: string;
  archived: boolean;
  createdAt: string;
  createdBy?: FileCreatedBy | string;
}

export interface FileUploadInput {
  file: File;
  fileName: string;
  folderId?: string;
  folderPath?: string;
}

export interface MultiFileUploadInput {
  files: File[];
  fileNames: string[];
  folderId?: string;
  folderPath?: string;
}

// Entity types that support file linking
export type FileEntityType =
  | 'JOB'
  | 'TASK'
  | 'CONTACT'
  | 'COMPANY'
  | 'NOTE'
  | 'PRE_OPPORTUNITY'
  | 'QUOTE'
  | 'ORDER'
  | 'INVOICE'
  | 'CHECK'
  | 'FACTORY'
  | 'CUSTOMER'
  | 'PRODUCT';

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_FILE = `
  query GetFile($fileId: UUID!) {
    file(fileId: $fileId) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const SEARCH_FILES = `
  query SearchFiles($searchTerm: String!, $limit: Int!) {
    searchFiles(searchTerm: $searchTerm, limit: $limit) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const GET_FILES_BY_LINKED_ENTITY = `
  query GetFilesByLinkedEntity($entityType: EntityType!, $entityId: UUID!) {
    filesByLinkedEntity(entityType: $entityType, entityId: $entityId) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const GET_FILE_PRESIGNED_URL = `
  query GetFilePresignedUrl($fileId: UUID!) {
    filePresignedUrl(fileId: $fileId)
  }
`;

const GET_FILES_BY_FOLDER = `
  query GetFilesByFolder($folderId: UUID!) {
    filesByFolder(folderId: $folderId) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const UPLOAD_FILE = `
  mutation UploadFile($file: Upload!, $fileName: String!, $folderId: UUID, $folderPath: String) {
    uploadFile(input: { file: $file, fileName: $fileName, folderId: $folderId, folderPath: $folderPath }) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const UPLOAD_FILES = `
  mutation UploadFiles($files: [Upload!]!, $fileNames: [String!]!, $folderId: UUID, $folderPath: String) {
    uploadFiles(input: { files: $files, fileNames: $fileNames, folderId: $folderId, folderPath: $folderPath }) {
      id
      fileName
      filePath
      fileSha
      fileSize
      fileType
      folderId
      archived
      createdAt
      createdBy {
        authProviderId
        email
        enabled
        firstName
        fullName
        id
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const ARCHIVE_FILE = `
  mutation ArchiveFile($fileId: UUID!) {
    archiveFile(fileId: $fileId)
  }
`;

const DELETE_FILE = `
  mutation DeleteFile($fileId: UUID!) {
    deleteFile(fileId: $fileId)
  }
`;

const CREATE_LINK = `
  mutation CreateFileLink(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    createLink(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    }) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
    }
  }
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType?: string): string {
  if (!fileType) return 'file';

  const type = fileType.toLowerCase();

  if (type.includes('image')) return 'image';
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('word') || type.includes('doc')) return 'doc';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'spreadsheet';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'presentation';
  if (type.includes('video')) return 'video';
  if (type.includes('audio')) return 'audio';
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return 'archive';
  if (type.includes('text') || type.includes('plain')) return 'text';

  return 'file';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single file by ID
 */
export async function fetchFile(fileId: string): Promise<FileResponse | null> {
  const response = await crmGraphQLRequest<{ file: FileResponse }>({
    query: GET_FILE,
    variables: { fileId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch file');
  }

  return response.data?.file || null;
}

/**
 * Search files by search term
 */
export async function searchFiles(searchTerm: string, limit: number = 20): Promise<FileResponse[]> {
  const response = await crmGraphQLRequest<{ searchFiles: FileResponse[] }>({
    query: SEARCH_FILES,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search files');
  }

  return mapFormattedCreatedBy(response.data?.searchFiles || []);
}

/**
 * Fetch files linked to a specific entity
 */
export async function fetchFilesByLinkedEntity(
  entityType: FileEntityType,
  entityId: string
): Promise<FileResponse[]> {
  const response = await crmGraphQLRequest<{ filesByLinkedEntity: FileResponse[] }>({
    query: GET_FILES_BY_LINKED_ENTITY,
    variables: { entityType, entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch files by linked entity');
  }

  return mapFormattedCreatedBy(response.data?.filesByLinkedEntity || []);
}

/**
 * Fetch files by folder ID
 */
export async function fetchFilesByFolder(folderId: string): Promise<FileResponse[]> {
  const response = await crmGraphQLRequest<{ filesByFolder: FileResponse[] }>({
    query: GET_FILES_BY_FOLDER,
    variables: { folderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch files by folder');
  }

  return mapFormattedCreatedBy(response.data?.filesByFolder || []);
}

/**
 * Get presigned URL for file download
 */
export async function getFilePresignedUrl(fileId: string): Promise<string | null> {
  const response = await crmGraphQLRequest<{ filePresignedUrl: string }>({
    query: GET_FILE_PRESIGNED_URL,
    variables: { fileId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get file presigned URL');
  }

  return response.data?.filePresignedUrl || null;
}

/**
 * Upload a single file
 * Uses multipart form-data following the GraphQL multipart request spec
 */
export async function uploadFile(input: FileUploadInput): Promise<FileResponse> {
  const variables: Record<string, unknown> = {
    file: input.file, // Pass the File object directly - extract-files will handle it
    fileName: input.fileName,
  };
  if (input.folderId) {
    variables.folderId = input.folderId;
  }
  if (input.folderPath) {
    variables.folderPath = input.folderPath;
  }

  const response = await crmGraphQLMultipartRequest<{ uploadFile: FileResponse }>({
    query: UPLOAD_FILE,
    variables,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to upload file');
  }

  if (!response.data?.uploadFile) {
    throw new Error('No file returned from upload mutation');
  }

  return response.data.uploadFile;
}

/**
 * Upload multiple files
 * Uses multipart form-data following the GraphQL multipart request spec
 */
export async function uploadFiles(input: MultiFileUploadInput): Promise<FileResponse[]> {
  const variables: Record<string, unknown> = {
    files: input.files, // Pass File objects directly - extract-files will handle them
    fileNames: input.fileNames,
  };
  if (input.folderId) {
    variables.folderId = input.folderId;
  }
  if (input.folderPath) {
    variables.folderPath = input.folderPath;
  }

  const response = await crmGraphQLMultipartRequest<{ uploadFiles: FileResponse[] }>({
    query: UPLOAD_FILES,
    variables,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to upload files');
  }

  return response.data?.uploadFiles || [];
}

/**
 * Archive a file (soft delete)
 */
export async function archiveFile(fileId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ archiveFile: boolean }>({
    query: ARCHIVE_FILE,
    variables: { fileId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to archive file');
  }

  return response.data?.archiveFile || false;
}

/**
 * Permanently delete a file
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteFile: boolean }>({
    query: DELETE_FILE,
    variables: { fileId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete file');
  }

  return response.data?.deleteFile || false;
}

/**
 * Link a file to an entity
 * Creates a link between the source entity and the uploaded file
 */
export async function linkFileToEntity(
  sourceEntityType: FileEntityType,
  sourceEntityId: string,
  fileId: string
): Promise<{ id: string; createdAt: string }> {
  const response = await crmGraphQLRequest<{
    createLink: {
      id: string;
      sourceEntityType: string;
      sourceEntityId: string;
      targetEntityType: string;
      targetEntityId: string;
      createdAt: string;
    };
  }>({
    query: CREATE_LINK,
    variables: {
      sourceEntityType,
      sourceEntityId,
      targetEntityType: 'FILE',
      targetEntityId: fileId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to link file to entity');
  }

  if (!response.data?.createLink) {
    throw new Error('No link returned from create mutation');
  }

  return {
    id: response.data.createLink.id,
    createdAt: response.data.createLink.createdAt,
  };
}

/**
 * Upload a file and link it to an entity
 * Convenience function that combines upload and link operations
 */
export async function uploadAndLinkFile(
  input: FileUploadInput,
  entityType: FileEntityType,
  entityId: string
): Promise<FileResponse> {
  // First upload the file
  const uploadedFile = await uploadFile(input);

  // Then link it to the entity
  await linkFileToEntity(entityType, entityId, uploadedFile.id);

  return uploadedFile;
}

/**
 * Upload multiple files and link them to an entity
 * Convenience function that combines upload and link operations
 */
export async function uploadAndLinkFiles(
  input: MultiFileUploadInput,
  entityType: FileEntityType,
  entityId: string
): Promise<FileResponse[]> {
  // First upload the files
  const uploadedFiles = await uploadFiles(input);

  // Then link each file to the entity
  await Promise.all(
    uploadedFiles.map((file) => linkFileToEntity(entityType, entityId, file.id))
  );

  return uploadedFiles;
}
