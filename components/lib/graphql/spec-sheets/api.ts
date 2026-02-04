/**
 * Spec Sheets API Functions
 * Functions for making GraphQL requests
 */

import { crmGraphQLRequest, crmGraphQLMultipartRequest, formatCreatedBy } from '../client';
import type {
  SpecSheetResponse,
  HighlightVersionResponse,
  CreateSpecSheetInput,
  UpdateSpecSheetInput,
  CreateHighlightVersionInput,
  HighlightRegionInput,
  FolderResponse,
  CreateFolderInput,
  RenameFolderInput,
  DeleteFolderInput,
  MoveFolderInput,
  MoveSpecSheetToFolderInput,
} from './types';
import {
  GET_SPEC_SHEET,
  GET_SPEC_SHEETS_BY_FACTORY,
  SEARCH_SPEC_SHEETS,
  GET_HIGHLIGHT_VERSIONS,
  GET_HIGHLIGHT_VERSION,
  GET_FOLDERS_BY_FACTORY,
} from './queries';
import {
  CREATE_SPEC_SHEET,
  UPDATE_SPEC_SHEET,
  DELETE_SPEC_SHEET,
  CREATE_HIGHLIGHT_VERSION,
  UPDATE_HIGHLIGHT_REGIONS,
  DELETE_HIGHLIGHT_VERSION,
  RENAME_HIGHLIGHT_VERSION,
  CREATE_FOLDER,
  RENAME_FOLDER,
  DELETE_FOLDER,
  MOVE_FOLDER,
  MOVE_SPEC_SHEET_TO_FOLDER,
} from './mutations';

// ============================================================================
// Spec Sheet API Functions
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
  return specSheet
    ? { ...specSheet, createdBy: { ...specSheet.createdBy, fullName: formatCreatedBy(specSheet.createdBy) } as typeof specSheet.createdBy }
    : null;
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

export async function createSpecSheet(input: CreateSpecSheetInput): Promise<SpecSheetResponse> {
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

export async function moveSpecSheetToFolder(input: MoveSpecSheetToFolderInput): Promise<SpecSheetResponse> {
  const response = await crmGraphQLRequest<{ moveSpecSheetToFolder: SpecSheetResponse }>({
    query: MOVE_SPEC_SHEET_TO_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to move spec sheet to folder');
  }

  if (!response.data?.moveSpecSheetToFolder) {
    throw new Error('No spec sheet returned from move mutation');
  }

  return response.data.moveSpecSheetToFolder;
}

// ============================================================================
// Highlight API Functions
// ============================================================================

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

export async function renameHighlightVersion(
  id: string,
  name: string
): Promise<HighlightVersionResponse> {
  const response = await crmGraphQLRequest<{ updateHighlightVersion: HighlightVersionResponse }>({
    query: RENAME_HIGHLIGHT_VERSION,
    variables: { id, input: { name } },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to rename highlight version');
  }

  if (!response.data?.updateHighlightVersion) {
    throw new Error('No highlight version returned from rename mutation');
  }

  return response.data.updateHighlightVersion;
}

// ============================================================================
// Folder API Functions
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
  const response = await crmGraphQLRequest<{ createSpecSheetFolder: FolderResponse }>({
    query: CREATE_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create folder');
  }

  if (!response.data?.createSpecSheetFolder) {
    throw new Error('No folder returned from create mutation');
  }

  return response.data.createSpecSheetFolder;
}

export async function renameFolder(input: RenameFolderInput): Promise<FolderResponse> {
  const response = await crmGraphQLRequest<{ renameSpecSheetFolder: FolderResponse }>({
    query: RENAME_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to rename folder');
  }

  if (!response.data?.renameSpecSheetFolder) {
    throw new Error('No folder returned from rename mutation');
  }

  return response.data.renameSpecSheetFolder;
}

export async function deleteFolder(input: DeleteFolderInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteSpecSheetFolder: boolean }>({
    query: DELETE_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete folder');
  }

  return response.data?.deleteSpecSheetFolder || false;
}

export async function moveFolder(input: MoveFolderInput): Promise<FolderResponse> {
  const response = await crmGraphQLRequest<{ moveSpecSheetFolder: FolderResponse }>({
    query: MOVE_FOLDER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to move folder');
  }

  if (!response.data?.moveSpecSheetFolder) {
    throw new Error('No folder returned from move mutation');
  }

  return response.data.moveSpecSheetFolder;
}
