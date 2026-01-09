/**
 * RelatedNotesSection Component - CENTRALIZED
 * Displays linked notes for any entity with ability to link/unlink
 */

'use client';

import React, { useState } from 'react';
import { useRelatedEntities, useDeleteCRMLinkByEntities } from '../hooks/useCRMApi';
import type { RelatedEntityNote, RelatedEntitiesSourceType } from '../lib/crm-graphql';
import { AddLinkModal } from './AddLinkModal';
import { linkToasts } from '../lib/toast';

interface RelatedNotesSectionProps {
  entityId: string;
  sourceType: RelatedEntitiesSourceType;
  sourceEntityType: 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK';
}

export function RelatedNotesSection({ entityId, sourceType, sourceEntityType }: RelatedNotesSectionProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkingNoteId, setUnlinkingNoteId] = useState<string | null>(null);

  const { data: relatedEntities, isLoading, error, refetch } = useRelatedEntities(entityId, sourceType);
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  const notes = relatedEntities?.notes || [];

  // Format date for display
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get initials from author
  const getInitials = (note: RelatedEntityNote): string => {
    const first = note.createdBy?.firstName?.[0]?.toUpperCase() || '';
    const last = note.createdBy?.lastName?.[0]?.toUpperCase() || '';
    return first + last || '??';
  };

  // Get avatar color based on name
  const getAvatarColor = (note: RelatedEntityNote): string => {
    const name = (note.createdBy?.firstName || '') + (note.createdBy?.lastName || '');
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-teal-100 text-teal-700',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get author display name
  const getAuthorName = (note: RelatedEntityNote): string => {
    if (note.createdBy?.fullName) return note.createdBy.fullName;
    if (note.createdBy?.firstName || note.createdBy?.lastName) {
      return `${note.createdBy.firstName || ''} ${note.createdBy.lastName || ''}`.trim();
    }
    return 'Unknown';
  };

  // Handle unlink
  const handleUnlink = async (noteId: string) => {
    if (!confirm('Are you sure you want to unlink this note?')) return;

    setUnlinkingNoteId(noteId);
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: sourceEntityType,
        sourceEntityId: entityId,
        targetEntityType: 'NOTE',
        targetEntityId: noteId,
      });
      linkToasts.deleteSuccess('Note');
      refetch();
    } catch (error) {
      console.error('Failed to unlink note:', error);
      linkToasts.deleteError('Note');
    } finally {
      setUnlinkingNoteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load notes</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Notes</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Linked notes for this record</p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Link Note
          </button>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note: RelatedEntityNote) => (
            <div
              key={note.id}
              className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${getAvatarColor(note)}`}>
                  {getInitials(note)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author and Date */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {getAuthorName(note)}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatDate(note.createdAt)}</span>
                  </div>

                  {/* Title */}
                  {note.title && (
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">{note.title}</h4>
                  )}

                  {/* Content */}
                  <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap mb-2">{note.content}</p>

                  {/* Tags */}
                  {(() => {
                    // Handle both string and array formats, filter out empty strings
                    let allTags: string[] = [];

                    if (typeof note.tags === 'string' && note.tags.trim()) {
                      allTags = note.tags.split(',').map(t => t.trim()).filter(Boolean);
                    } else if (Array.isArray(note.tags)) {
                      allTags = note.tags
                        .flatMap(tagString => tagString.split(','))
                        .map(t => t.trim())
                        .filter(Boolean);
                    }

                    if (allTags.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allTags.map((tag, idx) => (
                            <span
                              key={`tag-${idx}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Mentions */}
                  {(() => {
                    // Handle both string and array formats, filter out empty strings
                    let allMentions: string[] = [];

                    if (typeof note.mentions === 'string' && note.mentions.trim()) {
                      allMentions = note.mentions.split(',').map(m => m.trim()).filter(Boolean);
                    } else if (Array.isArray(note.mentions)) {
                      allMentions = note.mentions
                        .flatMap(mentionString => mentionString.split(','))
                        .map(m => m.trim())
                        .filter(Boolean);
                    }

                    if (allMentions.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allMentions.map((mention, idx) => (
                            <span
                              key={`mention-${idx}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              @{mention}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Unlink Button */}
                <button
                  onClick={() => handleUnlink(note.id)}
                  disabled={unlinkingNoteId === note.id}
                  className="p-1 hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0 text-[var(--muted-foreground)] hover:text-red-500"
                  title="Unlink note"
                >
                  {unlinkingNoteId === note.id ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6l8 8" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[var(--muted-foreground)] mb-2">No notes linked</p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Link your first note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      <AddLinkModal
        isOpen={showLinkModal}
        sourceEntityId={entityId}
        sourceEntityType={sourceEntityType}
        initialEntityType="NOTE"
        onClose={() => setShowLinkModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default RelatedNotesSection;
