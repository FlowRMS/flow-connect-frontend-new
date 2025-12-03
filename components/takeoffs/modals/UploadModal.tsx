/**
 * Upload Modal Component
 */

import React from 'react';
import { MAX_UPLOAD_FILES, ACCEPTED_FILE_TYPES } from '../constants';

interface UploadModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onFileSelect: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onUploadStart: () => void;
}

export function UploadModal({
  isOpen,
  files,
  onClose,
  onFileSelect,
  onRemoveFile,
  onUploadStart,
}: UploadModalProps) {
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Upload Documents for New Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drop Zone */}
          <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[var(--muted-foreground)]"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                  Choose files
                </span>
                <span className="text-[var(--muted-foreground)]"> or drag and drop</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleInputChange}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              PDF files only, up to {MAX_UPLOAD_FILES} files
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded border border-[var(--border)]"
                  >
                    <span className="text-sm text-[var(--foreground)] truncate">{file.name}</span>
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUploadStart}
            disabled={files.length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Start
          </button>
        </div>
      </div>
    </div>
  );
}
