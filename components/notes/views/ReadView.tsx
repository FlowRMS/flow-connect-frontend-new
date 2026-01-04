/**
 * Read View Component for Notes
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedNote } from '../types';
import { formatTimestamp, formatTimeAgo, getInitials, getAvatarColor } from '../utils';
import { useNoteConversations, useContactSearch } from '../api';

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

interface NoteCardProps {
  note: ParsedNote;
  isLast: boolean;
  isMounted: boolean;
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
}

function NoteCard({ note, isLast, isMounted, contacts }: NoteCardProps) {
  const { data: conversations = [], isLoading: isLoadingConversations } = useNoteConversations(note.id);

  // Resolve mentions to names
  const mentionNames = useMemo(() => {
    return note.mentions.map(mentionId => {
      const contact = contacts.find(c => c.id === mentionId);
      return contact ? `${contact.firstName} ${contact.lastName}` : null;
    }).filter(Boolean);
  }, [note.mentions, contacts]);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
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
                <span>{isMounted ? formatTimestamp(note.createdAt) : ''}</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-[var(--muted-foreground)] font-mono">{note.id}</span>
        </div>
      </div>

      {/* Note Content */}
      <div className="px-6 py-5">
        <div className="prose prose-sm max-w-none text-[var(--foreground)]">
          <div 
            className="text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
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

        {/* Mentions - Display as contact names */}
        {mentionNames.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Mentioned:</span>
            {mentionNames.map((name, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                @{name}
              </span>
            ))}
          </div>
        )}

        {/* Linked Entities from linkedTitles */}
        {note.linkedTitles.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Linked:</span>
            {note.linkedTitles.map((link, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded text-sm font-medium ${getLinkedTitleColor(link.type)}`}
              >
                {link.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {isLoadingConversations ? (
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/10 px-6 py-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm">Loading comments...</span>
          </div>
        </div>
      ) : conversations.length > 0 ? (
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/10 px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {conversations.length} Comment{conversations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Actual Comments */}
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const creatorName = conversation.createdBy?.fullName
                || (conversation.createdBy?.firstName && conversation.createdBy?.lastName
                    ? `${conversation.createdBy.firstName} ${conversation.createdBy.lastName}`
                    : conversation.createdBy?.email || 'Unknown User');
              const isInside = conversation.createdBy?.inside;
              const isOutside = conversation.createdBy?.outside;

              return (
                <div key={conversation.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full ${getAvatarColor(creatorName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                    {getInitials(creatorName)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-[var(--foreground)]">{creatorName}</span>
                        {isInside && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">Inside</span>
                        )}
                        {isOutside && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">Outside</span>
                        )}
                        <span className="text-xs text-[var(--muted-foreground)]">{isMounted ? formatTimeAgo(conversation.createdAt) : ''}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)]">
                        {conversation.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Note Divider */}
      {!isLast && (
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mt-8" />
      )}
    </div>
  );
}

interface ReadViewProps {
  notes: ParsedNote[];
}

export function ReadView({ notes }: ReadViewProps) {
  // Track if component is mounted (client-side) to avoid hydration issues with dates
  const [isMounted, setIsMounted] = useState(false);
  
  // Fetch all contacts once for mention resolution
  const { data: contacts = [] } = useContactSearch('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {notes.map((note, index) => (
        <NoteCard key={note.id} note={note} isLast={index === notes.length - 1} isMounted={isMounted} contacts={contacts} />
      ))}
    </div>
  );
}
