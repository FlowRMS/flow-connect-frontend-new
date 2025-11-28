/**
 * Notes State Management Hook
 */

import { useState } from 'react';
import type { Note, ViewMode } from '../types';
import { INITIAL_NOTES } from '../mockData';
import { filterNotes, getAllTags } from '../utils';

export function useNotesState() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notes data
  const [notes] = useState<Note[]>(INITIAL_NOTES);

  // Modal states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);

  // Derived data
  const tagOptions = getAllTags(notes);
  const filteredNotes = filterNotes(notes, selectedTag, searchQuery);

  return {
    // View state
    viewMode,
    setViewMode,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,

    // Notes data
    notes,
    filteredNotes,
    tagOptions,

    // Modal states
    selectedNote,
    setSelectedNote,
    showSummarizeModal,
    setShowSummarizeModal,
  };
}
