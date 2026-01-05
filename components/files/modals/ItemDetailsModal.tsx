'use client';

import React, { useEffect } from 'react';
import type { FolderResponse, FileResponse } from '../../lib/graphql/files';
import { formatFileSize, getFileExtension } from '../../lib/graphql/files';

interface ItemDetailsModalProps {
  item: FolderResponse | FileResponse | null;
  type: 'file' | 'folder';
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailsModal({ item, type, isOpen, onClose }: ItemDetailsModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isFile = type === 'file';
  const file = isFile ? (item as FileResponse) : null;
  const folder = !isFile ? (item as FolderResponse) : null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCreatedBy = () => {
    if (isFile && file?.createdBy) {
      if (typeof file.createdBy === 'string') return file.createdBy;
      return file.createdBy.fullName || file.createdBy.email || 'Unknown';
    }
    if (!isFile && folder?.createdBy) {
      if (typeof folder.createdBy === 'string') return folder.createdBy;
      return folder.createdBy.fullName || folder.createdBy.email || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isFile ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {isFile ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                    fill="currentColor"
                    fillOpacity="0.2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                  <path
                    d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                    fill="currentColor"
                    fillOpacity="0.2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {isFile ? 'File' : 'Folder'} Details
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Properties and information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div className="flex items-start gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm text-[var(--muted-foreground)]">Name</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--foreground)] break-all">
                {isFile ? file?.fileName : folder?.name}
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-start gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm text-[var(--muted-foreground)]">Type</span>
            </div>
            <div className="flex-1">
              <span className="text-sm text-[var(--foreground)]">
                {isFile ? (
                  <>
                    {file?.fileType || 'Unknown'}
                    {file?.fileName && (
                      <span className="ml-1 text-[var(--muted-foreground)]">
                        (.{getFileExtension(file.fileName)})
                      </span>
                    )}
                  </>
                ) : (
                  'Folder'
                )}
              </span>
            </div>
          </div>

          {/* Size (files only) */}
          {isFile && file && (
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-[var(--muted-foreground)]">Size</span>
              </div>
              <div className="flex-1">
                <span className="text-sm text-[var(--foreground)]">
                  {formatFileSize(file.fileSize)}
                  <span className="ml-1 text-[var(--muted-foreground)]">
                    ({file.fileSize?.toLocaleString() || 0} bytes)
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Description (folders only) */}
          {!isFile && folder?.description && (
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-sm text-[var(--muted-foreground)]">Description</span>
              </div>
              <div className="flex-1">
                <span className="text-sm text-[var(--foreground)]">
                  {folder.description}
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--border)] pt-4 mt-4" />

          {/* Created */}
          <div className="flex items-start gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm text-[var(--muted-foreground)]">Created</span>
            </div>
            <div className="flex-1">
              <span className="text-sm text-[var(--foreground)]">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>

          {/* Created by */}
          <div className="flex items-start gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm text-[var(--muted-foreground)]">Created by</span>
            </div>
            <div className="flex-1">
              <span className="text-sm text-[var(--foreground)]">
                {getCreatedBy()}
              </span>
            </div>
          </div>

          {/* ID */}
          <div className="flex items-start gap-4">
            <div className="w-24 flex-shrink-0">
              <span className="text-sm text-[var(--muted-foreground)]">ID</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-mono text-[var(--muted-foreground)] break-all">
                {item.id}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
