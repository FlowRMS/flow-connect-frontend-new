'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
// API Hooks
import {
  useManufacturersWithSpecSheets,
  useSpecSheetsByFactory,
  useHighlightVersions,
} from './api/useSpecSheetsApi';
// Mock data for folders (TODO: replace with API when available)
import {
  mockSpecSheetFolders,
} from '../../lib/data/submittals-mock';
import type { SpecSheet, SpecSheetFolder } from '../../lib/types/submittals';
import SpecSheetUploadModal from './SpecSheetUploadModal';
import SpecSheetViewerModal from './SpecSheetViewerModal';

type HighlightFilter = 'all' | 'highlighted' | 'not_highlighted';

// Context Menu for folder actions
interface FolderContextMenuProps {
  folder: SpecSheetFolder;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddSubfolder: () => void;
}

function FolderContextMenu({ folder, position, onClose, onRename, onDelete, onAddSubfolder }: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={() => { onAddSubfolder(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
        </svg>
        Add Subfolder
      </button>
      <button
        onClick={() => { onRename(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z"/>
        </svg>
        Rename
      </button>
      <div className="border-t border-[var(--border)] my-1" />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6"/>
        </svg>
        Delete Folder
      </button>
    </div>
  );
}

export default function SpecSheetsContent() {
  const [selectedSpecSheet, setSelectedSpecSheet] = useState<SpecSheet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state - selectedManufacturerId is the factory UUID
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>('all');

  // Folder navigation
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set());

  // Collapsible sections
  const [sectionsExpanded, setSectionsExpanded] = useState({
    tags: false,
    highlights: false,
    manufacturers: true,
  });

  // Open Catalog modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Manufacturer management modal
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [editingManufacturerIndex, setEditingManufacturerIndex] = useState<number | null>(null);
  const [editingManufacturerName, setEditingManufacturerName] = useState('');
  const [draggedManufacturerIndex, setDraggedManufacturerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ============================================================================
  // API Hooks
  // ============================================================================

  // Fetch manufacturers (factories)
  const {
    data: manufacturers = [],
    isLoading: isLoadingManufacturers
  } = useManufacturersWithSpecSheets();

  // Fetch spec sheets for selected manufacturer
  const {
    data: specSheetsData,
    isLoading: isLoadingSpecSheets
  } = useSpecSheetsByFactory(selectedManufacturerId, false);

  // Transform API response to frontend SpecSheet type
  const specSheets: SpecSheet[] = useMemo(() => {
    if (!specSheetsData) return [];

    // Find the manufacturer name for the selected ID
    const manufacturer = manufacturers.find(m => m.id === selectedManufacturerId);
    const manufacturerName = manufacturer?.name || 'Unknown';

    return specSheetsData.map(sheet => ({
      id: sheet.id,
      manufacturer: manufacturerName,
      fileName: sheet.fileName,
      displayName: sheet.displayName,
      categories: sheet.categories as SpecSheet['categories'],
      tags: sheet.tags || [],
      folderId: undefined,
      uploadSource: sheet.uploadSource as SpecSheet['uploadSource'],
      sourceUrl: sheet.sourceUrl || undefined,
      fileUrl: sheet.fileUrl,
      fileSize: sheet.fileSize,
      pageCount: sheet.pageCount,
      uploadedAt: sheet.createdAt,
      uploadedBy: sheet.createdBy.fullName,
      needsReview: sheet.needsReview,
      usageCount: sheet.usageCount,
      highlightCount: sheet.highlightCount,
    }));
  }, [specSheetsData, selectedManufacturerId, manufacturers]);

  // Get the selected manufacturer name for display
  const selectedManufacturer = useMemo(() => {
    if (!selectedManufacturerId) return '';
    return manufacturers.find(m => m.id === selectedManufacturerId)?.name || '';
  }, [selectedManufacturerId, manufacturers]);

  // Derive manufacturer list from API data
  const manufacturerList = useMemo(() => {
    return manufacturers.map(m => m.name);
  }, [manufacturers]);

  // Auto-select first manufacturer when data loads (if none selected)
  useEffect(() => {
    if (!selectedManufacturerId && manufacturers.length > 0 && !isLoadingManufacturers) {
      setSelectedManufacturerId(manufacturers[0].id);
    }
  }, [manufacturers, selectedManufacturerId, isLoadingManufacturers]);

  // Helper to find factory ID by name (for compatibility with folder data)
  const findManufacturerIdByName = (name: string): string | null => {
    const found = manufacturers.find(m => m.name === name);
    return found?.id || null;
  };

  // Helper to select manufacturer by name (for folder clicks)
  const selectManufacturerByName = (name: string) => {
    const id = findManufacturerIdByName(name);
    if (id) setSelectedManufacturerId(id);
  };

  // Folder management state
  const [folders, setFolders] = useState<SpecSheetFolder[]>(mockSpecSheetFolders);
  const [contextMenu, setContextMenu] = useState<{ folder: SpecSheetFolder; position: { x: number; y: number } } | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderManufacturer, setNewFolderManufacturer] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');

  // Folder drag-and-drop state
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Manufacturer management functions
  const handleDragStart = (index: number) => {
    setDraggedManufacturerIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (_index: number) => {
    // Manufacturer reordering is not supported when using API data
    // Ordering should be managed through the manufacturer settings page
    setDraggedManufacturerIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedManufacturerIndex(null);
    setDragOverIndex(null);
  };

  const handleRenameManufacturer = (_index: number) => {
    // Manufacturer renaming should be done through the manufacturer settings page
    alert('To rename a manufacturer, please use the Manufacturers page in Settings.');
  };

  const handleSaveManufacturerRename = () => {
    setEditingManufacturerIndex(null);
    setEditingManufacturerName('');
  };

  const handleDeleteManufacturer = (_index: number) => {
    // Manufacturer deletion should be done through the manufacturer settings page
    alert('To delete a manufacturer, please use the Manufacturers page in Settings.');
  };

  const handleAddManufacturer = () => {
    // Manufacturer creation should be done through the manufacturer settings page
    alert('To add a new manufacturer, please use the Manufacturers page in Settings.');
  };

  // Folder management functions
  const handleFolderContextMenu = (e: React.MouseEvent, folder: SpecSheetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folder, position: { x: e.clientX, y: e.clientY } });
  };

  const handleRenameFolder = (folder: SpecSheetFolder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveRename = () => {
    if (editingFolderId && editingFolderName.trim()) {
      setFolders(prev => prev.map(f =>
        f.id === editingFolderId ? { ...f, name: editingFolderName.trim() } : f
      ));
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDeleteFolder = (folder: SpecSheetFolder) => {
    if (confirm(`Delete folder "${folder.name}"? This will not delete the spec sheets inside.`)) {
      // Delete folder and all child folders
      const idsToDelete = new Set<string>();
      const collectChildIds = (parentId: string) => {
        idsToDelete.add(parentId);
        folders.filter(f => f.parentId === parentId).forEach(child => collectChildIds(child.id));
      };
      collectChildIds(folder.id);
      setFolders(prev => prev.filter(f => !idsToDelete.has(f.id)));
      if (selectedFolderId && idsToDelete.has(selectedFolderId)) {
        setSelectedFolderId(null);
      }
    }
  };

  const handleAddSubfolder = (parentFolder: SpecSheetFolder) => {
    setNewFolderParentId(parentFolder.id);
    setNewFolderManufacturer(parentFolder.manufacturer || '');
    setNewFolderName('');
    setShowAddFolderModal(true);
  };

  const handleAddRootFolder = (manufacturer: string) => {
    setNewFolderParentId(null);
    setNewFolderManufacturer(manufacturer);
    setNewFolderName('');
    setShowAddFolderModal(true);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: SpecSheetFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        parentId: newFolderParentId,
        manufacturer: newFolderManufacturer || undefined,
        isAutoGenerated: false,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
      };
      setFolders(prev => [...prev, newFolder]);
      setShowAddFolderModal(false);
      setNewFolderName('');
      // Expand parent if adding subfolder
      if (newFolderParentId) {
        setExpandedFolders(prev => new Set([...prev, newFolderParentId!]));
      }
      // Also expand manufacturer
      if (newFolderManufacturer) {
        setExpandedManufacturers(prev => new Set([...prev, newFolderManufacturer]));
      }
    }
  };

  // Folder drag-and-drop handlers
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFolderId && draggedFolderId !== folderId) {
      // Don't allow dropping on own children
      const isChild = (parentId: string, childId: string): boolean => {
        const children = folders.filter(f => f.parentId === parentId);
        if (children.some(c => c.id === childId)) return true;
        return children.some(c => isChild(c.id, childId));
      };
      if (!isChild(draggedFolderId, folderId)) {
        setDragOverFolderId(folderId);
      }
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string | null, targetManufacturer?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFolderId) return;

    const draggedFolder = folders.find(f => f.id === draggedFolderId);
    if (!draggedFolder) return;

    // Don't allow dropping on self or own children
    if (targetFolderId === draggedFolderId) {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    // Check if target is a child of dragged folder
    const isChild = (parentId: string, childId: string): boolean => {
      const children = folders.filter(f => f.parentId === parentId);
      if (children.some(c => c.id === childId)) return true;
      return children.some(c => isChild(c.id, childId));
    };

    if (targetFolderId && isChild(draggedFolderId, targetFolderId)) {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    // Update the folder's parent
    setFolders(prev => prev.map(f => {
      if (f.id === draggedFolderId) {
        return {
          ...f,
          parentId: targetFolderId,
          manufacturer: targetManufacturer || f.manufacturer,
        };
      }
      return f;
    }));

    // Expand target folder if dropping into it
    if (targetFolderId) {
      setExpandedFolders(prev => new Set([...prev, targetFolderId]));
    }

    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  const handleFolderDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  // Get folders for manufacturer using local state
  const getFoldersForManufacturer = (manufacturer: string) => {
    return folders.filter(f => f.manufacturer === manufacturer && f.parentId === null);
  };

  // Get child folders using local state
  const getChildFoldersLocal = (parentId: string) => {
    return folders.filter(f => f.parentId === parentId);
  };

  // Derive all unique tags from loaded spec sheets
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    specSheets.forEach(sheet => {
      sheet.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [specSheets]);

  // Filter spec sheets (already filtered by manufacturer via API)
  const filteredSpecSheets = useMemo(() => {
    let result = [...specSheets];

    // Folder filter
    if (selectedFolderId) {
      result = result.filter(s => s.folderId === selectedFolderId);
    }

    // Tags filter (match any selected tag)
    if (selectedTags.length > 0) {
      result = result.filter(s =>
        selectedTags.some(tag => s.tags.includes(tag))
      );
    }

    // Highlight filter
    if (highlightFilter === 'highlighted') {
      result = result.filter(s => (s.highlightCount || 0) > 0);
    } else if (highlightFilter === 'not_highlighted') {
      result = result.filter(s => (s.highlightCount || 0) === 0);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.displayName.toLowerCase().includes(query) ||
        s.fileName.toLowerCase().includes(query) ||
        s.manufacturer.toLowerCase().includes(query) ||
        s.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [specSheets, selectedFolderId, selectedTags, highlightFilter, searchQuery]);

  // Get highlight count for a spec sheet (from API data)
  const getHighlightCount = (specSheetId: string) => {
    const sheet = specSheets.find(s => s.id === specSheetId);
    return sheet?.highlightCount || 0;
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Toggle manufacturer expansion
  const toggleManufacturer = (manufacturer: string) => {
    setExpandedManufacturers(prev => {
      const next = new Set(prev);
      if (next.has(manufacturer)) {
        next.delete(manufacturer);
      } else {
        next.add(manufacturer);
      }
      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedManufacturerId(null);
    setSelectedTags([]);
    setHighlightFilter('all');
    setSelectedFolderId(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedManufacturerId || selectedTags.length > 0 || highlightFilter !== 'all' || selectedFolderId;

  // Count spec sheets per manufacturer (from loaded data)
  const manufacturerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    specSheets.forEach(s => {
      counts[s.manufacturer] = (counts[s.manufacturer] || 0) + 1;
    });
    return counts;
  }, [specSheets]);

  // Count spec sheets in folder
  const getFolderCount = (folderId: string): number => {
    return specSheets.filter(s => s.folderId === folderId).length;
  };

  // Render folder tree recursively
  const renderFolderTree = (folderList: SpecSheetFolder[], depth: number = 0) => {
    return folderList.map(folder => {
      const childFolders = getChildFoldersLocal(folder.id);
      const hasChildren = childFolders.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;
      const isEditing = editingFolderId === folder.id;
      const count = getFolderCount(folder.id);

      return (
        <div key={folder.id}>
          <div
            onClick={() => {
              if (!isEditing) {
                if (hasChildren) toggleFolder(folder.id);
                setSelectedFolderId(isSelected ? null : folder.id);
                if (folder.manufacturer) selectManufacturerByName(folder.manufacturer);
              }
            }}
            onContextMenu={(e) => handleFolderContextMenu(e, folder)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--muted)]/50 transition-colors cursor-pointer group ${
              isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {hasChildren ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <span className="w-3 flex-shrink-0" />
            )}
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)] flex-shrink-0">
              <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
            </svg>
            {isEditing ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') {
                    setEditingFolderId(null);
                    setEditingFolderName('');
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-1 py-0.5 text-sm border border-[var(--primary)] rounded bg-[var(--background)] focus:outline-none"
              />
            ) : (
              <span className="flex-1 truncate text-left">{folder.name}</span>
            )}
            {count > 0 && !isEditing && (
              <span className="text-xs text-[var(--muted-foreground)]">{count}</span>
            )}
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFolderContextMenu(e, folder);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[var(--muted)] rounded transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="5" r="1"/>
                  <circle cx="10" cy="10" r="1"/>
                  <circle cx="10" cy="15" r="1"/>
                </svg>
              </button>
            )}
          </div>
          {hasChildren && isExpanded && renderFolderTree(childFolders, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Search & Filters */}
      <div className="w-72 border-r border-[var(--border)] bg-[var(--card)] flex flex-col flex-shrink-0">
        {/* Search Box */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="6"/>
              <path d="M15 15l-3-3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search spec sheets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Tags Section */}
          <div className="border-b border-[var(--border)]">
            <button
              onClick={() => toggleSection('tags')}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              <span>Tags</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${sectionsExpanded.tags ? 'rotate-180' : ''}`}
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {sectionsExpanded.tags && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    const count = specSheets.filter(s => s.tags.includes(tag)).length;
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        {tag}
                        <span className={`${isSelected ? 'text-white/70' : 'text-[var(--muted-foreground)]/70'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
                  >
                    Clear tags
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Highlights Section */}
          <div className="border-b border-[var(--border)]">
            <button
              onClick={() => toggleSection('highlights')}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              <span>Highlights</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${sectionsExpanded.highlights ? 'rotate-180' : ''}`}
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {sectionsExpanded.highlights && (
              <div className="px-4 pb-3 space-y-1">
                <button
                  onClick={() => setHighlightFilter('all')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    highlightFilter === 'all' ? 'bg-[var(--muted)] font-medium' : 'hover:bg-[var(--muted)]/50'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M7 7h6M7 10h6M7 13h4"/>
                  </svg>
                  <span className="flex-1 text-left">All Sheets</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{specSheets.length}</span>
                </button>
                <button
                  onClick={() => setHighlightFilter('highlighted')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    highlightFilter === 'highlighted' ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-[var(--muted)]/50'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                    <path d="M9 12l2 2 4-4"/>
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                  </svg>
                  <span className="flex-1 text-left">With Highlights</span>
                  <span className={`text-xs ${highlightFilter === 'highlighted' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                    {specSheets.filter(s => (s.highlightCount || 0) > 0).length}
                  </span>
                </button>
                <button
                  onClick={() => setHighlightFilter('not_highlighted')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    highlightFilter === 'not_highlighted' ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-[var(--muted)]/50'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500">
                    <rect x="3" y="3" width="14" height="14" rx="2"/>
                    <path d="M7 10h6"/>
                  </svg>
                  <span className="flex-1 text-left">Without Highlights</span>
                  <span className={`text-xs ${highlightFilter === 'not_highlighted' ? 'text-orange-600' : 'text-[var(--muted-foreground)]'}`}>
                    {specSheets.filter(s => (s.highlightCount || 0) === 0).length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Manufacturers Section */}
          <div>
            <div className="flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors">
              <button
                onClick={() => toggleSection('manufacturers')}
                className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
              >
                <span>Manufacturers</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${sectionsExpanded.manufacturers ? 'rotate-180' : ''}`}
                >
                  <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManufacturerModal(true);
                }}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                title="Manage manufacturers"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            {sectionsExpanded.manufacturers && (
              <div className="pb-2">
                {/* All Manufacturers option */}
                <button
                  onClick={() => {
                    setSelectedManufacturerId(null);
                    setSelectedFolderId(null);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)]/50 transition-colors ${
                    !selectedManufacturerId && !selectedFolderId ? 'bg-[var(--muted)] font-medium' : ''
                  }`}
                >
                  <span className="w-3" />
                  <span className="flex-1 text-left">All Manufacturers</span>
                  <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                    {isLoadingManufacturers ? '...' : manufacturers.length}
                  </span>
                </button>

                {isLoadingManufacturers ? (
                  <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Loading...</div>
                ) : manufacturers.map(mfr => {
                  const isExpanded = expandedManufacturers.has(mfr.name);
                  const isSelected = selectedManufacturerId === mfr.id && !selectedFolderId;
                  const manufacturerFolders = getFoldersForManufacturer(mfr.name);
                  const count = manufacturerCounts[mfr.name] || 0;

                  return (
                    <div key={mfr.id}>
                      <div
                        onClick={() => {
                          toggleManufacturer(mfr.name);
                          setSelectedManufacturerId(mfr.id);
                          setSelectedFolderId(null);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)]/50 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[var(--muted)] font-medium' : ''
                        }`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="flex-1 text-left truncate">{mfr.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddRootFolder(mfr.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[var(--muted)] rounded transition-all mr-1"
                          title="Add folder"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="bg-[var(--muted)]/30">
                          {manufacturerFolders.length > 0 && renderFolderTree(manufacturerFolders, 1)}
                          {/* Add folder button for empty manufacturers */}
                          {manufacturerFolders.length === 0 && (
                            <button
                              onClick={() => handleAddRootFolder(mfr.name)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
                              style={{ paddingLeft: '28px' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                              </svg>
                              Add folder
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Spec Sheet
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                Spec Sheets
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredSpecSheets.length} spec sheet{filteredSpecSheets.length !== 1 ? 's' : ''}
                {selectedManufacturer && ` from ${selectedManufacturer}`}
                {selectedTags.length > 0 && ` · ${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} selected`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                  Clear filters
                </button>
              )}

              {/* View Toggle */}
              <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
                  title="Grid view"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="5" height="5" rx="1"/>
                    <rect x="12" y="3" width="5" height="5" rx="1"/>
                    <rect x="3" y="12" width="5" height="5" rx="1"/>
                    <rect x="12" y="12" width="5" height="5" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-[var(--muted)]' : 'hover:bg-[var(--muted)]/50'} transition-colors`}
                  title="List view"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 5h12M4 10h12M4 15h12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setShowCatalogModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h12v12H4z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 8h12M8 4v12" strokeLinecap="round"/>
                </svg>
                Get from Open Catalog
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 14V6M6 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 17h14" strokeLinecap="round"/>
                </svg>
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSpecSheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No spec sheets found</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {hasActiveFilters || searchQuery
                  ? 'Try adjusting your filters'
                  : 'Upload your first spec sheet to get started'}
              </p>
              {(hasActiveFilters || searchQuery) ? (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/5 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 14V6M6 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 17h14" strokeLinecap="round"/>
                  </svg>
                  Upload Spec Sheet
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredSpecSheets.map(sheet => (
                <SpecSheetCard
                  key={sheet.id}
                  specSheet={sheet}
                  highlightCount={getHighlightCount(sheet.id)}
                  onClick={() => setSelectedSpecSheet(sheet)}
                  isSelected={selectedSpecSheet?.id === sheet.id}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSpecSheets.map(sheet => (
                <SpecSheetListItem
                  key={sheet.id}
                  specSheet={sheet}
                  highlightCount={getHighlightCount(sheet.id)}
                  onClick={() => setSelectedSpecSheet(sheet)}
                  isSelected={selectedSpecSheet?.id === sheet.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spec Sheet Viewer Modal */}
      {selectedSpecSheet && (
        <SpecSheetViewerModal
          specSheet={selectedSpecSheet}
          onClose={() => setSelectedSpecSheet(null)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <SpecSheetUploadModal
          onClose={() => setShowUploadModal(false)}
          defaultManufacturer={selectedManufacturer || undefined}
        />
      )}

      {/* Open Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCatalogModal(false)}
          />
          <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setShowCatalogModal(false)}
              className="absolute top-4 right-4 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="flex flex-col items-center text-center py-8">
              {/* Loading Spinner */}
              <div className="w-12 h-12 border-3 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin mb-6" />

              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Loading Spec Sheets
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Loading spec sheets from Flow Connect Open Catalog...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Folder Context Menu */}
      {contextMenu && (
        <FolderContextMenu
          folder={contextMenu.folder}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onRename={() => handleRenameFolder(contextMenu.folder)}
          onDelete={() => handleDeleteFolder(contextMenu.folder)}
          onAddSubfolder={() => handleAddSubfolder(contextMenu.folder)}
        />
      )}

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddFolderModal(false)}
          />
          <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {newFolderParentId ? 'Add Subfolder' : 'Add Folder'}
              </h3>
              <button
                onClick={() => setShowAddFolderModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowAddFolderModal(false);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              {newFolderManufacturer && (
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  This folder will be created under <span className="font-medium">{newFolderManufacturer}</span>
                  {newFolderParentId && (
                    <>
                      {' '}inside <span className="font-medium">{folders.find(f => f.id === newFolderParentId)?.name}</span>
                    </>
                  )}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddFolderModal(false)}
                  className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manufacturer Management Modal */}
      {showManufacturerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowManufacturerModal(false)}
          />
          <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-3xl mx-4 h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-semibold text-[var(--foreground)] text-xl">Manage Manufacturers & Folders</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">Drag to reorder, click names to rename, expand to see folder hierarchy</p>
              </div>
              <button
                onClick={() => setShowManufacturerModal(false)}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {manufacturerList.map((manufacturer, index) => {
                  const isEditing = editingManufacturerIndex === index;
                  const isDragging = draggedManufacturerIndex === index;
                  const isDragOver = dragOverIndex === index;
                  const count = manufacturerCounts[manufacturer] || 0;
                  const manufacturerFolders = getFoldersForManufacturer(manufacturer);
                  const isExpanded = expandedManufacturers.has(manufacturer);

                  // Recursive function to render folder tree in modal with drag-drop
                  const renderModalFolderTree = (folderList: SpecSheetFolder[], depth: number = 0): React.ReactNode => {
                    return folderList.map(folder => {
                      const childFolders = getChildFoldersLocal(folder.id);
                      const hasChildren = childFolders.length > 0;
                      const isFolderExpanded = expandedFolders.has(folder.id);
                      const isFolderEditing = editingFolderId === folder.id;
                      const folderCount = getFolderCount(folder.id);
                      const isFolderDragging = draggedFolderId === folder.id;
                      const isFolderDragOver = dragOverFolderId === folder.id;

                      return (
                        <div key={folder.id}>
                          <div
                            draggable={!isFolderEditing}
                            onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                            onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                            onDragLeave={handleFolderDragLeave}
                            onDrop={(e) => handleFolderDrop(e, folder.id, folder.manufacturer)}
                            onDragEnd={handleFolderDragEnd}
                            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors group ${
                              isFolderDragging
                                ? 'opacity-50 bg-[var(--primary)]/10'
                                : isFolderDragOver
                                ? 'bg-[var(--primary)]/20 ring-2 ring-[var(--primary)] ring-inset'
                                : 'hover:bg-[var(--muted)]/50'
                            }`}
                            style={{ marginLeft: `${depth * 24}px` }}
                          >
                            {/* Drag handle */}
                            <div className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)] opacity-50 group-hover:opacity-100">
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                <circle cx="7" cy="6" r="1.5"/>
                                <circle cx="13" cy="6" r="1.5"/>
                                <circle cx="7" cy="10" r="1.5"/>
                                <circle cx="13" cy="10" r="1.5"/>
                                <circle cx="7" cy="14" r="1.5"/>
                                <circle cx="13" cy="14" r="1.5"/>
                              </svg>
                            </div>

                            {/* Expand/collapse button */}
                            <button
                              onClick={() => hasChildren && toggleFolder(folder.id)}
                              className={`w-5 h-5 flex items-center justify-center ${hasChildren ? 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]' : 'invisible'}`}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`transition-transform ${isFolderExpanded ? 'rotate-90' : ''}`}
                              >
                                <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>

                            {/* Folder icon */}
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-500 flex-shrink-0">
                              <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                            </svg>

                            {/* Folder name / edit input */}
                            {isFolderEditing ? (
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                onBlur={handleSaveRename}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename();
                                  if (e.key === 'Escape') {
                                    setEditingFolderId(null);
                                    setEditingFolderName('');
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-2 py-0.5 text-sm border border-[var(--primary)] rounded bg-[var(--background)] focus:outline-none"
                              />
                            ) : (
                              <span
                                onClick={() => handleRenameFolder(folder)}
                                className="flex-1 text-sm text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)]"
                                title="Click to rename"
                              >
                                {folder.name}
                              </span>
                            )}

                            {/* Folder spec sheet count */}
                            {folderCount > 0 && !isFolderEditing && (
                              <span className="text-xs text-[var(--muted-foreground)]">{folderCount}</span>
                            )}

                            {/* Folder actions */}
                            {!isFolderEditing && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSubfolder(folder);
                                  }}
                                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                                  title="Add subfolder"
                                >
                                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameFolder(folder);
                                  }}
                                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                                  title="Rename"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFolder(folder);
                                  }}
                                  className="p-1 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete folder"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          {hasChildren && isFolderExpanded && renderModalFolderTree(childFolders, depth + 1)}
                        </div>
                      );
                    });
                  };

                  return (
                    <div
                      key={manufacturer}
                      className={`rounded-xl border transition-all ${
                        isDragging
                          ? 'opacity-50 border-[var(--primary)] bg-[var(--primary)]/5'
                          : isDragOver
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 border-dashed'
                          : 'border-[var(--border)] bg-[var(--card)]'
                      }`}
                    >
                      {/* Manufacturer Header Row */}
                      <div
                        draggable={!isEditing}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <circle cx="7" cy="5" r="1.5"/>
                            <circle cx="13" cy="5" r="1.5"/>
                            <circle cx="7" cy="10" r="1.5"/>
                            <circle cx="13" cy="10" r="1.5"/>
                            <circle cx="7" cy="15" r="1.5"/>
                            <circle cx="13" cy="15" r="1.5"/>
                          </svg>
                        </div>

                        {/* Expand/Collapse */}
                        <button
                          onClick={() => toggleManufacturer(manufacturer)}
                          className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>

                        {/* Manufacturer Icon */}
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                            <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                          </svg>
                        </div>

                        {/* Manufacturer Name / Edit Input */}
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingManufacturerName}
                            onChange={(e) => setEditingManufacturerName(e.target.value)}
                            onBlur={handleSaveManufacturerRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveManufacturerRename();
                              if (e.key === 'Escape') {
                                setEditingManufacturerIndex(null);
                                setEditingManufacturerName('');
                              }
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 text-sm font-medium border border-[var(--primary)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                          />
                        ) : (
                          <span
                            onClick={() => handleRenameManufacturer(index)}
                            className="flex-1 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)]"
                            title="Click to rename"
                          >
                            {manufacturer}
                          </span>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                            {count} sheet{count !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                            {manufacturerFolders.length} folder{manufacturerFolders.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleAddRootFolder(manufacturer);
                              }}
                              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                              title="Add folder"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleRenameManufacturer(index);
                              }}
                              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                              title="Rename"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteManufacturer(index);
                              }}
                              className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={count > 0 ? `Cannot delete (${count} spec sheets)` : 'Delete'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded Folder Hierarchy */}
                      {isExpanded && (
                        <div
                          className={`border-t border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3 ${
                            draggedFolderId && !dragOverFolderId ? 'ring-2 ring-inset ring-[var(--primary)]/30' : ''
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedFolderId) {
                              setDragOverFolderId(null);
                            }
                          }}
                          onDrop={(e) => handleFolderDrop(e, null, manufacturer)}
                        >
                          {manufacturerFolders.length > 0 ? (
                            <div className="space-y-0.5">
                              {renderModalFolderTree(manufacturerFolders)}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-6 text-center">
                              <div>
                                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)] mx-auto mb-2 opacity-50">
                                  <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                                </svg>
                                <p className="text-sm text-[var(--muted-foreground)]">No folders yet</p>
                                <button
                                  onClick={() => handleAddRootFolder(manufacturer)}
                                  className="mt-2 text-xs text-[var(--primary)] hover:underline"
                                >
                                  + Add first folder
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={handleAddManufacturer}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                Add Manufacturer
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--muted-foreground)]">
                  {manufacturerList.length} manufacturer{manufacturerList.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowManufacturerModal(false)}
                  className="px-5 py-2.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Spec Sheet Card Component (Grid View)
function SpecSheetCard({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
}: {
  specSheet: SpecSheet;
  highlightCount: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--card)] rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      }`}
    >
      {/* PDF Preview Placeholder */}
      <div className="aspect-[3/4] bg-[var(--muted)] flex items-center justify-center relative">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H8M10 13H8M14 13h-4M14 17H8" strokeLinecap="round"/>
        </svg>
        {specSheet.needsReview && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              Review
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background)]/80 px-1.5 py-0.5 rounded">
            {specSheet.pageCount} pages
          </span>
          {highlightCount > 0 && (
            <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
              {highlightCount} highlights
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-1">
          {specSheet.displayName}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-2">{specSheet.manufacturer}</p>
        <div className="flex flex-wrap gap-1">
          {specSheet.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {specSheet.tags.length > 2 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              +{specSheet.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Spec Sheet List Item Component (List View)
function SpecSheetListItem({
  specSheet,
  highlightCount,
  onClick,
  isSelected,
}: {
  specSheet: SpecSheet;
  highlightCount: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--card)] rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm flex items-center gap-4 ${
        isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
      }`}
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-[var(--muted)] rounded flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
            {specSheet.displayName}
          </h3>
          {specSheet.needsReview && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex-shrink-0">
              Needs Review
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-1">{specSheet.manufacturer}</p>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span>{specSheet.pageCount} pages</span>
          <span>{(specSheet.fileSize / 1024 / 1024).toFixed(1)} MB</span>
          <span>Used {specSheet.usageCount}x</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {specSheet.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {specSheet.tags.length > 3 && (
          <span className="text-xs text-[var(--muted-foreground)]">+{specSheet.tags.length - 3}</span>
        )}
      </div>

      {/* Highlights */}
      <div className="flex-shrink-0 text-right">
        {highlightCount > 0 ? (
          <span className="text-sm font-medium text-green-600">{highlightCount} highlights</span>
        ) : (
          <span className="text-sm text-[var(--muted-foreground)]">No highlights</span>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={(e) => { e.stopPropagation(); }}
        className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="5" r="1.5"/>
          <circle cx="10" cy="10" r="1.5"/>
          <circle cx="10" cy="15" r="1.5"/>
        </svg>
      </button>
    </div>
  );
}
