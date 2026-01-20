/**
 * NavigationBlockerModal Component
 * Displays when user tries to navigate away from a page with unsaved changes.
 * Offers options to save, discard, or cancel navigation.
 */

'use client';

import React from 'react';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

export function NavigationBlockerModal() {
  const {
    showModal,
    entityType,
    entityName,
    isSaving,
    cancelNavigation,
    confirmNavigation,
    handleSaveAndNavigate,
  } = useUnsavedChangesContext();

  if (!showModal) return null;

  const displayName = entityName
    ? `${entityType} "${entityName}"`
    : entityType
    ? `this ${entityType.toLowerCase()}`
    : 'this page';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      onClick={cancelNavigation}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Unsaved Changes</h2>
              <p className="text-sm text-gray-500">Your changes will be lost</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700">
            You have unsaved changes to {displayName}. What would you like to do?
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {/* Cancel - stay on page */}
          <button
            type="button"
            onClick={cancelNavigation}
            disabled={isSaving}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Discard changes and navigate */}
          <button
            type="button"
            onClick={confirmNavigation}
            disabled={isSaving}
            className="px-4 py-2.5 border border-red-300 text-red-700 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Discard Changes
          </button>

          {/* Save and navigate */}
          <button
            type="button"
            onClick={handleSaveAndNavigate}
            disabled={isSaving}
            className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigationBlockerModal;
