'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchContacts, type ContactSearchResult } from '../lib/api/search';

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: ContactSearchResult) => void;
  title: string;
  roleFilter?: string;
}

export function ContactSearchModal({
  isOpen,
  onClose,
  onSelect,
  title,
  roleFilter,
}: ContactSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setDebouncedTerm('');
    }
  }, [isOpen]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contactSearch', debouncedTerm],
    queryFn: () => searchContacts(debouncedTerm, 20),
    enabled: isOpen && debouncedTerm.length >= 2,
    staleTime: 30 * 1000,
  });

  // Filter by role if specified
  const filteredContacts = roleFilter
    ? contacts.filter(c => c.role?.toLowerCase().includes(roleFilter.toLowerCase()))
    : contacts;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              autoFocus
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
            </div>
          ) : debouncedTerm.length < 2 ? (
            <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
              Enter a search term to find contacts
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
              No contacts found matching &quot;{debouncedTerm}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    onSelect(contact);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-[var(--muted-foreground)]">{contact.email}</p>
                      )}
                    </div>
                    {contact.role && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded text-[var(--muted-foreground)]">
                        {contact.role}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
