/**
 * Grid View Component for Contacts
 * Displays contacts in a responsive grid of cards
 */

import React from 'react';
import type { Contact } from '../types';
import { getInitials, getAvatarColor } from '../utils';

interface GridViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export default function GridView({ contacts, onContactClick }: GridViewProps) {
  if (contacts.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-8">
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No Contacts Found</h3>
          <p className="text-sm">Try adjusting your filters or add a new contact.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => onContactClick(contact)}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5 hover:shadow-lg hover:border-[var(--primary)]/50 transition-all cursor-pointer group"
        >
          {/* Avatar and Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 ${getAvatarColor(contact.id)} rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm`}>
              {getInitials(contact.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                {contact.name}
              </h3>
              {contact.role && (
                <p className="text-sm text-[var(--muted-foreground)] truncate">{contact.role}</p>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-sm">
            {contact.email && (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{contact.company}</span>
              </div>
            )}
          </div>

        </div>
      ))}
    </div>
  );
}
