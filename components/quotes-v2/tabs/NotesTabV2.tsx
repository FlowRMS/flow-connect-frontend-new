'use client';

import React, { useState } from 'react';
import { useRelatedEntities } from '@/components/hooks/useCRMApi';
import type { RelatedEntityNote } from '@/components/lib/crm-graphql';

interface NotesTabV2Props {
  quoteId: string;
}

export function NotesTabV2({ quoteId }: NotesTabV2Props) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: relatedEntities, isLoading, error } = useRelatedEntities(quoteId, 'QUOTES');

  const notes = relatedEntities?.notes || [];

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

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    // TODO: Implement adding note via API
    console.log('Adding note:', newNoteContent);
    setNewNoteContent('');
    setShowAddNote(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
            <h3 className="text-base font-semibold text-gray-900">Notes</h3>
            <p className="text-sm text-gray-500">Internal notes for this quote</p>
          </div>
          <button
            onClick={() => setShowAddNote(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round" />
            </svg>
            Add Note
          </button>
        </div>

        {/* Add Note Form */}
        {showAddNote && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setShowAddNote(false); setNewNoteContent(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note: RelatedEntityNote) => (
            <div
              key={note.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${getAvatarColor(note)}`}>
                  {getInitials(note)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author and Date */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {getAuthorName(note)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>

                  {/* Title */}
                  {note.title && (
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{note.title}</h4>
                  )}

                  {/* Content */}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>

                {/* Actions Menu */}
                <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && !showAddNote && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-gray-500">No notes yet</p>
              <button
                onClick={() => setShowAddNote(true)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Add the first note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesTabV2;
