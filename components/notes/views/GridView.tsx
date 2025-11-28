/**
 * Grid View Component for Notes
 */

import React from 'react';
import type { Note } from '../types';
import { formatDate, getInitials, getAvatarColor } from '../utils';

interface GridViewProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
}

export function GridView({ notes, onNoteClick }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
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

          {/* Entity Link */}
          {note.entityType && note.entityName && (
            <div className="mb-3 flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                {note.entityType}
              </span>
              <span className="text-[var(--muted-foreground)]">{note.entityName}</span>
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Mentions */}
          {note.mentions.length > 0 && (
            <div className="mb-3 text-xs text-[var(--muted-foreground)]">
              {note.mentions.map((mention, idx) => (
                <span key={idx} className="text-[var(--primary)] mr-2">{mention}</span>
              ))}
            </div>
          )}

          {/* Note Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-xs font-semibold`}>
                {getInitials(note.createdBy)}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {note.createdBy} · {formatDate(note.createdDate)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              {note.attachments > 0 && (
                <div className="flex items-center gap-1">
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
                  className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                  </svg>
                  {note.comments}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
