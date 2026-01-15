/**
 * Spec Sheets GraphQL Module
 * GraphQL queries and API functions for Spec Sheets
 */

import { crmGraphQLRequest, crmGraphQLMultipartRequest, formatCreatedBy } from './client';

// ============================================================================
// Types
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
  folderPath: string | null;
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

export interface CreateSpecSheetInput {
  factoryId: string;
  fileName: string;
  displayName?: string;
  uploadSource: 'file' | 'url';
  sourceUrl?: string;
  pageCount: number;
  categories: string[];
  tags?: string[];
  folderPath?: string;
  needsReview?: boolean;
  published?: boolean;
  file?: File;
}

export interface UpdateSpecSheetInput {
  displayName?: string;
  categories?: string[];
  tags?: string[];
  folderPath?: string;
  needsReview?: boolean;
  published?: boolean;
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

// Folder Types
export interface FolderResponse {
  id: string;
  factoryId: string;
  folderPath: string;
  createdAt: string | null;
  specSheetCount: number;
}

export interface RenameFolderResult {
  folder: FolderResponse;
  specSheetsUpdated: number;
}

export interface CreateFolderInput {
  factoryId: string;
  parentPath: string;
  folderName: string;
}

export interface RenameFolderInput {
  factoryId: string;
  folderPath: string;
  newName: string;
}

export interface DeleteFolderInput {
  factoryId: string;
  folderPath: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_SPEC_SHEET = `
  query GetSpecSheet($id: UUID!) {
    specSheet(id: $id) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderPath
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

const GET_SPEC_SHEETS_BY_FACTORY = `
  query GetSpecSheetsByFactory($factoryId: UUID!, $publishedOnly: Boolean) {
    specSheetsByFactory(factoryId: $factoryId, publishedOnly: $publishedOnly) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderPath
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

const SEARCH_SPEC_SHEETS = `
  query SearchSpecSheets(
    $searchTerm: String
    $factoryId: UUID
    $categories: [String!]
    $publishedOnly: Boolean
    $limit: Int
  ) {
    specSheetSearch(
      searchTerm: $searchTerm
      factoryId: $factoryId
      categories: $categories
      publishedOnly: $publishedOnly
      limit: $limit
    ) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderPath
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

const GET_HIGHLIGHT_VERSIONS = `
  query GetHighlightVersions($specSheetId: UUID!) {
    highlightVersionsBySpecSheet(specSheetId: $specSheetId) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

const GET_HIGHLIGHT_VERSION = `
  query GetHighlightVersion($id: UUID!) {
    highlightVersion(id: $id) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

const GET_FOLDERS_BY_FACTORY = `
  query GetFoldersByFactory($factoryId: UUID!) {
    foldersByFactory(factoryId: $factoryId) {
      id
      factoryId
      folderPath
      createdAt
      specSheetCount
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_FOLDER = `
  mutation CreateFolder($input: CreateFolderInput!) {
    createFolder(input: $input) {
      id
      factoryId
      folderPath
      createdAt
      specSheetCount
    }
  }
`;

const RENAME_FOLDER = `
  mutation RenameFolder($input: RenameFolderInput!) {
    renameFolder(input: $input) {
      folder {
        id
        factoryId
        folderPath
        createdAt
        specSheetCount
      }
      specSheetsUpdated
    }
  }
`;

const DELETE_FOLDER = `
  mutation DeleteFolder($input: DeleteFolderInput!) {
    deleteFolder(input: $input)
  }
`;

const CREATE_SPEC_SHEET = `
  mutation CreateSpecSheet($input: CreateSpecSheetInput!) {
    createSpecSheet(input: $input) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderPath
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

const UPDATE_SPEC_SHEET = `
  mutation UpdateSpecSheet($id: UUID!, $input: UpdateSpecSheetInput!) {
    updateSpecSheet(id: $id, input: $input) {
      id
      factoryId
      fileName
      displayName
      uploadSource
      sourceUrl
      fileUrl
      fileSize
      pageCount
      categories
      tags
      folderPath
      needsReview
      published
      usageCount
      highlightCount
      createdAt
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
    }
  }
`;

const DELETE_SPEC_SHEET = `
  mutation DeleteSpecSheet($id: UUID!) {
    deleteSpecSheet(id: $id)
  }
`;

const CREATE_HIGHLIGHT_VERSION = `
  mutation CreateHighlightVersion($input: CreateHighlightVersionInput!) {
    createHighlightVersion(input: $input) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

const UPDATE_HIGHLIGHT_REGIONS = `
  mutation UpdateHighlightRegions($input: UpdateHighlightRegionsInput!) {
    updateHighlightRegions(input: $input) {
      id
      specSheetId
      name
      description
      versionNumber
      isActive
      regions {
        id
        pageNumber
        x
        y
        width
        height
        shapeType
        color
        annotation
        tags
        createdAt
      }
      createdAt
      createdBy {
        id
        fullName
      }
    }
  }
`;

const DELETE_HIGHLIGHT_VERSION = `
  mutation DeleteHighlightVersion($id: UUID!) {
    deleteHighlightVersion(id: $id)
  }
`;

const MOVE_FOLDER = `
  mutation MoveFolder($factoryId: UUID!, $oldFolderPath: String!, $newFolderPath: String!) {
    moveSpecSheetFolder(factoryId: $factoryId, oldFolderPath: $oldFolderPath, newFolderPath: $newFolderPath)
  }
`;

// ============================================================================
// API Functions - Queries
// ============================================================================

export async function fetchSpecSheet(id: string): Promise<SpecSheetResponse | null> {
  const response = await crmGraphQLRequest<{ specSheet: SpecSheetResponse }>({
    query: GET_SPEC_SHEET,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch spec sheet');
  }

  const specSheet = response.data?.specSheet;
  return specSheet ? { ...specSheet, createdBy: { ...specSheet.createdBy, fullName: formatCreatedBy(specSheet.createdBy) } as typeof specSheet.createdBy } : null;
}

export async function fetchSpecSheetsByFactory(
  factoryId: string,
  publishedOnly: boolean = true
): Promise<SpecSheetResponse[]> {
  const response = await crmGraphQLRequest<{ specSheetsByFactory: SpecSheetResponse[] }>({
    query: GET_SPEC_SHEETS_BY_FACTORY,
    variables: { factoryId, publishedOnly },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch spec sheets');
  }

  return response.data?.specSheetsByFactory || [];
}

export async function searchSpecSheets(params: {
  searchTerm?: string;
  factoryId?: string;
  categories?: string[];
  publishedOnly?: boolean;
  limit?: number;
}): Promise<SpecSheetResponse[]> {
  const response = await crmGraphQLRequest<{ specSheetSearch: SpecSheetResponse[] }>({
    query: SEARCH_SPEC_SHEETS,
    variables: params,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search spec sheets');
  }

  return response.data?.specSheetSearch || [];
}

export async function fetchHighlightVersions(specSheetId: string): Promise<HighlightVersionResponse[]> {
  const response = await crmGraphQLRequest<{ highlightVersionsBySpecSheet: HighlightVersionResponse[] }>({
    query: GET_HIGHLIGHT_VERSIONS,
    variables: { specSheetId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch highlight versions');
  }

  return response.data?.highlightVersionsBySpecSheet || [];
}

export async function fetchHighlightVersion(id: string): Promise<HighlightVersionResponse | null> {
  const response = await crmGraphQLRequest<{ highlightVersion: HighlightVersionResponse }>({
    query: GET_HIGHLIGHT_VERSION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch highlight version');
  }

  return response.data?.highlightVersion || null;
}

// ============================================================================
// API Functions - Mutations
// ============================================================================

export async function createSpecSheet(input: CreateSpecSheetInput): Promise<SpecSheetResponse> {
  // If there's a file, use multipart request
  if (input.file) {
    const response = await crmGraphQLMultipartRequest<{ createSpecSheet: SpecSheetResponse }>({
      query: CREATE_SPEC_SHEET,
      variables: { input },
    });

    if (response.errors) {
      throw new Error(response.errors[0]?.message || 'Failed to create spec sheet');
    }

    if (!response.data?.createSpecSheet) {
      throw new Error('No spec sheet returned from create mutation');
    }

    return response.data.createSpecSheet;
  }

  // Otherwise use regular request
  const response = await crmGraphQLRequest<{ createSpecSheet: SpecSheetResponse }>({
    query: CREATE_SPEC_SHEET,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create spec sheet');
  }

  if (!response.data?.createSpecSheet) {
    throw new Error('No spec sheet returned from create mutation');
  }

  return response.data.createSpecSheet;
}

export async function updateSpecSheet(id: string, input: UpdateSpecSheetInput): Promise<SpecSheetResponse> {
  const response = await crmGraphQLRequest<{ updateSpecSheet: SpecSheetResponse }>({
    query: UPDATE_SPEC_SHEET,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update spec sheet');
  }

  if (!response.data?.updateSpecSheet) {
    throw new Error('No spec sheet returned from update mutation');
  }

  return response.data.updateSpecSheet;
}

export async function deleteSpecSheet(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteSpecSheet: boolean }>({
    query: DELETE_SPEC_SHEET,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete spec sheet');
  }

  return response.data?.deleteSpecSheet || false;
}

export async function createHighlightVersion(input: CreateHighlightVersionInput): Promise<HighlightVersionResponse> {
  const response = await crmGraphQLRequest<{ createHighlightVersion: HighlightVersionResponse }>({
    query: CREATE_HIGHLIGHT_VERSION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create highlight version');
  }

  if (!response.data?.createHighlightVersion) {
    throw new Error('No highlight version returned from create mutation');
  }

  return response.data.createHighlightVersion;
}

export async function updateHighlightRegions(
  versionId: string,
  regions: HighlightRegionInput[]
): Promise<HighlightVersionResponse> {
  const response = await crmGraphQLRequest<{ updateHighlightRegions: HighlightVersionResponse }>({
    query: UPDATE_HIGHLIGHT_REGIONS,
    variables: { input: { versionId, regions } },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update highlight regions');
  }

  if (!response.data?.updateHighlightRegions) {
    throw new Error('No highlight version returned from update mutation');
  }

  return response.data.updateHighlightRegions;
}

export async function deleteHighlightVersion(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteHighlightVersion: boolean }>({
    query: DELETE_HIGHLIGHT_VERSION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete highlight version');
  }

  return response.data?.deleteHighlightVersion || false;
}

export async function moveFolder(
  factoryId: string,
  oldFolderPath: string,
  newFolderPath: string
): Promise<number> {
  const response = await crmGraphQLRequest<{ moveSpecSheetFolder: number }>({
    query: MOVE_FOLDER,
    variables: { factoryId, oldFolderPath, newFolderPath },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to move folder');
  }

  return response.data?.moveSpecSheetFolder || 0;
}

// ============================================================================
// API Functions - Folders
// ============================================================================

export async function fetchFoldersByFactory(factoryId: string): Promise<FolderResponse[]> {
  const response = await crmGraphQLRequest<{ foldersByFactory: FolderResponse[] }>({
    query: GET_FOLDERS_BY_FACTORY,
    variables: { factoryId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch folders');
  }

  return response.data?.foldersByFactory || [];
}

export async function createFolder(input: CreateFolderInput): Promise<FolderResponse> {
  const response = await crmGraphQLRequest<{ createFolder: FolderResponse }>({
    query: CREATE_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create folder');
  }

  if (!response.data?.createFolder) {
    throw new Error('No folder returned from create mutation');
  }

  return response.data.createFolder;
}

export async function renameFolder(input: RenameFolderInput): Promise<RenameFolderResult> {
  const response = await crmGraphQLRequest<{ renameFolder: RenameFolderResult }>({
    query: RENAME_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to rename folder');
  }

  if (!response.data?.renameFolder) {
    throw new Error('No result returned from rename mutation');
  }

  return response.data.renameFolder;
}

export async function deleteFolder(input: DeleteFolderInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteFolder: boolean }>({
    query: DELETE_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete folder');
  }

  return response.data?.deleteFolder || false;
}
