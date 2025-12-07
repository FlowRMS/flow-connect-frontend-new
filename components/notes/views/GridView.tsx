/**
 * Grid View Component for Notes
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedNote, LinkedTitle } from '../types';
import { formatTimestamp, getInitials, getAvatarColor } from '../utils';
import { useContactSearch } from '../api';

// Helper to get entity type colors for linkedTitles
const getLinkedTitleColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'JOB': return 'bg-blue-100 text-blue-700';
    case 'COMPANY': return 'bg-purple-100 text-purple-700';
    case 'CONTACT': return 'bg-green-100 text-green-700';
    case 'TASK': return 'bg-orange-100 text-orange-700';
    case 'PRE_OPPORTUNITY': return 'bg-teal-100 text-teal-700';
    case 'QUOTE': return 'bg-cyan-100 text-cyan-700';
    case 'ORDER': return 'bg-indigo-100 text-indigo-700';
    case 'INVOICE': return 'bg-rose-100 text-rose-700';
    case 'CHECK': return 'bg-emerald-100 text-emerald-700';
    case 'FACTORY': return 'bg-slate-100 text-slate-700';
    case 'CUSTOMER': return 'bg-amber-100 text-amber-700';
    case 'PRODUCT': return 'bg-lime-100 text-lime-700';
    case 'NOTE': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Individual Note Card - uses linkedTitles from landing page data
function NoteGridCard({
  note,
  onNoteClick,
  contacts,
  isMounted
}: {
  note: ParsedNote;
  onNoteClick: (note: ParsedNote) => void;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  isMounted: boolean;
}) {
  // Resolve mentions to names
  const mentionNames = useMemo(() => {
    return note.mentions.map(mentionId => {
      const contact = contacts.find(c => c.id === mentionId);
      return contact ? `${contact.firstName} ${contact.lastName}` : null;
    }).filter(Boolean);
  }, [note.mentions, contacts]);

  return (
    <div
      onClick={() => onNoteClick(note)}
      className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Note Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="font-semibold text-[var(--foreground)] text-base">{note.title}</h3>
        </div>
        <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="4" r="1.5"/>
            <circle cx="10" cy="10" r="1.5"/>
            <circle cx="10" cy="16" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Note Content */}
      <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-3">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {note.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Mentions - Display as contact names */}
      {mentionNames.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {mentionNames.map((name, idx) => (
            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              @{name}
            </span>
          ))}
        </div>
      )}

      {/* Linked Entities from linkedTitles */}
      {note.linkedTitles.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {note.linkedTitles.slice(0, 3).map((link, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded text-xs font-medium ${getLinkedTitleColor(link.type)}`}
            >
              {link.name}
            </span>
          ))}
          {note.linkedTitles.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              +{note.linkedTitles.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Note Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-xs font-semibold`}>
            {getInitials(note.createdBy)}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {note.createdBy} · {isMounted ? formatTimestamp(note.createdAt) : ''}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick(note);
            }}
            className="flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors"
            title="View comments"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
            </svg>
            {note.conversationCount !== undefined && note.conversationCount > 0 && (
              <span className="font-medium">{note.conversationCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface GridViewProps {
  notes: ParsedNote[];
  onNoteClick: (note: ParsedNote) => void;
}

export function GridView({ notes, onNoteClick }: GridViewProps) {
  // Track if component is mounted (client-side) to avoid hydration issues with dates
  const [isMounted, setIsMounted] = useState(false);
  
  // Fetch all contacts once for mention resolution
  const { data: contacts = [] } = useContactSearch('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {notes.map((note) => (
        <NoteGridCard
          key={note.id}
          note={note}
          onNoteClick={onNoteClick}
          contacts={contacts}
          isMounted={isMounted}
        />
      ))}
    </div>
  );
}
