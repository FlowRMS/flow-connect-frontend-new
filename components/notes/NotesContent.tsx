/**
 * Notes Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '../ui/HeaderIconAnimations';
import { iconMap } from '../Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters from '../advancedFilters/AdvancedFilters';
import SortButton from '../SortButton';
import { useNotesState } from './hooks/useNotesState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useCRMNote } from '../hooks/useCRMApi';
import { getNoteFilterOptions, getNoteSortOptions } from './config/filterConfig';
import { GridView } from './views/GridView';
import { ListView } from './views/ListView';
import { ReadView } from './views/ReadView';
import { NoteModal } from './modals/NoteModal';
import { SummarizeModal } from './modals/SummarizeModal';
import { CreateNoteModal } from './modals/CreateNoteModal';
import { EditNoteModal } from './modals/EditNoteModal';
import { parseNote } from './utils';

export default function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track intentional clear to prevent re-selection after back navigation
  const isIntentionalClearRef = useRef(false);

  // Get note ID from URL - this is the source of truth for navigation
  const noteIdFromUrl = searchParams.get('id');

  // State management
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filteredNotes,
    notes,
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
    isLoading,
    error,
    refetch,
    isMounted,
    handleEditNote,
    handleNoteDeleted,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Filter and sort state
    uniqueTitles,
    uniqueTags,
    uniqueCreators,
    activeFilters,
    handleFiltersChange,
    activeSorts,
    handleMultiSortChange,
  } = useNotesState();

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Fetch note details when navigating via URL
  // This ensures we can display the note even if it's not in the loaded pagination
  const targetNoteId = (!isIntentionalClearRef.current && noteIdFromUrl) ? noteIdFromUrl : '';
  const { data: noteData, isLoading: noteDetailLoading } = useCRMNote(targetNoteId);

  // When we get note data from API (navigating via URL), set it as selected
  useEffect(() => {
    if (noteData && noteIdFromUrl && !isIntentionalClearRef.current) {
      const mappedNote = parseNote(noteData);
      if (!selectedNote || selectedNote.id !== mappedNote.id) {
        setSelectedNote(mappedNote);
      }
    }
  }, [noteData, noteIdFromUrl, selectedNote, setSelectedNote]);

  // Handle back navigation - close modal and clear URL
  const handleBack = () => {
    isIntentionalClearRef.current = true;
    setSelectedNote(null);
    router.replace('/notes', { scroll: false });
    // Reset the flag after navigation
    setTimeout(() => {
      isIntentionalClearRef.current = false;
    }, 100);
  };

  // Filter and sort configuration with dynamic options
  const noteFilterOptions = getNoteFilterOptions(uniqueTitles, uniqueTags, uniqueCreators);
  const noteSortOptions = getNoteSortOptions();

  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'notes';

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="pb-0 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4 overflow-visible">
          <div className="flex items-start gap-4 overflow-visible">
            {/* Morphing Icon Target - Paper Flutter Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="paper-flutter"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['notes']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Notes
              </motion.h1>
              <motion.p
                className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {isLoading ? 'Loading...' : `${filteredNotes.length} notes • Capture insights and ideas`}
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('read')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'read' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Read View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </button>
            </div>

            <SortButton
              sortOptions={noteSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={activeSorts}
            />

            <AdvancedFilters
              filterOptions={noteFilterOptions}
              onFiltersChange={handleFiltersChange}
              activeFilters={activeFilters}
            />

            {/* Summarize with FlowChat button - hidden for now */}
            <button
              onClick={() => setShowSummarizeModal(true)}
              className="hidden items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Summarize with FlowChat
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">New Note</span>
              <span className="sm:hidden">New</span>
            </button>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 sm:mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Loading State - show during SSR and initial client load */}
      {(!isMounted || isLoading) && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading notes...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isMounted && error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load notes</h3>
          <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Views */}
      {isMounted && !isLoading && !error && viewMode === 'grid' && (
        <GridView notes={filteredNotes} onNoteClick={setSelectedNote} />
      )}

      {isMounted && !isLoading && !error && viewMode === 'list' && (
        <ListView notes={filteredNotes} onNoteClick={setSelectedNote} />
      )}

      {isMounted && !isLoading && !error && viewMode === 'read' && (
        <ReadView notes={filteredNotes} />
      )}

      {/* Empty State */}
      {isMounted && !isLoading && !error && filteredNotes.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No notes found</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {isMounted && !isLoading && !error && filteredNotes.length > 0 && (
        <>
          <div ref={loadMoreRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading more notes...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading state for note detail from URL navigation */}
      {noteDetailLoading && noteIdFromUrl && !selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading note...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={handleBack}
          onEdit={() => handleEditNote(selectedNote)}
          onDelete={handleNoteDeleted}
        />
      )}

      <CreateNoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      {noteToEdit && (
        <EditNoteModal
          isOpen={showEditModal}
          note={noteToEdit}
          onClose={() => {
            setShowEditModal(false);
            setNoteToEdit(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {showSummarizeModal && (
        <SummarizeModal
          notes={notes}
          filteredNotesCount={filteredNotes.length}
          onClose={() => setShowSummarizeModal(false)}
        />
      )}
    </main>
  );
}
