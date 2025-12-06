/**
 * List View Component for Contacts
 */

import React from 'react';
import { getInitials, getAvatarColor, formatDate } from '../utils';
import type { Contact } from '../types';

interface ListViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export default function ListView({ contacts, onContactClick }: ListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Name
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Company
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Role
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Lists
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Last Activity
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactClick(contact)}
                className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3 flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0`}>
                    {getInitials(contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">{contact.name}</h3>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <a href={`mailto:${contact.email}`} className="text-[10px] md:text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] truncate" onClick={(e) => e.stopPropagation()}>
                        {contact.email}
                      </a>
                      <a href={`tel:${contact.phone}`} className="text-[10px] md:text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]" onClick={(e) => e.stopPropagation()}>
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{contact.company}</span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{contact.role}</span>
                </div>
                <div className="col-span-1 flex items-center gap-1 flex-wrap">
                  {contact.contactType.slice(0, 1).map((type, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] md:text-xs font-medium truncate max-w-full"
                    >
                      {type}
                    </span>
                  ))}
                  {contact.contactType.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.contactType.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1 flex-wrap">
                  {contact.tags.slice(0, 1).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.tags.length - 1}</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {contact.lists.slice(0, 1).map((list, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] md:text-xs font-medium truncate max-w-full"
                    >
                      {list}
                    </span>
                  ))}
                  {contact.lists.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.lists.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">{formatDate(contact.lastActivity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
