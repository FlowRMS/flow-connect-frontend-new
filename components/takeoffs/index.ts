'use client';

/**
 * Takeoffs Module Barrel Exports
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Mock Data
export * from './mockData';

// Utils
export * from './utils';

// Hooks
export { useTakeoffsState } from './hooks/useTakeoffsState';

// Views
export { TakeoffListView } from './views/TakeoffListView';
export { TakeoffDetailView } from './views/TakeoffDetailView';
export { ClassificationTab } from './views/ClassificationTab';
export { ParsingTab } from './views/ParsingTab';
export { ProductCrossDetailView } from './views/ProductCrossDetailView';
export type { CrossType, ProductAlternative, ProductCrossResult } from './views/ProductCrossDetailView';

// Modals
export { UploadModal } from './modals/UploadModal';
export { AbridgmentReportModal } from './modals/AbridgmentReportModal';

// Main Component
export { TakeoffsContent } from './TakeoffsContent';
export { default } from './TakeoffsContent';
