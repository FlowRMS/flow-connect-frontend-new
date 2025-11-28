/**
 * Contact Detail Header Component
 */

import React from 'react';
import { getInitials, getAvatarColor } from '../utils';
import type { Contact } from '../types';

interface ContactDetailHeaderProps {
  contact: Contact;
  isEditing: boolean;
  isSaving: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function ContactDetailHeader({
  contact,
  isEditing,
  isSaving,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: ContactDetailHeaderProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Contacts
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-lg font-bold`}>
              {getInitials(contact.name)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{contact.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {contact.contactType.map((type, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] ml-16">{contact.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
          {isEditing ? (
            <>
              <button 
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
