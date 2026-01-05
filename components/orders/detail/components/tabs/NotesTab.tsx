/**
 * NotesTab Component
 * Displays notes for the order from relatedEntities API
 */

'use client';

import React from 'react';
import { useRelatedEntities } from '@/components/hooks/useCRMApi';
import type { RelatedEntityNote } from '@/components/lib/crm-graphql';

interface NotesTabProps {
  orderId: string;
}

export function NotesTab({ orderId }: NotesTabProps) {
  const { data: relatedEntities, isLoading, error } = useRelatedEntities(orderId, 'ORDERS');

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
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Notes</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Internal notes for this order</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
            </svg>
            Add Note
          </button>
        </div>

        {/* Notes List */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note: RelatedEntityNote) => (
              <div key={note.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${getAvatarColor(note)}`}>
                    {getInitials(note)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--foreground)]">
                        {getAuthorName(note)}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    {note.title && (
                      <h4 className="text-sm font-medium text-[var(--foreground)] mt-1">{note.title}</h4>
                    )}
                    <p className="text-sm text-[var(--foreground)] mt-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                      <circle cx="10" cy="4" r="1.5"/>
                      <circle cx="10" cy="10" r="1.5"/>
                      <circle cx="10" cy="16" r="1.5"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
              <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[var(--muted-foreground)]">No notes yet</p>
            <button className="mt-2 text-sm text-[var(--primary)] hover:underline">
              Add the first note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
