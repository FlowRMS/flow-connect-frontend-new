/**
 * Notes Content Component - Main Container
 * Clean, modular implementation with separated concerns
 */

'use client';

import React from 'react';
import AdvancedFilters from '../AdvancedFilters';
import { useNotesState } from './hooks/useNotesState';
import { getNoteFilterOptions } from './config/filterConfig';
import { GridView } from './views/GridView';
import { ListView } from './views/ListView';
import { ReadView } from './views/ReadView';
import { NoteModal } from './modals/NoteModal';
import { SummarizeModal } from './modals/SummarizeModal';

export default function NotesContent() {
  // State management
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filteredNotes,
    selectedNote,
    setSelectedNote,
    showSummarizeModal,
    setShowSummarizeModal,
    notes,
  } = useNotesState();

  // Filter configuration
  const noteFilterOptions = getNoteFilterOptions();

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className={`p-2 rounded ${viewMode === 'read' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Read View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={noteFilterOptions} />
            
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            
            <button
              onClick={() => setShowSummarizeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              Summarize with FlowChat
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Note
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search notes by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Views */}
      {viewMode === 'grid' && (
        <GridView notes={filteredNotes} onNoteClick={setSelectedNote} />
      )}

      {viewMode === 'list' && (
        <ListView notes={filteredNotes} onNoteClick={setSelectedNote} />
      )}

      {viewMode === 'read' && (
        <ReadView notes={filteredNotes} />
      )}

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <svg className="mx-auto mb-4 w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No notes found</h3>
          <p className="text-sm text-[var(--muted-foreground)]">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modals */}
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
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
