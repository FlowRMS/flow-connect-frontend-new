/**
 * List View Component for Notes
 */

import React from 'react';
import type { Note } from '../types';
import { formatDate, getInitials, getAvatarColor } from '../utils';

interface ListViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
}

export function ListView({ notes, onNoteClick }: ListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onNoteClick(note)}
            className="p-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                {getInitials(note.createdBy)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--foreground)] text-base mb-1">{note.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{note.createdBy}</span>
                      <span>·</span>
                      <span>{formatDate(note.createdDate)}</span>
                    </div>
                  </div>
                  <button className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="4" r="1.5"/>
                      <circle cx="10" cy="10" r="1.5"/>
                      <circle cx="10" cy="16" r="1.5"/>
                    </svg>
                  </button>
                </div>

                {/* Note Content */}
                <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                  {note.content}
                </p>

                {/* Entity Link */}
                {note.entityType && note.entityName && (
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                      {note.entityType}
                    </span>
                    <span className="text-[var(--muted-foreground)]">{note.entityName}</span>
                  </div>
                )}

                {/* Tags and Metadata */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {note.attachments > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2l-8 8-4-4" strokeLinecap="round"/>
                        <path d="M3 10l6 6 11-11" strokeLinecap="round"/>
                      </svg>
                      {note.attachments}
                    </div>
                  )}
                  {note.comments > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoteClick(note);
                      }}
                      className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                      </svg>
                      {note.comments}
                    </button>
                  )}
                  {note.mentions.length > 0 && (
                    <div className="flex gap-1 text-xs">
                      {note.mentions.map((mention, idx) => (
                        <span key={idx} className="text-[var(--primary)]">{mention}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
