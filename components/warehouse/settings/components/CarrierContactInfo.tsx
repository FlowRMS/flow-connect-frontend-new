import React, { useState, useRef, useEffect } from 'react';
import type { ShippingCarrier } from '../types';
import { useContactSearchForCarrier, type ContactSearchResult } from '../api';

interface CarrierContactInfoProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
  onUnlinkContact?: (carrierId: string) => void;
  onLinkContact?: (carrierId: string, contactId: string) => void;
}

export default function CarrierContactInfo({
  carrier,
  onUpdate,
  onUnlinkContact,
  onLinkContact,
}: CarrierContactInfoProps) {
  const hasLinkedContact = !!carrier.contactId;
  const [mode, setMode] = useState<'view' | 'search' | 'create'>('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Contact search hook - always search when we have 2+ chars in search mode
  const enabled = mode === 'search' && searchQuery.length >= 2;
  const { data: contacts = [], isLoading } = useContactSearchForCarrier(searchQuery, enabled);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to update contact data fields (for create mode)
  const updateContactData = (field: string, value: string) => {
    const currentContact = carrier.contactData || {
      firstName: '',
      lastName: '',
    };
    onUpdate({
      contactData: {
        ...currentContact,
        [field]: value,
      },
    });
  };

  const handleSelectContact = (contact: ContactSearchResult) => {
    if (onLinkContact) {
      onLinkContact(carrier.id, contact.id);
    }
    setSearchQuery('');
    setShowDropdown(false);
    setMode('view');
  };

  const handleUnlink = () => {
    if (onUnlinkContact && carrier.contactId) {
      onUnlinkContact(carrier.id);
    }
  };

  const handleStartCreate = () => {
    setMode('create');
    // Clear any existing contact data to start fresh
    onUpdate({
      contactData: {
        firstName: '',
        lastName: '',
      },
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Contact Information
        {hasLinkedContact && (
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            Linked
          </span>
        )}
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        {/* Linked Contact View */}
        {hasLinkedContact && mode === 'view' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {carrier.contactData?.firstName} {carrier.contactData?.lastName}
                  </p>
                  {carrier.contactData?.email && (
                    <p className="text-xs text-[var(--muted-foreground)]">{carrier.contactData.email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Unlink
              </button>
            </div>

            {/* Read-only contact details */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
              {carrier.contactData?.phone && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Phone</label>
                  <p className="text-sm text-[var(--foreground)]">{carrier.contactData.phone}</p>
                </div>
              )}
              {carrier.contactData?.role && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Role</label>
                  <p className="text-sm text-[var(--foreground)]">{carrier.contactData.role}</p>
                </div>
              )}
              {carrier.contactData?.territory && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Territory</label>
                  <p className="text-sm text-[var(--foreground)]">{carrier.contactData.territory}</p>
                </div>
              )}
            </div>
            {carrier.contactData?.notes && (
              <div className="pt-2 border-t border-[var(--border)]">
                <label className="block text-xs text-[var(--muted-foreground)] mb-0.5">Notes</label>
                <p className="text-sm text-[var(--foreground)]">{carrier.contactData.notes}</p>
              </div>
            )}
          </>
        )}

        {/* No Contact - Show options */}
        {!hasLinkedContact && mode === 'view' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[var(--muted-foreground)]">No contact linked to this carrier.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('search')}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
              >
                Search Existing Contact
              </button>
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-lg transition-colors"
              >
                Create New Contact
              </button>
            </div>
          </div>
        )}

        {/* Search Mode */}
        {!hasLinkedContact && mode === 'search' && (
          <div ref={searchRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-[var(--muted-foreground)]">Search Contacts</label>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name..."
                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Search Results Dropdown */}
              {showDropdown && searchQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      Searching...
                    </div>
                  ) : contacts.length > 0 ? (
                    contacts.slice(0, 10).map((contact: ContactSearchResult) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--background)] flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                      No contacts found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-dashed border-[var(--border)] rounded-lg hover:bg-[var(--background)] transition-colors"
            >
              + Create new contact instead
            </button>
          </div>
        )}

        {/* Create Mode */}
        {!hasLinkedContact && mode === 'create' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-[var(--muted-foreground)]">Create New Contact</label>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">First Name *</label>
                <input
                  type="text"
                  value={carrier.contactData?.firstName || ''}
                  onChange={(e) => updateContactData('firstName', e.target.value)}
                  placeholder="First name"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Last Name *</label>
                <input
                  type="text"
                  value={carrier.contactData?.lastName || ''}
                  onChange={(e) => updateContactData('lastName', e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
                <input
                  type="tel"
                  value={carrier.contactData?.phone || ''}
                  onChange={(e) => updateContactData('phone', e.target.value)}
                  placeholder="(800) 555-1234"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Email</label>
                <input
                  type="email"
                  value={carrier.contactData?.email || ''}
                  onChange={(e) => updateContactData('email', e.target.value)}
                  placeholder="contact@carrier.com"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role & Territory */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Role</label>
                <input
                  type="text"
                  value={carrier.contactData?.role || ''}
                  onChange={(e) => updateContactData('role', e.target.value)}
                  placeholder="e.g. Account Manager"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Territory</label>
                <input
                  type="text"
                  value={carrier.contactData?.territory || ''}
                  onChange={(e) => updateContactData('territory', e.target.value)}
                  placeholder="e.g. West Coast"
                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Notes</label>
              <textarea
                value={carrier.contactData?.notes || ''}
                onChange={(e) => updateContactData('notes', e.target.value)}
                placeholder="Additional notes about this contact..."
                rows={2}
                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {carrier.contactData?.firstName && (
              <div className="text-xs text-[var(--muted-foreground)] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                A new contact will be created and linked when you save.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
