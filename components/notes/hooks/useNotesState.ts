/**
 * Notes State Management Hook
 * Integrates with the new Notes API for fetching and managing notes
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ParsedNote, ViewMode } from '../types';
import type { ActiveFilter, ActiveSort } from '../../advancedFilters/AdvancedFilters';
import { useCRMNoteLandingPagesInfinite } from '../../hooks/useCRMApi';

import type { NoteLandingPage, LandingPageFilter, LandingPageOrderBy } from '../../lib/crm-graphql';
import {
  filterNotes,
  getAllTags,
  parseCommaSeparated,
  parseLinkedEntities,
  applyNoteFilter,
  sortNotes,
  getAllTitles,
  getUniqueTags,
  getAllCreators,
} from '../utils';

/**
 * Parse API note to ParsedNote format
 */
function parseApiNote(note: NoteLandingPage): ParsedNote {
  return {
    id: note.id,
    title: note.title || '',
    content: note.content || '',
    mentions: [], // NoteLandingPage doesn't include mentions
    tags: parseCommaSeparated(note.tags || ''),
    linkedTitles: parseLinkedEntities(note.linkedEntities),
    createdBy: note.createdBy || '',
    createdAt: note.createdAt || '',
  };
}

export function useNotesState() {
  // Hydration-safe mounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  // CRM API hooks with infinite scroll - now with server-side filters
  const isConnected = isMounted ? true : false;
  const {
    data: notesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCRMNoteLandingPagesInfinite(serverFilters, serverOrderBy);

  // Flatten paginated results with deduplication
  const rawNotes = useMemo(() => {
    if (!notesData?.pages) return undefined;
    const allRecords = notesData.pages.flatMap(page => page.records);
    // Deduplicate by ID
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [notesData]);

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

  // Convert ActiveFilter to LandingPageFilter for server-side filtering
  const toServerFilters = useCallback((filters: ActiveFilter[]): LandingPageFilter[] => {
    return filters.map(f => {
      // Only include value OR values, not both - check which one exists
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
  }, []);

  // Convert ActiveSort to LandingPageOrderBy for server-side sorting
  const toServerOrderBy = useCallback((sorts: ActiveSort[]): LandingPageOrderBy[] => {
    return sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
  }, []);

  // Filter change handlers
  const handleFilterChange = useCallback((filter: ActiveFilter | undefined) => {
    setActiveFilter(filter);
    if (filter) {
      setActiveFilters([filter]);
      setServerFilters(toServerFilters([filter])); // Server-side filter
    } else {
      setActiveFilters([]);
      setServerFilters([]); // Clear server-side filters
    }
  }, [toServerFilters]);

  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveFilter(filters.length > 0 ? filters[0] : undefined);
    setServerFilters(toServerFilters(filters)); // Server-side filters
  }, [toServerFilters]);

  // Sort change handlers
  const handleSortChange = useCallback((sort: ActiveSort | undefined) => {
    setActiveSort(sort);
    if (sort) {
      setActiveSorts([sort]);
      setServerOrderBy(toServerOrderBy([sort])); // Server-side sort
    } else {
      setActiveSorts([]);
      setServerOrderBy([]); // Clear server-side sort
    }
  }, [toServerOrderBy]);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setActiveSorts(sorts);
    setActiveSort(sorts.length > 0 ? sorts[0] : undefined);
    setServerOrderBy(toServerOrderBy(sorts)); // Server-side sort
  }, [toServerOrderBy]);

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
    isMounted,
    isConnected,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

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
