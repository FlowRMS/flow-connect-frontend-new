'use client';

import React, { useState } from 'react';
import type { FileResponse } from '../../lib/graphql/files';
import { formatFileSize } from '../../lib/graphql/files';

interface QuickAccessProps {
  recentFiles: FileResponse[];
  onFileClick: (file: FileResponse) => void;
}

export function QuickAccess({ recentFiles, onFileClick }: QuickAccessProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (recentFiles.length === 0) return null;

  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--muted)]/30 to-transparent">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--muted-foreground)]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Quick Access</h2>
          <span className="text-xs text-[var(--muted-foreground)]">({recentFiles.length} recent)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {isCollapsed ? 'Show' : 'Hide'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--muted-foreground)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Content - collapsible */}
      {!isCollapsed && (
        <div className="px-6 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {recentFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onFileClick(file)}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md transition-all group"
              >
                <FileTypeIcon fileType={file.fileType} />
                <div className="text-left min-w-0">
                  <p
                    className="text-sm font-medium text-[var(--foreground)] truncate max-w-[140px] group-hover:text-[var(--primary)] transition-colors"
                    title={file.fileName}
                  >
                    {file.fileName}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatFileSize(file.fileSize)} · {formatRelativeTime(file.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileTypeIcon({ fileType }: { fileType?: string }) {
  const color = getFileIconColor(fileType);
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBgColor(fileType)}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={color}>
        <path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function getFileIconColor(fileType?: string): string {
  if (!fileType) return 'text-gray-500';
  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'text-purple-600';
  if (type.includes('pdf')) return 'text-red-600';
  if (type.includes('word') || type.includes('doc')) return 'text-blue-600';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'text-green-600';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'text-orange-600';
  if (type.includes('video')) return 'text-pink-600';
  if (type.includes('audio')) return 'text-yellow-600';
  if (type.includes('zip') || type.includes('archive')) return 'text-amber-600';
  return 'text-gray-500';
}

function getBgColor(fileType?: string): string {
  if (!fileType) return 'bg-gray-100';
  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'bg-purple-100';
  if (type.includes('pdf')) return 'bg-red-100';
  if (type.includes('word') || type.includes('doc')) return 'bg-blue-100';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'bg-green-100';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'bg-orange-100';
  if (type.includes('video')) return 'bg-pink-100';
  if (type.includes('audio')) return 'bg-yellow-100';
  if (type.includes('zip') || type.includes('archive')) return 'bg-amber-100';
  return 'bg-gray-100';
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
