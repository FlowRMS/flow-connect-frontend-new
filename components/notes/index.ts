/**
 * Notes Module - Main Exports
 */

// Main component
export { default as NotesContent } from './NotesContent';

// Types
export type { Note, Comment, ViewMode, SummarizeFilters } from './types';

// Utilities
export {
  formatDate,
  formatTimestamp,
  getInitials,
  getAvatarColor,
  filterNotes,
  getAllTags,
  getAllCreators,
} from './utils';

// Constants
export {
  AVATAR_COLORS,
  DATE_RANGES,
  SUMMARY_TYPES,
  AVAILABLE_TAGS,
  ENTITY_TYPES,
} from './constants';

// Mock Data
export { INITIAL_NOTES, MOCK_COMMENTS, getCommentsForNote } from './mockData';
