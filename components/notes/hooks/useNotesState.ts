/**
 * Notes State Management Hook
 * Integrates with the new Notes API for fetching and managing notes
 */

import { useState, useMemo } from 'react';
import type { ParsedNote, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../AdvancedFilters';
import { useNotes } from '../api/useNotesApi';
import { 
  filterNotes, 
  getAllTags, 
  parseCommaSeparated, 
  applyNoteFilter, 
  sortNotes,
  getAllTitles,
  getUniqueTags,
  getAllCreators,
} from '../utils';

/**
 * Parse API note to ParsedNote format
 */
function parseApiNote(note: {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdBy: string;
  createdAt: string;
}): ParsedNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    mentions: parseCommaSeparated(note.mentions),
    tags: parseCommaSeparated(note.tags),
    createdBy: note.createdBy,
    createdAt: note.createdAt,
  };
}

export function useNotesState() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [selectedNote, setSelectedNote] = useState<ParsedNote | null>(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ParsedNote | null>(null);

  // Advanced filtering and sorting state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | undefined>(undefined);
  const [activeSorts, setActiveSorts] = useState<ActiveSort[]>([]);
  const [activeSort, setActiveSort] = useState<ActiveSort | undefined>(undefined);

  // Fetch notes from API using the new notes endpoint
  const { data: rawNotes, isLoading, error, refetch } = useNotes();

  // Parse notes from API format to UI format
  const notes = useMemo(() => {
    if (!rawNotes) return [];
    return rawNotes.map(parseApiNote);
  }, [rawNotes]);

  // Calculate unique values for filter options
  const uniqueTitles = useMemo(() => getAllTitles(notes), [notes]);
  const uniqueTags = useMemo(() => getUniqueTags(notes), [notes]);
  const uniqueCreators = useMemo(() => getAllCreators(notes), [notes]);

  // Derived data - tag options for legacy tag filter
  const tagOptions = useMemo(() => getAllTags(notes), [notes]);

  // Apply advanced filters, search, and sorting
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Apply advanced filters (multi-select)
    if (activeFilters.length > 0) {
      result = result.filter((note) => 
        activeFilters.every(filter => applyNoteFilter(note, filter))
      );
    } else if (activeFilter) {
      // Backward compatibility for single filter
      result = result.filter((note) => applyNoteFilter(note, activeFilter));
    }

    // Apply legacy tag filter and search
    result = filterNotes(result, selectedTag, searchQuery);

    // Apply sorting (multi-sort)
    if (activeSorts.length > 0) {
      result = [...result].sort((a, b) => {
        for (const sort of activeSorts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aVal = String((a as any)[sort.columnName] || '');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bVal = String((b as any)[sort.columnName] || '');
          const comparison = aVal.localeCompare(bVal);
          if (comparison !== 0) {
            return sort.direction === 'ASC' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } else if (activeSort) {
      // Backward compatibility for single sort
      result = sortNotes(result, activeSort.columnName, activeSort.direction);
    }

    return result;
  }, [notes, activeFilters, activeFilter, activeSorts, activeSort, selectedTag, searchQuery]);

  // Handle edit note
  const handleEditNote = (note: ParsedNote) => {
    setNoteToEdit(note);
    setShowEditModal(true);
    setSelectedNote(null); // Close view modal when opening edit
  };

  // Handle note deleted
  const handleNoteDeleted = () => {
    refetch();
  };

  // Filter change handlers
  const handleFilterChange = (filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
    } else {
      setActiveFilters([]);
    }
  };

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
  };

  // Sort change handlers
  const handleSortChange = (sort: ActiveSort | undefined) => {
    setActiveSort(sort);
    if (sort) {
      setActiveSorts([sort]);
    } else {
      setActiveSorts([]);
    }
  };

  const handleMultiSortChange = (sorts: ActiveSort[]) => {
    setActiveSorts(sorts);
    setActiveSort(sorts.length > 0 ? sorts[0] : undefined);
  };

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
    isLoading,
    error,
    refetch,

    // Unique values for filters
    uniqueTitles,
    uniqueTags,
    uniqueCreators,

    // Advanced filtering
    activeFilters,
    setActiveFilters,
    activeFilter,
    setActiveFilter,
    handleFilterChange,
    handleFiltersChange,

    // Sorting
    activeSorts,
    setActiveSorts,
    activeSort,
    setActiveSort,
    handleSortChange,
    handleMultiSortChange,

    // Modal states
    selectedNote,
    setSelectedNote,
    showSummarizeModal,
    setShowSummarizeModal,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    noteToEdit,
    setNoteToEdit,
    
    // Handlers
    handleEditNote,
    handleNoteDeleted,
  };
}
