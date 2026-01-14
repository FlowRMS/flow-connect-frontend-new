import { useState, useCallback, useMemo } from 'react';
import type { FolderResponse, FileResponse } from '../../lib/graphql/files';
import type { SelectedItem } from '../FilesContent';

export function useFileSelection(
  folders: FolderResponse[],
  files: FileResponse[]
) {
  // Selected items = checked checkboxes (for bulk operations)
  const [selectedItems, setSelectedItems] = useState<Map<string, 'file' | 'folder'>>(new Map());
  // Highlighted item = single-clicked item (like Finder)
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Get all items in order for range selection
  const allItems = useMemo(() => {
    const folderItems = folders.map(f => ({ id: f.id, type: 'folder' as const, name: f.name }));
    const fileItems = files.map(f => ({ id: f.id, type: 'file' as const, name: f.fileName }));
    return [...folderItems, ...fileItems];
  }, [folders, files]);

  // Handle item click (single click highlights, doesn't select checkbox)
  const handleItemClick = useCallback((
    id: string,
    type: 'file' | 'folder',
    event: React.MouseEvent
  ) => {
    // Cmd/Ctrl+click: Toggle selection (add to checked items)
    if (event.metaKey || event.ctrlKey) {
      setSelectedItems(prev => {
        const next = new Map(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.set(id, type);
        }
        return next;
      });
      setHighlightedId(id);
      setLastSelectedId(id);
    }
    // Shift+click: Range selection
    else if (event.shiftKey && lastSelectedId) {
      const fromIndex = allItems.findIndex(item => item.id === lastSelectedId);
      const toIndex = allItems.findIndex(item => item.id === id);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [start, end] = fromIndex < toIndex
          ? [fromIndex, toIndex]
          : [toIndex, fromIndex];

        const newSelection = new Map<string, 'file' | 'folder'>();
        for (let i = start; i <= end; i++) {
          const item = allItems[i];
          newSelection.set(item.id, item.type);
        }
        setSelectedItems(newSelection);
      }
      setHighlightedId(id);
    }
    // Regular click: Only highlight (like Finder/Explorer)
    else {
      setHighlightedId(id);
      setLastSelectedId(id);
    }
  }, [lastSelectedId, allItems]);

  // Handle checkbox click (toggles selection)
  const handleCheckboxClick = useCallback((
    id: string,
    type: 'file' | 'folder',
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, type);
      }
      return next;
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    const newSelection = new Map<string, 'file' | 'folder'>();
    folders.forEach(f => newSelection.set(f.id, 'folder'));
    files.forEach(f => newSelection.set(f.id, 'file'));
    setSelectedItems(newSelection);
  }, [folders, files]);

  // Clear all selections and highlight
  const clearSelection = useCallback(() => {
    setSelectedItems(new Map());
    setHighlightedId(null);
    setLastSelectedId(null);
  }, []);

  // Clear only highlight (clicking on empty space)
  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
  }, []);

  // Check if an item is selected (checkbox checked)
  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  // Check if an item is highlighted (single-clicked)
  const isHighlighted = useCallback((id: string) => {
    return highlightedId === id;
  }, [highlightedId]);

  // Toggle selection for a single item (used by checkbox)
  const toggleSelection = useCallback((id: string, type: 'file' | 'folder') => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, type);
      }
      return next;
    });
  }, []);

  // Get selected items as a list with names
  const getSelectedItemsList = useCallback((): SelectedItem[] => {
    const items: SelectedItem[] = [];
    selectedItems.forEach((type, id) => {
      if (type === 'folder') {
        const folder = folders.find(f => f.id === id);
        if (folder) {
          items.push({ id, type: 'folder', name: folder.name });
        }
      } else {
        const file = files.find(f => f.id === id);
        if (file) {
          items.push({ id, type: 'file', name: file.fileName });
        }
      }
    });
    return items;
  }, [selectedItems, folders, files]);

  // Get highlighted item info
  const getHighlightedItem = useCallback((): SelectedItem | null => {
    if (!highlightedId) return null;

    const folder = folders.find(f => f.id === highlightedId);
    if (folder) {
      return { id: highlightedId, type: 'folder', name: folder.name };
    }

    const file = files.find(f => f.id === highlightedId);
    if (file) {
      return { id: highlightedId, type: 'file', name: file.fileName };
    }

    return null;
  }, [highlightedId, folders, files]);

  return {
    selectedItems,
    highlightedId,
    handleItemClick,
    handleCheckboxClick,
    selectAll,
    clearSelection,
    clearHighlight,
    isSelected,
    isHighlighted,
    toggleSelection,
    getSelectedItemsList,
    getHighlightedItem,
  };
}
