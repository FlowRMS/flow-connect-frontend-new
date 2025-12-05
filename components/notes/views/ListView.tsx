/**
 * List View Component for Notes
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ParsedNote } from '../types';
import { formatTimestamp, getInitials, getAvatarColor } from '../utils';
import { useContactSearch, useNoteRelatedEntities, type CRMEntityType } from '../api';

// Helper to get entity type colors
const getEntityTypeColor = (type: CRMEntityType) => {
  switch (type) {
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

// Individual Note List Item with its own data fetching
function NoteListItem({ 
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
  // Fetch related entities for this specific note
  const { data: relatedEntities } = useNoteRelatedEntities(note.id);

  // Resolve mentions to names
  const mentionNames = useMemo(() => {
    return note.mentions.map(mentionId => {
      const contact = contacts.find(c => c.id === mentionId);
      return contact ? `${contact.firstName} ${contact.lastName}` : null;
    }).filter(Boolean);
  }, [note.mentions, contacts]);

  // Build related entities list
  const entityLinks = useMemo(() => {
    if (!relatedEntities) return [];
    const links: Array<{ type: CRMEntityType; name: string }> = [];
    relatedEntities.companies?.forEach(c => links.push({ type: 'COMPANY', name: c.name }));
    relatedEntities.contacts?.forEach(c => links.push({ type: 'CONTACT', name: `${c.firstName} ${c.lastName}` }));
    relatedEntities.jobs?.forEach(j => links.push({ type: 'JOB', name: j.jobName }));
    relatedEntities.tasks?.forEach(t => links.push({ type: 'TASK', name: t.title }));
    relatedEntities.preOpportunities?.forEach(p => links.push({ type: 'PRE_OPPORTUNITY', name: p.entityNumber || 'Unknown Pre-Opp' }));
    relatedEntities.quotes?.forEach(q => links.push({ type: 'QUOTE', name: q.quoteNumber || q.jobName || 'Unknown Quote' }));
    relatedEntities.orders?.forEach(o => links.push({ type: 'ORDER', name: o.orderNumber || o.jobName || 'Unknown Order' }));
    relatedEntities.invoices?.forEach(i => links.push({ type: 'INVOICE', name: i.invoiceNumber || 'Unknown Invoice' }));
    relatedEntities.checks?.forEach(c => links.push({ type: 'CHECK', name: c.checkNumber || 'Unknown Check' }));
    relatedEntities.factories?.forEach(f => links.push({ type: 'FACTORY', name: f.title || 'Unknown Factory' }));
    relatedEntities.customers?.forEach(c => links.push({ type: 'CUSTOMER', name: c.companyName || 'Unknown Customer' }));
    relatedEntities.products?.forEach(p => links.push({ type: 'PRODUCT', name: p.factoryPartNumber || 'Unknown Product' }));
    relatedEntities.notes?.forEach(n => links.push({ type: 'NOTE', name: n.title || 'Untitled Note' }));
    return links;
  }, [relatedEntities]);

  return (
    <div
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
                <span>{isMounted ? formatTimestamp(note.createdAt) : ''}</span>
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

          {/* Tags, Mentions, Related Entities and Metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tags */}
            {note.tags.length > 0 && (
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
            )}
            
            {/* Mentions - Display as contact names */}
            {mentionNames.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {mentionNames.map((name, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    @{name}
                  </span>
                ))}
              </div>
            )}

            {/* Related Entities */}
            {entityLinks.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {entityLinks.slice(0, 2).map((link, idx) => (
                  <span 
                    key={idx} 
                    className={`px-2 py-1 rounded text-xs font-medium ${getEntityTypeColor(link.type)}`}
                  >
                    {link.name}
                  </span>
                ))}
                {entityLinks.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    +{entityLinks.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Comment count */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNoteClick(note);
              }}
              className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
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
    </div>
  );
}

interface ListViewProps {
  notes: ParsedNote[];
  onNoteClick: (note: ParsedNote) => void;
}

export function ListView({ notes, onNoteClick }: ListViewProps) {
  // Track if component is mounted (client-side) to avoid hydration issues with dates
  const [isMounted, setIsMounted] = useState(false);
  
  // Fetch all contacts once for mention resolution
  const { data: contacts = [] } = useContactSearch('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {notes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            onNoteClick={onNoteClick}
            contacts={contacts}
            isMounted={isMounted}
          />
        ))}
      </div>
    </div>
  );
}
