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
// Folder Types
// ============================================================================

export interface FolderResponse {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  archived: boolean;
  createdAt: string;
  createdBy?: FileCreatedBy | string;
}

export interface FolderWithContents extends FolderResponse {
  children: FolderResponse[];
  files: FileResponse[];
  parent?: FolderResponse;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  folderId: string;
  name?: string;
  description?: string;
  parentId?: string;
}

export interface MoveFolderInput {
  factoryId: string;
  oldFolderPath: string;
  newFolderPath: string;
}

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
// Folder GraphQL Queries
// ============================================================================

const GET_ROOT_FOLDERS = `
  query GetRootFolders {
    rootFolders {
      id
      name
      description
      parentId
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

const GET_FOLDER = `
  query GetFolder($folderId: UUID!) {
    folder(folderId: $folderId) {
      id
      name
      description
      parentId
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

const GET_FOLDER_WITH_CONTENTS = `
  query GetFolderWithContents($folderId: UUID!) {
    folderWithContents(folderId: $folderId) {
      id
      name
      description
      parentId
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
      children {
        id
        name
        description
        parentId
        archived
        createdAt
      }
      files {
        id
        fileName
        filePath
        fileSha
        fileSize
        fileType
        folderId
        archived
        createdAt
      }
      parent {
        id
        name
        description
        parentId
        archived
        createdAt
      }
    }
  }
`;

const GET_FOLDERS_BY_PARENT = `
  query GetFoldersByParent($parentId: UUID!) {
    foldersByParent(parentId: $parentId) {
      id
      name
      description
      parentId
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

const SEARCH_FOLDERS = `
  query SearchFolders($searchTerm: String!, $limit: Int!) {
    searchFolders(searchTerm: $searchTerm, limit: $limit) {
      id
      name
      description
      parentId
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
// Folder GraphQL Mutations
// ============================================================================

const CREATE_FOLDER = `
  mutation CreateFolder($name: String!, $description: String, $parentId: UUID) {
    createFolder(input: { name: $name, description: $description, parentId: $parentId }) {
      id
      name
      description
      parentId
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

const UPDATE_FOLDER = `
  mutation UpdateFolder($folderId: UUID!, $name: String, $description: String, $parentId: UUID) {
    updateFolder(input: { folderId: $folderId, name: $name, description: $description, parentId: $parentId }) {
      id
      name
      description
      parentId
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

const ARCHIVE_FOLDER = `
  mutation ArchiveFolder($folderId: UUID!) {
    archiveFolder(folderId: $folderId)
  }
`;

const DELETE_FOLDER = `
  mutation DeleteFolder($folderId: UUID!) {
    deleteFolder(folderId: $folderId)
  }
`;

const MOVE_FOLDER = `
  mutation MoveFolder($factoryId: UUID!, $oldFolderPath: String!, $newFolderPath: String!) {
    moveFolder(input: { factoryId: $factoryId, oldFolderPath: $oldFolderPath, newFolderPath: $newFolderPath })
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

// ============================================================================
// Folder API Functions
// ============================================================================

/**
 * Fetch root folders (folders without a parent)
 */
export async function fetchRootFolders(): Promise<FolderResponse[]> {
  const response = await crmGraphQLRequest<{ rootFolders: FolderResponse[] }>({
    query: GET_ROOT_FOLDERS,
    variables: {},
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch root folders');
  }

  const folders = response.data?.rootFolders || [];
  return folders.filter(f => !f.archived);
}

/**
 * Fetch a single folder by ID
 */
export async function fetchFolder(folderId: string): Promise<FolderResponse | null> {
  const response = await crmGraphQLRequest<{ folder: FolderResponse }>({
    query: GET_FOLDER,
    variables: { folderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch folder');
  }

  return response.data?.folder || null;
}

/**
 * Fetch a folder with its contents (child folders and files)
 */
export async function fetchFolderWithContents(folderId: string): Promise<FolderWithContents | null> {
  const response = await crmGraphQLRequest<{ folderWithContents: FolderWithContents }>({
    query: GET_FOLDER_WITH_CONTENTS,
    variables: { folderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch folder with contents');
  }

  const folder = response.data?.folderWithContents;
  if (!folder) return null;

  // Filter out archived children and files
  return {
    ...folder,
    children: (folder.children || []).filter(f => !f.archived),
    files: (folder.files || []).filter(f => !f.archived),
  };
}

/**
 * Fetch child folders by parent ID
 */
export async function fetchFoldersByParent(parentId: string): Promise<FolderResponse[]> {
  const response = await crmGraphQLRequest<{ foldersByParent: FolderResponse[] }>({
    query: GET_FOLDERS_BY_PARENT,
    variables: { parentId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch folders by parent');
  }

  const folders = response.data?.foldersByParent || [];
  return folders.filter(f => !f.archived);
}

/**
 * Search folders by name
 */
export async function searchFolders(searchTerm: string, limit: number = 10): Promise<FolderResponse[]> {
  const response = await crmGraphQLRequest<{ searchFolders: FolderResponse[] }>({
    query: SEARCH_FOLDERS,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search folders');
  }

  const folders = response.data?.searchFolders || [];
  return folders.filter(f => !f.archived);
}

/**
 * Create a new folder
 */
export async function createFolder(input: CreateFolderInput): Promise<FolderResponse> {
  const response = await crmGraphQLRequest<{ createFolder: FolderResponse }>({
    query: CREATE_FOLDER,
    variables: {
      name: input.name,
      description: input.description || null,
      parentId: input.parentId || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create folder');
  }

  if (!response.data?.createFolder) {
    throw new Error('No folder returned from create mutation');
  }

  return response.data.createFolder;
}

/**
 * Update a folder
 */
export async function updateFolder(input: UpdateFolderInput): Promise<FolderResponse> {
  const response = await crmGraphQLRequest<{ updateFolder: FolderResponse }>({
    query: UPDATE_FOLDER,
    variables: {
      folderId: input.folderId,
      name: input.name || null,
      description: input.description || null,
      parentId: input.parentId || null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update folder');
  }

  if (!response.data?.updateFolder) {
    throw new Error('No folder returned from update mutation');
  }

  return response.data.updateFolder;
}

/**
 * Archive a folder (soft delete)
 */
export async function archiveFolder(folderId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ archiveFolder: boolean }>({
    query: ARCHIVE_FOLDER,
    variables: { folderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to archive folder');
  }

  return response.data?.archiveFolder || false;
}

/**
 * Permanently delete a folder
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteFolder: boolean }>({
    query: DELETE_FOLDER,
    variables: { folderId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete folder');
  }

  return response.data?.deleteFolder || false;
}

/**
 * Move a folder to a new location
 */
export async function moveFolder(input: MoveFolderInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ moveFolder: boolean }>({
    query: MOVE_FOLDER,
    variables: {
      factoryId: input.factoryId,
      oldFolderPath: input.oldFolderPath,
      newFolderPath: input.newFolderPath,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to move folder');
  }

  return response.data?.moveFolder || false;
}

/**
 * Build folder path (breadcrumb trail) from a folder to root
 * Recursively fetches parent folders to construct the path
 */
export async function buildFolderPath(folderId: string): Promise<FolderResponse[]> {
  const path: FolderResponse[] = [];
  let currentId: string | undefined = folderId;

  while (currentId) {
    const folder = await fetchFolder(currentId);
    if (!folder) break;
    path.unshift(folder);
    currentId = folder.parentId;
  }

  return path;
}
