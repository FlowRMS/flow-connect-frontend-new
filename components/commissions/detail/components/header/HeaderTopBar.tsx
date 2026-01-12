/**
 * HeaderTopBar Component
 * Top bar with back button, check number, and all action buttons/dropdowns
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus, VersionInfo } from '../../types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_COLORS } from '../../constants';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';
import { PDFBuilder } from '@/components/shared/pdf-builder';

interface HeaderTopBarProps {
  check: CommissionCheck;
  // Status
  status: CheckStatus;
  setStatus: (status: CheckStatus) => void;
  // Dropdowns state
  showActionsDropdown: boolean;
  setShowActionsDropdown: (show: boolean) => void;
  showStatusDropdown: boolean;
  setShowStatusDropdown: (show: boolean) => void;
  showVersionDropdown: boolean;
  setShowVersionDropdown: (show: boolean) => void;
  showSaveDropdown: boolean;
  setShowSaveDropdown: (show: boolean) => void;
  showPostedStatementDropdown: boolean;
  setShowPostedStatementDropdown: (show: boolean) => void;
  // Version
  currentVersion: number;
  setCurrentVersion: (version: number) => void;
  availableVersions: VersionInfo[];
  // Actions
  onExportCheckDetails?: () => void;
  onReconcileCheck?: () => void;
  onSeePostedStatement?: () => void;
  onDownloadExcel?: () => void;
  onSave?: () => void;
  onSaveAndClose?: () => void;
  onSaveAsNewVersion?: () => void;
  onUnpost?: () => void;
  onDelete?: () => void;
  // Create mode
  isCreateMode?: boolean;
  isSaving?: boolean;
  isUnposting?: boolean;
  isDeleting?: boolean;
  // Whether the check was originally posted (from API) - controls if Save is disabled
  isOriginallyPosted?: boolean;
}

const getStatusColor = (status: CheckStatus) => {
  return CHECK_STATUS_COLORS[status];
};

export function HeaderTopBar({
  check,
  status,
  setStatus,
  showActionsDropdown,
  setShowActionsDropdown,
  showStatusDropdown,
  setShowStatusDropdown,
  showVersionDropdown,
  setShowVersionDropdown,
  showSaveDropdown,
  setShowSaveDropdown,
  showPostedStatementDropdown,
  setShowPostedStatementDropdown,
  currentVersion,
  setCurrentVersion,
  availableVersions,
  onExportCheckDetails,
  onReconcileCheck,
  onSeePostedStatement,
  onDownloadExcel,
  onSave,
  onSaveAndClose,
  onSaveAsNewVersion,
  onUnpost,
  onDelete,
  isCreateMode = false,
  isSaving = false,
  isUnposting = false,
  isDeleting = false,
  isOriginallyPosted = false,
}: HeaderTopBarProps) {
  const router = useRouter();
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);

  const handleExportCheckDetails = () => {
    onExportCheckDetails?.();
    setShowActionsDropdown(false);
  };

  const handleReconcileCheck = () => {
    onReconcileCheck?.();
    setShowActionsDropdown(false);
  };

  const handleDownloadExcel = () => {
    onDownloadExcel?.();
    setShowPostedStatementDropdown(false);
  };

  const handleSave = () => {
    onSave?.();
    setShowSaveDropdown(false);
  };

  const handleSaveAndClose = () => {
    onSaveAndClose?.();
    setShowSaveDropdown(false);
    router.push('/commissions');
  };

  const handleSaveAsNewVersion = () => {
    onSaveAsNewVersion?.();
    setShowSaveDropdown(false);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/commissions')}
            className="p-1 hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Back to Commissions"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            {check.checkNumber}
          </h1>
          <CreatedByBadge
            createdBy={(check as any).createdBy}
            createdAt={(check as any).createdAt}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Button - Coming Soon (unposted) OR See Posted Statement Button (posted) */}
          {status === 'unposted' ? (
            <div className="relative opacity-50">
              <button
                disabled
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium cursor-not-allowed bg-gray-50"
                title="Coming Soon"
              >
                Actions
                <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                  Soon
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* See Posted Statement Button */}
              <div className="relative">
                <div className="flex">
                  <button
                    onClick={onSeePostedStatement}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--primary)] text-white rounded-l-lg text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2v6h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 13H8M16 17H8M10 9H8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    See Posted Statement
                  </button>
                  <button
                    onClick={() =>
                      setShowPostedStatementDropdown(!showPostedStatementDropdown)
                    }
                    className="px-2 py-2 bg-[var(--primary)] text-white rounded-r-lg hover:bg-[var(--primary)]/90 transition-colors border-l border-[var(--primary)]/50"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {showPostedStatementDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPostedStatementDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={handleDownloadExcel}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Download Excel
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Unpost Button - Only shown for posted checks */}
              <button
                onClick={onUnpost}
                disabled={isUnposting}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Unpost this check to enable editing"
              >
                {isUnposting ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 3v5h5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isUnposting ? 'Unposting...' : 'Unpost'}
              </button>
            </>
          )}

          {/* Delete Button - Only for existing checks that are not posted */}
          {!isCreateMode && !isOriginallyPosted && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete this check"
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M5 6v11a2 2 0 002 2h6a2 2 0 002-2V6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {/* PDF Button */}
          <button
            onClick={() => setShowPDFBuilder(true)}
            disabled={isCreateMode || !check.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCreateMode || !check.id
                ? 'bg-red-600 text-white opacity-50 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
            </svg>
            PDF
          </button>

          {/* Version Dropdown - Coming Soon */}
          <div className="relative opacity-50">
            <button
              disabled
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium cursor-not-allowed bg-gray-50"
              title="Coming Soon"
            >
              v{currentVersion}
              <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                Soon
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 8l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Status Display - Read-only for posted checks */}
          {status === 'posted' ? (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(status)}`}
              title="Posted checks cannot be edited. Use Unpost to enable editing."
            >
              {CHECK_STATUS_LABELS[status]}
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="opacity-60"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowActionsDropdown(false);
                  setShowVersionDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${getStatusColor(status)}`}
              >
                {CHECK_STATUS_LABELS[status]}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showStatusDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-36 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
                    {(['unposted', 'posted'] as CheckStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStatus(s);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          status === s
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                            : 'hover:bg-[var(--muted)]'
                        }`}
                      >
                        {CHECK_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Save Button - Disabled only for checks that were originally posted (from API) */}
          {isOriginallyPosted ? (
            <div
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
              title="Posted checks cannot be edited. Use Unpost to enable editing."
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Save
            </div>
          ) : (
            <div className="relative">
              <div className="flex">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDropdown(!showSaveDropdown);
                    setShowActionsDropdown(false);
                    setShowStatusDropdown(false);
                    setShowVersionDropdown(false);
                  }}
                  className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M6 8l4 4 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {showSaveDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSaveDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                    <button
                      onClick={handleSave}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleSaveAndClose}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      Save & Close
                    </button>
                    <button
                      disabled
                      className="w-full text-left px-4 py-2 text-sm transition-colors rounded-b-lg border-t border-[var(--border)] opacity-50 cursor-not-allowed flex items-center justify-between"
                      title="Coming Soon"
                    >
                      <span>Save as New Version</span>
                      <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                        Soon
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Builder */}
      <PDFBuilder
        entityId={check.id}
        entityType="CHECKS"
        isOpen={showPDFBuilder}
        onClose={() => setShowPDFBuilder(false)}
      />
    </div>
  );
}

