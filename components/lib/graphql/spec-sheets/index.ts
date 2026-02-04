/**
 * Spec Sheets GraphQL Module
 * Re-exports all types and functions for backward compatibility
 */

// Types
export type {
  SpecSheetResponse,
  CreateSpecSheetInput,
  UpdateSpecSheetInput,
  HighlightRegionResponse,
  HighlightVersionResponse,
  CreateHighlightVersionInput,
  HighlightRegionInput,
  FolderResponse,
  CreateFolderInput,
  RenameFolderInput,
  DeleteFolderInput,
  MoveFolderInput,
  MoveSpecSheetToFolderInput,
} from './types';

// API Functions
export {
  // Spec Sheets
  fetchSpecSheet,
  fetchSpecSheetsByFactory,
  searchSpecSheets,
  createSpecSheet,
  updateSpecSheet,
  deleteSpecSheet,
  moveSpecSheetToFolder,
  // Highlights
  fetchHighlightVersions,
  fetchHighlightVersion,
  createHighlightVersion,
  updateHighlightRegions,
  deleteHighlightVersion,
  renameHighlightVersion,
  // Folders
  fetchFoldersByFactory,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
} from './api';
