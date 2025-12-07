/**
 * Utility Functions for Notes
 */

import { AVATAR_COLORS } from './constants';
import type { Note, ParsedNote, NoteConversation, NoteLandingPage, LinkedTitle } from './types';
import type { ActiveFilter } from '../AdvancedFilters';

/**
 * Convert mentions array to string for API
 * Note: The API expects a single UUID, not comma-separated.
 * If multiple mentions exist, we use the first one.
 * For multiple mentions, use entity links instead.
 */
export function getMentionsString(mentions: Array<{ id: string; name: string }>): string {
  if (mentions.length === 0) return '';
  // API expects a single UUID, use the first mention
  return mentions[0].id;
}

/**
 * Parse a comma-separated string into an array
 * Handles cases where the value might not be a string
 */
export function parseCommaSeparated(value: string | null | undefined | unknown): string[] {
  if (value === null || value === undefined) return [];
  // Convert to string if not already a string
  const strValue = typeof value === 'string' ? value : String(value);
  if (strValue.trim() === '') return [];
  return strValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Parse linkedTitles array into array of LinkedTitle objects
 * Format from API: ["TYPE:Name", "TYPE:Name"] e.g. ["JOB:Job Name", "COMPANY:Company Name"]
 * Or just names without type prefix: ["BERKELEY"]
 */
export function parseLinkedTitles(value: string[] | null | undefined): LinkedTitle[] {
  if (!value || !Array.isArray(value) || value.length === 0) return [];

  return value.map(item => {
    if (!item || typeof item !== 'string') return { type: 'UNKNOWN', name: '' };
    const trimmed = item.trim();
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      // No colon found, treat entire string as name with unknown type
      return { type: 'UNKNOWN', name: trimmed };
    }
    return {
      type: trimmed.substring(0, colonIndex).trim().toUpperCase(),
      name: trimmed.substring(colonIndex + 1).trim()
    };
  }).filter(item => item.name.length > 0);
}

/**
 * Convert an array to a comma-separated string
 */
export function toCommaSeparated(arr: string[]): string {
  return arr.join(', ');
}

/**
 * Convert API Note to ParsedNote with arrays for easier UI handling
 */
export function parseNote(note: Note): ParsedNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    mentions: parseCommaSeparated(note.mentions),
    tags: parseCommaSeparated(note.tags),
    linkedTitles: [], // Note detail doesn't have linkedTitles, use relatedEntities for detail view
    createdBy: note.createdBy,
    createdAt: note.createdAt,
  };
}

/**
 * Convert NoteLandingPage to ParsedNote with arrays for easier UI handling
 * Note: Landing page doesn't include mentions, so we set it to empty array
 */
export function parseNoteLandingPage(note: NoteLandingPage): ParsedNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    mentions: [], // Landing page doesn't include mentions
    tags: parseCommaSeparated(note.tags),
    linkedTitles: parseLinkedTitles(note.linkedTitles),
    createdBy: note.createdBy,
    createdAt: note.createdAt,
  };
}

/**
 * Convert an array of API Notes to ParsedNotes
 */
export function parseNotes(notes: Note[]): ParsedNote[] {
  return notes.map(parseNote);
}

/**
 * Convert an array of NoteLandingPage to ParsedNotes
 */
export function parseNoteLandingPages(notes: NoteLandingPage[]): ParsedNote[] {
  return notes.map(parseNoteLandingPage);
}

/**
 * Format a date string into a human-readable relative time
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/**
 * Format a timestamp into a readable date and time
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp into a short readable time
 */
export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get initials from a full name or email
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  // Handle email-style names
  if (name.includes('@')) {
    const localPart = name.split('@')[0];
    return localPart.substring(0, 2).toUpperCase();
  }
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

/**
 * Get a consistent avatar color for a name
 */
export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Filter notes based on tag and search query
 */
export function filterNotes(
  notes: ParsedNote[],
  selectedTag: string,
  searchQuery: string
): ParsedNote[] {
  return notes.filter(note => {
    const matchesTag = selectedTag === 'All' || note.tags.includes(selectedTag);
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.mentions.some(mention => mention.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });
}

/**
 * Get all unique tags from notes
 */
export function getAllTags(notes: ParsedNote[]): string[] {
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  return ['All', ...allTags.sort()];
}

/**
 * Get all unique creators from notes
 */
export function getAllCreators(notes: ParsedNote[]): string[] {
  const creators = Array.from(new Set(notes.map(note => note.createdBy)));
  return creators.sort();
}

/**
 * Get all unique titles from notes
 */
export function getAllTitles(notes: ParsedNote[]): string[] {
  const titles = Array.from(new Set(notes.map(note => note.title)));
  return titles.sort();
}

/**
 * Get all unique tags (flattened) from notes
 */
export function getUniqueTags(notes: ParsedNote[]): string[] {
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  return allTags.filter(Boolean).sort();
}

/**
 * Apply a single advanced filter to a note
 */
export function applyNoteFilter(note: ParsedNote, filter: ActiveFilter): boolean {
  const columnName = filter.columnName;
  let value: string;
  
  // Handle special cases for array fields
  if (columnName === 'tags') {
    value = note.tags.join(',').toLowerCase();
  } else if (columnName === 'mentions') {
    value = note.mentions.join(',').toLowerCase();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value = String((note as any)[columnName] || '').toLowerCase();
  }
  
  const filterValue = String(filter.value || '').toLowerCase();

  // Handle IN operator for multi-select
  if (filter.operator === 'IN' && filter.values) {
    // For array fields like tags, check if any tag matches any filter value
    if (columnName === 'tags') {
      return filter.values.some(v => 
        note.tags.some(tag => tag.toLowerCase() === String(v).toLowerCase())
      );
    }
    return filter.values.some(v => String(v).toLowerCase() === value);
  }

  switch (filter.operator) {
    case 'EQ':
      return value === filterValue;
    case 'NE':
      return value !== filterValue;
    case 'ILIKE':
    case 'LIKE':
      return value.includes(filterValue);
    case 'BEGINS_WITH':
      return value.startsWith(filterValue);
    case 'ENDS_WITH':
      return value.endsWith(filterValue);
    case 'IS_NULL':
      return !value || value === '';
    case 'IS_NOT_NULL':
      return !!(value && value !== '');
    default:
      return true;
  }
}

/**
 * Sort notes by a column
 */
export function sortNotes(
  notes: ParsedNote[],
  sortColumn: string,
  sortDirection: 'ASC' | 'DESC'
): ParsedNote[] {
  return [...notes].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    
    // Handle special cases
    if (sortColumn === 'tags') {
      aVal = a.tags.join(',');
      bVal = b.tags.join(',');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      aVal = String((a as any)[sortColumn] || '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bVal = String((b as any)[sortColumn] || '');
    }
    
    const comparison = aVal.localeCompare(bVal);
    return sortDirection === 'ASC' ? comparison : -comparison;
  });
}

/**
 * Convert NoteConversation to legacy Comment format
 */
export function conversationToComment(conversation: NoteConversation): { id: string; author: string; content: string; timestamp: string } {
  return {
    id: conversation.id,
    author: 'Unknown', // createdBy not available from API
    content: conversation.content,
    timestamp: conversation.createdAt,
  };
}
