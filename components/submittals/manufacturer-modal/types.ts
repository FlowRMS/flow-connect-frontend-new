import type { SpecSheetFolder } from '../../../lib/types/submittals';

export interface FolderTreeItemProps {
  folder: SpecSheetFolder;
  manufacturer: string;
  depth: number;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  handleSaveRename: () => void;
  setEditingFolderId: (id: string | null) => void;
  handleRenameFolder: (folder: SpecSheetFolder) => void;
  handleDeleteFolder: (folder: SpecSheetFolder) => void;
  handleAddSubfolder: (folder: SpecSheetFolder) => void;
  draggedFolderId: string | null;
  dragOverFolderId: string | null;
  handleFolderDragStart: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragOver: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragLeave: (e: React.DragEvent) => void;
  handleFolderDrop: (e: React.DragEvent, targetFolderId: string | null, targetManufacturer?: string) => void;
  handleFolderDragEnd: () => void;
  getChildFoldersFromAll: (parentId: string, manufacturer: string) => SpecSheetFolder[];
  getFolderSpecSheetCount: (folderId: string, manufacturer: string) => number;
}

export interface ManufacturerRowProps {
  manufacturer: string;
  index: number;
  isEditing: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  count: number;
  folderCount: number;
  manufacturerFolders: SpecSheetFolder[];
  isExpanded: boolean;
  editingManufacturerName: string;
  setEditingManufacturerName: (name: string) => void;
  handleSaveManufacturerRename: () => void;
  handleRenameManufacturer: (index: number) => void;
  handleDeleteManufacturer: (index: number) => void;
  handleAddRootFolder: (manufacturer: string, manufacturerId?: string) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (index: number) => void;
  handleDragEnd: () => void;
  toggleManufacturer: (manufacturer: string) => void;
  draggedFolderId: string | null;
  dragOverFolderId: string | null;
  setDragOverFolderId: (id: string | null) => void;
  handleFolderDrop: (e: React.DragEvent, targetFolderId: string | null, targetManufacturer?: string) => void;
  // Folder tree props
  folderTreeProps: Omit<FolderTreeItemProps, 'folder' | 'manufacturer' | 'depth'>;
}
