/**
 * Spec Sheets GraphQL Types
 * Type definitions for spec sheets, highlights, and folders
 */

// ============================================================================
// Spec Sheet Types
// ============================================================================

export interface SpecSheetResponse {
  id: string;
  factoryId: string;
  fileName: string;
  displayName: string;
  uploadSource: string;
  sourceUrl: string | null;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
  categories: string[];
  tags: string[] | null;
  folderId: string | null; // pyfiles.folders ID (from File.folder_id)
  needsReview: boolean;
  published: boolean;
  usageCount: number;
  highlightCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

export interface CreateSpecSheetInput {
  factoryId: string;
  fileName: string;
  displayName?: string;
  uploadSource: 'file' | 'url';
  sourceUrl?: string;
  pageCount: number;
  categories: string[];
  tags?: string[];
  folderId?: string;
  needsReview?: boolean;
  published?: boolean;
  file?: File;
}

export interface UpdateSpecSheetInput {
  displayName?: string;
  categories?: string[];
  tags?: string[];
  needsReview?: boolean;
  published?: boolean;
  // Note: To move a spec sheet to a different folder, use moveSpecSheetToFolder mutation
}

// ============================================================================
// Highlight Types
// ============================================================================

export interface HighlightRegionResponse {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: string;
  color: string;
  annotation: string | null;
  tags: string[] | null;
  createdAt: string;
}

export interface HighlightVersionResponse {
  id: string;
  specSheetId: string;
  name: string;
  description: string | null;
  versionNumber: number;
  isActive: boolean;
  regions: HighlightRegionResponse[];
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
  };
}

export interface CreateHighlightVersionInput {
  specSheetId: string;
  name: string;
  description?: string;
  regions?: HighlightRegionInput[];
}

export interface HighlightRegionInput {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: string;
  color: string;
  annotation?: string;
  tags?: string[];
}

// ============================================================================
// Folder Types - using pyfiles.folders with parent_id hierarchy
// ============================================================================

export interface FolderResponse {
  id: string;
  factoryId: string;
  name: string;
  parentId: string | null;
  createdAt: string | null;
  specSheetCount: number;
}

export interface CreateFolderInput {
  factoryId: string;
  parentFolderId?: string | null;
  folderName: string;
}

export interface RenameFolderInput {
  factoryId: string;
  folderId: string;
  newName: string;
}

export interface DeleteFolderInput {
  factoryId: string;
  folderId: string;
}

export interface MoveFolderInput {
  factoryId: string;
  folderId: string;
  newParentId: string | null;
}

export interface MoveSpecSheetToFolderInput {
  specSheetId: string;
  folderId: string | null;
}
