/**
 * Takeoffs GraphQL Module
 * Re-exports all takeoffs functionality
 */

// Types
export type {
  TakeoffStatusEnum,
  TakeoffDocumentResponse,
  TakeoffResponse,
  PageAnalysis,
  ParsedItem,
  TakeoffDocumentInput,
  CreateTakeoffInput,
  UpdateTakeoffInput,
  UpdateTakeoffDocumentInput,
  ClassificationResult,
  AbridgementPageAnalysis,
  AbridgementResult,
  ProductCrossType,
  ProductAlternative,
  ProductCrossResult,
  ParsedProductCross,
  FetchTakeoffsParams,
  TakeoffsPaginatedResult,
  UploadProgressCallback,
  CreateTakeoffWithFilesInput,
  UploadedFileInfo,
  TakeoffUploadResponse,
  ProductCrossAlternative,
  SaveProductCrossInput,
  TakeoffProductCrossResponse,
  PromptTemplateResponse,
} from './types';

// Core API functions
export {
  fetchUserTakeoffs,
  fetchUserTakeoffsPaginated,
  fetchTakeoff,
  createTakeoff,
  updateTakeoff,
  deleteTakeoff,
  updateTakeoffDocument,
} from './api';

// Document processing functions
export {
  classifyDocument,
  abridgeDocument,
  crossProducts,
  productCrossFromParsedDocument,
  parseScheduleDocument,
} from './processing';

// Upload functions
export {
  uploadFilesToStorage,
  createTakeoffWithFiles,
  uploadFileToTakeoff,
} from './upload';

// Product cross persistence functions
export {
  saveProductCross,
  selectCrossAlternative,
  deleteCrossAlternative,
  deleteProductCross,
  clearTakeoffCrosses,
  getTakeoffProductCrosses,
} from './product-crosses';

// Prompt template functions
export {
  getPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
} from './prompt-templates';
