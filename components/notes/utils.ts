/**
 * Utility Functions for Notes
 */

import { AVATAR_COLORS } from './constants';
import type { Note } from './types';

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
 * Get initials from a full name
 */
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Get a consistent avatar color for a name
 */
export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Filter notes based on tag and search query
 */
export function filterNotes(
  notes: Note[],
  selectedTag: string,
  searchQuery: string
): Note[] {
  return notes.filter(note => {
    const matchesTag = selectedTag === 'All' || note.tags.includes(selectedTag);
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });
}

/**
 * Get all unique tags from notes
 */
export function getAllTags(notes: Note[]): string[] {
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  return ['All', ...allTags.sort()];
}

/**
 * Get all unique creators from notes
 */
export function getAllCreators(notes: Note[]): string[] {
  const creators = Array.from(new Set(notes.map(note => note.createdBy)));
  return creators.sort();
}
