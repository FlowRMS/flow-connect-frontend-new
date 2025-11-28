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
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Name
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Company
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Role
        </div>
        <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Type
        </div>
        <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Tags
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Lists
        </div>
        <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Last Activity
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[var(--border)]">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onContactClick(contact)}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-sm font-semibold`}>
                {getInitials(contact.name)}
              </div>
              <div>
                <h3 className="font-medium text-[var(--foreground)]">{contact.name}</h3>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <a href={`mailto:${contact.email}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]" onClick={(e) => e.stopPropagation()}>
                    {contact.email}
                  </a>
                  <a href={`tel:${contact.phone}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]" onClick={(e) => e.stopPropagation()}>
                    {contact.phone}
                  </a>
                </div>
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-sm text-[var(--foreground)]">{contact.company}</span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-sm text-[var(--foreground)]">{contact.role}</span>
            </div>
            <div className="col-span-1 flex items-center gap-1 flex-wrap">
              {contact.contactType.map((type, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  {type}
                </span>
              ))}
            </div>
            <div className="col-span-1 flex items-center gap-1 flex-wrap">
              {contact.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="col-span-2 flex items-center gap-1 flex-wrap">
              {contact.lists.map((list, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                >
                  {list}
                </span>
              ))}
            </div>
            <div className="col-span-1 flex items-center">
              <span className="text-xs text-[var(--muted-foreground)]">{formatDate(contact.lastActivity)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
