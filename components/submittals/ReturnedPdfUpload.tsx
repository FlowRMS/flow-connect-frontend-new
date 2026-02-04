'use client';

import React from 'react';
import type {
  Submittal,
  SubmittalRevision,
  ReturnedPdf,
} from '../../lib/types/submittals';
import {
  useReturnedPdfUpload,
  formatFileSize,
  MAX_FILE_SIZE_MB_EXPORT as MAX_FILE_SIZE_MB,
} from './hooks/useReturnedPdfUpload';

interface ReturnedPdfUploadProps {
  submittal: Submittal;
  revision: SubmittalRevision;
  onClose: () => void;
  onSuccess?: (returnedPdf: ReturnedPdf) => void;
}

export default function ReturnedPdfUpload({
  submittal,
  revision,
  onClose,
  onSuccess,
}: ReturnedPdfUploadProps) {
  const {
    isDragging,
    selectedFile,
    selectedStakeholder,
    setSelectedStakeholder,
    receivedDate,
    setReceivedDate,
    notes,
    setNotes,
    analyzeWithAI,
    setAnalyzeWithAI,
    uploading,
    uploadProgress,
    analyzing,
    error,
    fileInputRef,
    stakeholders,
    isValid,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleUpload,
    clearFile,
  } = useReturnedPdfUpload({ submittal, revision, onClose, onSuccess });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Upload Returned Submittal</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Revision {revision.revisionNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--foreground)]">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--foreground)] mb-1">
                  Drag and drop PDF here, or click to browse
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  PDF files only (max {MAX_FILE_SIZE_MB}MB)
                </p>
              </>
            )}
          </div>

          {/* Received From */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Received From <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStakeholder?.contactId || ''}
              onChange={(e) => {
                const stakeholder = stakeholders.find(s => s.contactId === e.target.value);
                setSelectedStakeholder(stakeholder || null);
              }}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">Select stakeholder...</option>
              {stakeholders.map(s => (
                <option key={s.contactId} value={s.contactId}>
                  {s.contactName} - {s.companyName || s.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date Received */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Date Received <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Notes <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this response..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            />
          </div>

          {/* AI Analysis Toggle */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analyzeWithAI}
                onChange={(e) => setAnalyzeWithAI(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Analyze PDF for changes (AI-assisted)
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    Coming soon
                  </span>
                </span>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Automatically detect markups, stamps, and comments that need attention
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="px-6 py-2 bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)] min-w-[3rem] text-right">
                {uploadProgress}%
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!isValid || uploading || analyzing}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading || analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {analyzing ? 'Analyzing...' : `Uploading... ${uploadProgress}%`}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
