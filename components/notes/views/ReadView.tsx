/**
 * Read View Component for Notes
 */

import React from 'react';
import type { Note } from '../types';
import { formatDate, getInitials, getAvatarColor } from '../utils';

interface ReadViewProps {
  notes: Note[];
}

export function ReadView({ notes }: ReadViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {notes.map((note, index) => (
        <div key={note.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          {/* Note Header */}
          <div className="border-b border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">{note.title}</h2>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(note.createdBy)} flex items-center justify-center text-white text-sm font-semibold`}>
                    {getInitials(note.createdBy)}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    <span className="font-medium text-[var(--foreground)]">{note.createdBy}</span>
                    <span className="mx-2">·</span>
                    <span>{formatDate(note.createdDate)}</span>
                  </div>
                </div>
              </div>
              <span className="text-sm text-[var(--muted-foreground)] font-mono">{note.id}</span>
            </div>

            {/* Entity Link */}
            {note.entityType && note.entityName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                  {note.entityType}
                </span>
                <span className="text-[var(--foreground)]">{note.entityName}</span>
              </div>
            )}
          </div>

          {/* Note Content */}
          <div className="px-6 py-5">
            <div className="prose prose-sm max-w-none text-[var(--foreground)]">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>

            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tags:</span>
                {note.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Mentions */}
            {note.mentions.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Mentioned:</span>
                {note.mentions.map((mention, idx) => (
                  <span key={idx} className="text-sm text-[var(--primary)] font-medium">{mention}</span>
                ))}
              </div>
            )}

            {/* Attachments */}
            {note.attachments > 0 && (
              <div className="flex items-center gap-2 mt-3 text-sm text-[var(--muted-foreground)]">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2l-8 8-4-4" strokeLinecap="round"/>
                  <path d="M3 10l6 6 11-11" strokeLinecap="round"/>
                </svg>
                <span>{note.attachments} attachment{note.attachments !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          {note.comments > 0 && (
            <div className="border-t border-[var(--border)] bg-[var(--muted)]/10 px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-semibold text-[var(--foreground)]">{note.comments} Comment{note.comments !== 1 ? 's' : ''}</span>
              </div>

              {/* Sample Comments */}
              <div className="space-y-4">
                {/* Comment 1 */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    DT
                  </div>
                  <div className="flex-1">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">David Torres</span>
                        <span className="text-xs text-[var(--muted-foreground)]">2 days ago</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)]">
                        Great notes! I'll follow up with them on the pricing details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comment 2 */}
                {note.comments > 1 && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      MC
                    </div>
                    <div className="flex-1">
                      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--foreground)]">Marcus Chen</span>
                          <span className="text-xs text-[var(--muted-foreground)]">1 day ago</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)]">
                          Thanks for capturing this. Let's discuss in our next team meeting.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note Divider */}
          {index < notes.length - 1 && (
            <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mt-8" />
          )}
        </div>
      ))}
    </div>
  );
}
