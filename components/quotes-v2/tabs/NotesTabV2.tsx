'use client';

import React, { useState } from 'react';
import type { NoteV2 } from '../types';

interface NotesTabV2Props {
  notes: NoteV2[];
  onNotesChange: (notes: NoteV2[]) => void;
}

export function NotesTabV2({ notes, onNotesChange }: NotesTabV2Props) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  const formatDate = (dateStr: string): string => {
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

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote: NoteV2 = {
      id: `note-${Date.now()}`,
      quoteId: notes[0]?.quoteId || '',
      authorId: 'current-user',
      authorName: 'Current User',
      authorInitials: 'CU',
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    onNotesChange([newNote, ...notes]);
    setNewNoteContent('');
    setShowAddNote(false);
  };

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
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                  {note.authorInitials}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Author and Date */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{note.authorName}</span>
                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>

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
