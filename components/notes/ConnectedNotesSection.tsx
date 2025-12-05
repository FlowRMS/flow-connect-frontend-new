/**
 * Connected Notes Section Component
 * Displays notes linked to any entity (Job, Contact, Company)
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRMNotesByEntity } from '../hooks/useCRMApi';
import type { Note, CRMEntityType } from '../lib/crm-graphql';

interface ConnectedNotesSectionProps {
  entityId: string;
  entityType: 'JOB' | 'CONTACT' | 'COMPANY' | 'PRE_OPPORTUNITY';
  title?: string;
  onNoteClick?: (note: Note) => void;
  onAddClick?: () => void;
}

/**
 * Note Card Component
 */
function NoteCard({ note, onClick }: { note: Note; onClick?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className={`p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Note icon */}
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="font-medium text-[var(--foreground)] truncate">
            {note.title || 'Untitled Note'}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {formatDate(note.createdAt)}
          </span>
          {onClick && (
            <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      
      {note.content && (
        <div className="text-sm text-[var(--muted-foreground)] ml-10">
          <p className="whitespace-pre-wrap">
            {isExpanded ? note.content : truncateContent(note.content)}
          </p>
          {note.content.length > 150 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[var(--primary)] hover:underline text-xs mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
      
      {/* Tags */}
      {note.tags && typeof note.tags === 'string' && note.tags.trim().length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 ml-10">
          {note.tags.split(',').map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}
      {/* Handle array tags */}
      {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 ml-10">
          {note.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full"
            >
              #{typeof tag === 'string' ? tag.trim() : tag}
            </span>
          ))}
        </div>
      )}

      {/* Created by */}
      {note.createdBy && (
        <div className="flex items-center gap-1 mt-3 ml-10 text-xs text-[var(--muted-foreground)]">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Created by {note.createdBy}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ConnectedNotesSection({
  entityId,
  entityType,
  title = 'Connected Notes',
  onNoteClick,
  onAddClick,
}: ConnectedNotesSectionProps) {
  const router = useRouter();
  const {
    data: notes = [],
    isLoading,
    error,
    refetch,
  } = useCRMNotesByEntity(entityId, entityType as CRMEntityType);

  const handleNoteClick = (note: Note) => {
    if (onNoteClick) {
      onNoteClick(note);
    } else {
      // Default behavior: navigate to notes page with the note ID
      router.push(`/notes?id=${note.id}`);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mt-6">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          {!isLoading && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
              {notes.length}
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              title="Link note"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link Note
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Refresh notes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">Failed to load notes</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-[var(--primary)] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--muted)] rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No notes found</p>
            <p className="text-xs mt-1">Notes linked to this entity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onClick={() => handleNoteClick(note)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
