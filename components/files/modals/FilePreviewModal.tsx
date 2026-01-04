'use client';

import React, { useState, useEffect } from 'react';
import type { FileResponse } from '../../lib/graphql/files';
import { formatFileSize, getFileExtension, getFilePresignedUrl } from '../../lib/graphql/files';

interface FilePreviewModalProps {
  file: FileResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileResponse) => void;
}

export function FilePreviewModal({ file, isOpen, onClose, onDownload }: FilePreviewModalProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch presigned URL when file changes
  useEffect(() => {
    if (file && isOpen) {
      setIsLoadingUrl(true);
      setPresignedUrl(null);
      setImageError(false);
      getFilePresignedUrl(file.id)
        .then(setPresignedUrl)
        .catch(console.error)
        .finally(() => setIsLoadingUrl(false));
    }
  }, [file, isOpen]);

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!file || !isOpen) return null;

  const isImage = file.fileType?.toLowerCase().includes('image');
  const isPdf = file.fileType?.toLowerCase().includes('pdf');
  const isVideo = file.fileType?.toLowerCase().includes('video');
  const isAudio = file.fileType?.toLowerCase().includes('audio');
  const hasPreviewableContent = (isImage && !imageError) || isPdf || isVideo || isAudio;

  // For previewable content, use larger modal; otherwise use compact modal
  const modalSizeClass = hasPreviewableContent && presignedUrl
    ? 'w-full max-w-4xl max-h-[85vh]'
    : 'w-full max-w-md';

  const renderPreview = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--muted-foreground)]">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (!presignedUrl) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileTypeIcon fileType={file.fileType} />
            <p className="text-base font-medium text-[var(--foreground)] mt-3">{file.fileName}</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Unable to load preview</p>
            <button
              onClick={() => onDownload(file)}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors mx-auto"
            >
              <DownloadIcon />
              Download File
            </button>
          </div>
        </div>
      );
    }

    if (isImage && !imageError) {
      return (
        <div className="flex items-center justify-center p-4 bg-black/5 rounded-lg max-h-[60vh] overflow-auto">
          <img
            src={presignedUrl}
            alt={file.fileName}
            className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-lg"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="flex flex-col rounded-lg overflow-hidden border border-[var(--border)]">
          <object
            data={presignedUrl}
            type="application/pdf"
            className="w-full h-[50vh]"
          >
            {/* Fallback content if object doesn't work */}
            <div className="flex items-center justify-center py-8 bg-[var(--muted)]/30">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-500">
                    <path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                      fill="currentColor"
                      fillOpacity="0.2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
                    <text x="7" y="17" fontSize="6" fontWeight="bold" fill="currentColor">PDF</text>
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Your browser may not support inline PDF viewing.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <ExternalLinkIcon />
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => onDownload(file)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
                  >
                    <DownloadIcon />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </object>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center p-4 bg-black rounded-lg">
          <video
            src={presignedUrl}
            controls
            autoPlay={false}
            className="max-w-full max-h-[55vh] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex items-center justify-center py-8 bg-gradient-to-br from-[var(--primary)]/5 to-purple-500/5 rounded-lg">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--primary)]"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-3">{file.fileName}</p>
            <audio src={presignedUrl} controls className="mx-auto">
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );
    }

    // Default: Show file info with no preview (compact modal)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <FileTypeIcon fileType={file.fileType} />
          <p className="text-base font-medium text-[var(--foreground)] mt-3">{file.fileName}</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-4">
            Preview not available for this file type
          </p>
          <button
            onClick={() => onDownload(file)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors mx-auto"
          >
            <DownloadIcon />
            Download to view
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[var(--card)] rounded-xl shadow-xl overflow-hidden flex flex-col ${modalSizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <FileTypeIcon fileType={file.fileType} size="sm" />
            <div className="min-w-0">
              <h2 className="font-semibold text-[var(--foreground)] truncate text-sm">{file.fileName}</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatFileSize(file.fileSize)} · {getFileExtension(file.fileName).toUpperCase() || 'Unknown'} · {formatDate(file.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 p-4 overflow-auto">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

function FileTypeIcon({ fileType, size = 'lg' }: { fileType?: string; size?: 'sm' | 'lg' }) {
  const color = getFileIconColor(fileType);
  const dimensions = size === 'sm' ? 24 : 56;

  return (
    <div className={`flex-shrink-0 ${size === 'sm' ? '' : 'mx-auto'}`}>
      <svg width={dimensions} height={dimensions} viewBox="0 0 24 24" fill="none" className={color}>
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function getFileIconColor(fileType?: string): string {
  if (!fileType) return 'text-gray-400';
  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'text-purple-500';
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('word') || type.includes('doc')) return 'text-blue-500';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'text-green-500';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'text-orange-500';
  if (type.includes('video')) return 'text-pink-500';
  if (type.includes('audio')) return 'text-yellow-500';
  if (type.includes('zip') || type.includes('archive')) return 'text-amber-500';
  return 'text-gray-400';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
