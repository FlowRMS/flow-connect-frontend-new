/**
 * HeaderTopBar Component
 * Top bar with back button, statement number, status, and action buttons
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface HeaderTopBarProps {
  statementNumber: string;
  isCreateMode: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  showActionsDropdown: boolean;
  setShowActionsDropdown: (show: boolean) => void;
}

export function HeaderTopBar({
  statementNumber,
  isCreateMode,
  hasChanges,
  isSaving,
  onSave,
  onDelete,
  onBack,
  showActionsDropdown,
  setShowActionsDropdown,
}: HeaderTopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/statements');
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-[var(--border)]">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="h-6 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {isCreateMode ? 'New Statement' : statementNumber || 'Statement'}
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {isCreateMode ? 'Create a new commission statement' : 'View and edit statement details'}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3">
          {/* Changes indicator */}
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          {/* Actions dropdown */}
          {!isCreateMode && (
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Actions
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showActionsDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-20">
                    <button
                      onClick={() => {
                        setShowActionsDropdown(false);
                        // TODO: Implement duplicate
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Duplicate
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => {
                          setShowActionsDropdown(false);
                          onDelete();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={isSaving || (!hasChanges && !isCreateMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaving || (!hasChanges && !isCreateMode)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17,21 17,13 7,13 7,21" />
                  <polyline points="7,3 7,8 15,8" />
                </svg>
                {isCreateMode ? 'Create Statement' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
