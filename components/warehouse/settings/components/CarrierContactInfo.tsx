'use client';

import { useCallback, useState } from 'react';
import type { ShippingCarrier } from '../types';
import { EntitySearchDropdown, type EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';
import { searchContacts, type ContactSearchResult } from '@/components/lib/api/search';
import CreateContactModal from '@/components/contacts/modals/CreateContactModal';

interface CarrierContactInfoProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierContactInfo({
  carrier,
  onUpdate,
}: CarrierContactInfoProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Convert contacts to entity search results format
  const handleContactSearch = useCallback(async (query: string, limit?: number): Promise<EntitySearchResult[]> => {
    const contacts = await searchContacts(query, limit);
    return contacts.map((contact: ContactSearchResult) => ({
      entityId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      metadata: contact.email || contact.phone || undefined,
    }));
  }, []);

  // Handle contact selection
  const handleContactSelect = useCallback((entityId: string | null, result: EntitySearchResult | null) => {
    if (entityId && result) {
      // Find the full contact data to get phone/email
      searchContacts('', 200).then(contacts => {
        const selectedContact = contacts.find(c => c.id === entityId);
        if (selectedContact) {
          onUpdate({
            primaryContactId: entityId,
            contactName: result.name,
            contactPhone: selectedContact.phone || undefined,
            contactEmail: selectedContact.email || undefined,
          });
        } else {
          // Fallback if contact not found in list
          onUpdate({
            primaryContactId: entityId,
            contactName: result.name,
            contactPhone: undefined,
            contactEmail: undefined,
          });
        }
      });
    } else {
      // Clear contact
      onUpdate({
        primaryContactId: undefined,
        contactName: undefined,
        contactPhone: undefined,
        contactEmail: undefined,
      });
    }
  }, [onUpdate]);

  // Handle contact creation success - auto-select the newest contact
  const handleContactCreated = useCallback(async () => {
    // Fetch the latest contacts and select the most recently created one
    const contacts = await searchContacts('', 200);
    if (contacts.length > 0) {
      // Sort by created_at descending to get the newest
      const sortedContacts = [...contacts].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      const newestContact = sortedContacts[0];
      onUpdate({
        primaryContactId: newestContact.id,
        contactName: `${newestContact.firstName} ${newestContact.lastName}`.trim(),
        contactPhone: newestContact.phone || undefined,
        contactEmail: newestContact.email || undefined,
      });
    }
  }, [onUpdate]);

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
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        {/* Contact Search Dropdown with Create Button */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <EntitySearchDropdown
              label="Primary Contact"
              selectedId={carrier.primaryContactId || null}
              selectedName={carrier.contactName || null}
              placeholder="Search for a contact..."
              onSelect={handleContactSelect}
              onSearch={handleContactSearch}
              clearable={true}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)]/50 text-sm font-medium text-[var(--foreground)] transition-colors flex items-center gap-1.5"
            title="Create new contact"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Show contact details when selected (read-only) */}
        {carrier.primaryContactId && (carrier.contactPhone || carrier.contactEmail) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
            {carrier.contactPhone && (
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                  Phone
                </label>
                <div className="px-3 py-1.5 text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded-lg">
                  {carrier.contactPhone}
                </div>
              </div>
            )}
            {carrier.contactEmail && (
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                  Email
                </label>
                <div className="px-3 py-1.5 text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded-lg truncate">
                  {carrier.contactEmail}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help text */}
        {!carrier.primaryContactId && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Search and select an existing contact, or create a new one.
          </p>
        )}
      </div>

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleContactCreated}
      />
    </div>
  );
}
