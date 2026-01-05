'use client';

import React, { useCallback } from 'react';
import type { FolderResponse, FileResponse } from '../../lib/graphql/files';
import { formatFileSize, getFileExtension } from '../../lib/graphql/files';
import type { SortField, SortDirection } from '../FilesContent';

interface ListViewProps {
  folders: FolderResponse[];
  files: FileResponse[];
  isSelected: (id: string) => boolean;
  isHighlighted: (id: string) => boolean;
  onItemClick: (id: string, type: 'file' | 'folder', event: React.MouseEvent) => void;
  onCheckboxClick: (id: string, type: 'file' | 'folder', event: React.MouseEvent) => void;
  onFolderDoubleClick: (folder: FolderResponse) => void;
  onFileDoubleClick: (file: FileResponse) => void;
  onContextMenu: (id: string, type: 'file' | 'folder', event: React.MouseEvent) => void;
  onDownload: (file: FileResponse) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export function ListView({
  folders,
  files,
  isSelected,
  isHighlighted,
  onItemClick,
  onCheckboxClick,
  onFolderDoubleClick,
  onFileDoubleClick,
  onContextMenu,
  onDownload,
  sortField,
  sortDirection,
  onSortChange,
}: ListViewProps) {
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  // Prevent text selection on double-click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.detail > 1) {
      e.preventDefault();
    }
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
      >
        <path d="M12 5v14M5 12l7-7 7 7" />
      </svg>
    );
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
          <tr>
            <th className="w-10 px-4 py-3" />
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)]"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Name
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] hidden md:table-cell"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center">
                Type
                <SortIcon field="type" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] hidden sm:table-cell"
              onClick={() => handleSort('size')}
            >
              <div className="flex items-center">
                Size
                <SortIcon field="size" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] hidden lg:table-cell"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">
                Modified
                <SortIcon field="date" />
              </div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-[var(--card)]">
          {/* Folders */}
          {folders.map((folder, index) => (
            <tr
              key={folder.id}
              onClick={(e) => onItemClick(folder.id, 'folder', e)}
              onDoubleClick={() => onFolderDoubleClick(folder)}
              onMouseDown={handleMouseDown}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(folder.id, 'folder', e);
              }}
              className={`
                cursor-pointer transition-colors select-none border-b border-[var(--border)]
                ${isHighlighted(folder.id) ? 'bg-[var(--primary)]/20' : ''}
                ${isSelected(folder.id) && !isHighlighted(folder.id) ? 'bg-[var(--primary)]/10' : ''}
                ${!isHighlighted(folder.id) && !isSelected(folder.id) ? 'hover:bg-[var(--muted)]/50' : ''}
              `}
            >
              <td className="px-4 py-3">
                <button
                  onClick={(e) => onCheckboxClick(folder.id, 'folder', e)}
                  className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected(folder.id)
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }
                  `}
                >
                  {isSelected(folder.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500 flex-shrink-0">
                    <path
                      d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      fill="currentColor"
                      fillOpacity="0.2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="font-medium text-[var(--foreground)] truncate">{folder.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden md:table-cell">Folder</td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden sm:table-cell">--</td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden lg:table-cell">
                {formatDate(folder.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderDoubleClick(folder);
                  }}
                  className="p-1.5 hover:bg-[var(--muted)] rounded-md transition-colors"
                  title="Open folder"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}

          {/* Files */}
          {files.map((file, index) => (
            <tr
              key={file.id}
              onClick={(e) => onItemClick(file.id, 'file', e)}
              onDoubleClick={() => onFileDoubleClick(file)}
              onMouseDown={handleMouseDown}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(file.id, 'file', e);
              }}
              className={`
                cursor-pointer transition-colors select-none border-b border-[var(--border)] last:border-b-0
                ${isHighlighted(file.id) ? 'bg-[var(--primary)]/20' : ''}
                ${isSelected(file.id) && !isHighlighted(file.id) ? 'bg-[var(--primary)]/10' : ''}
                ${!isHighlighted(file.id) && !isSelected(file.id) ? 'hover:bg-[var(--muted)]/50' : ''}
              `}
            >
              <td className="px-4 py-3">
                <button
                  onClick={(e) => onCheckboxClick(file.id, 'file', e)}
                  className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected(file.id)
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }
                  `}
                >
                  {isSelected(file.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileTypeIcon fileType={file.fileType} />
                  <span className="font-medium text-[var(--foreground)] truncate">{file.fileName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden md:table-cell">
                <span className="uppercase">{getFileExtension(file.fileName) || 'File'}</span>
              </td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden sm:table-cell">
                {formatFileSize(file.fileSize)}
              </td>
              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] hidden lg:table-cell">
                {formatDate(file.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                  className="p-1.5 hover:bg-[var(--muted)] rounded-md transition-colors"
                  title="Download"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FileTypeIcon({ fileType }: { fileType?: string }) {
  const color = getFileIconColor(fileType);
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`${color} flex-shrink-0`}>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
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
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
