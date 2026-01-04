import React from 'react';
import type { FolderResponse, FileResponse } from '../../lib/graphql/files';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { NewFolderInline } from './NewFolderInline';

interface GridViewProps {
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
  // Inline folder creation
  isCreatingFolder?: boolean;
  onCreateFolder?: (name: string) => Promise<void>;
  onCancelCreateFolder?: () => void;
}

export function GridView({
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
  isCreatingFolder = false,
  onCreateFolder,
  onCancelCreateFolder,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
      {/* New folder inline (first position) */}
      {isCreatingFolder && onCreateFolder && onCancelCreateFolder && (
        <NewFolderInline
          isActive={isCreatingFolder}
          onSubmit={onCreateFolder}
          onCancel={onCancelCreateFolder}
        />
      )}

      {/* Folders */}
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          isSelected={isSelected(folder.id)}
          isHighlighted={isHighlighted(folder.id)}
          onClick={(e) => onItemClick(folder.id, 'folder', e)}
          onDoubleClick={() => onFolderDoubleClick(folder)}
          onCheckboxClick={(e) => onCheckboxClick(folder.id, 'folder', e)}
          onContextMenu={(e) => onContextMenu(folder.id, 'folder', e)}
        />
      ))}

      {/* Files */}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={isSelected(file.id)}
          isHighlighted={isHighlighted(file.id)}
          onClick={(e) => onItemClick(file.id, 'file', e)}
          onDoubleClick={() => onFileDoubleClick(file)}
          onCheckboxClick={(e) => onCheckboxClick(file.id, 'file', e)}
          onContextMenu={(e) => onContextMenu(file.id, 'file', e)}
          onDownload={() => onDownload(file)}
        />
      ))}
    </div>
  );
}
