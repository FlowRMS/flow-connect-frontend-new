/**
 * HeaderTopBar Component
 * Top bar with back button, check number, and all action buttons/dropdowns
 */

import { useRouter } from 'next/navigation';
import type { CommissionCheck } from '@/lib/types/rms';
import type { CheckStatus, VersionInfo } from '../../types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_COLORS } from '../../constants';

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
}: HeaderTopBarProps) {
  const router = useRouter();

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
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown (unposted) OR See Posted Statement Button (posted) */}
          {status === 'unposted' ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowActionsDropdown(!showActionsDropdown);
                  setShowStatusDropdown(false);
                  setShowSaveDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Actions
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
              {showActionsDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsDropdown(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-72 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={handleExportCheckDetails}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-start gap-3"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[var(--muted-foreground)] mt-0.5"
                      >
                        <path
                          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2v6h6M8 13h8M8 17h8M8 9h2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)]">
                          Export Check Details
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          Export to Excel
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={handleReconcileCheck}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-start gap-3"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[var(--muted-foreground)] mt-0.5"
                      >
                        <path
                          d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-[var(--foreground)]">
                          Reconcile Check
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          AI-powered automatic reconciliation
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
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
          )}

          {/* Version Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVersionDropdown(!showVersionDropdown);
                setShowActionsDropdown(false);
                setShowStatusDropdown(false);
                setShowSaveDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              v{currentVersion}
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
            {showVersionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowVersionDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                  {availableVersions.map((v) => (
                    <button
                      key={v.version}
                      onClick={() => {
                        setCurrentVersion(v.version);
                        setShowVersionDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                        currentVersion === v.version
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>v{v.version}</span>
                        {v.isLatest && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {v.date}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status Dropdown */}
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

          {/* Save Button */}
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
                    onClick={handleSaveAsNewVersion}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg border-t border-[var(--border)]"
                  >
                    Save as New Version
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

