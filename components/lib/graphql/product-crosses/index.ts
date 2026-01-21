/**
 * Product Crosses Module
 * Re-exports all product crosses functionality for backward compatibility
 */

// Types
export * from './types';

// Utilities
export { transformResultsToDisplayItems } from './utils';

// AI Cross Functions
export { crossProducts, crossProductsFromDocument } from './ai-cross';

// Known Product Crosses Functions
export {
  getKnownProductCross,
  getKnownProductCrosses,
  getKnownProductCrossesPaginated,
  createKnownProductCross,
  updateKnownProductCross,
  deleteKnownProductCross,
  incrementKnownProductCrossUsage,
  bulkCreateKnownProductCrosses,
} from './known-crosses';

// Prompt Templates Functions
export {
  getCrossPromptTemplate,
  getCrossPromptTemplates,
  getCrossPromptTemplatesPaginated,
  createCrossPromptTemplate,
  updateCrossPromptTemplate,
  deleteCrossPromptTemplate,
  incrementCrossPromptTemplateUsage,
} from './prompt-templates';
