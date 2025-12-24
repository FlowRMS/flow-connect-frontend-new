/**
 * Contact Detail Header Component
 * Enhanced with Jobs-style UI patterns and improved visual hierarchy
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
    <div className="mb-4 sm:mb-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-700 mb-3 sm:mb-4 transition-colors group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs sm:text-sm font-medium">Back to Contacts</span>
      </button>

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Contact Info */}
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Avatar */}
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-sm flex-shrink-0`}>
              {getInitials(contact.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{contact.name}</h1>
                {/* Contact Types */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {contact.contactType.map((type, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                {contact.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-1.5 truncate">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}
              </div>

              {/* ID Badge - hidden on mobile */}
              <div className="mt-3 hidden sm:block">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {contact.id}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs sm:text-sm font-medium"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Save Contact</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
