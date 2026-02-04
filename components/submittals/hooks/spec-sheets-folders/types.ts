import type { SpecSheetFolder } from '../../../../lib/types/submittals';

export interface Manufacturer {
  id: string;
  name: string;
}

export interface UseSpecSheetsFoldersParams {
  selectedManufacturerId: string | null;
  manufacturers: Manufacturer[];
}

export interface FolderContextMenu {
  folder: SpecSheetFolder;
  position: { x: number; y: number };
}

export interface FolderEditingState {
  editingFolderId: string | null;
  editingFolderName: string;
  editingFolderManufacturer: string;
}

export interface NewFolderState {
  showAddFolderModal: boolean;
  newFolderParentId: string | null;
  newFolderManufacturer: string;
  newFolderManufacturerId: string;
  newFolderName: string;
}

export interface DragDropState {
  draggedFolderId: string | null;
  dragOverFolderId: string | null;
}
