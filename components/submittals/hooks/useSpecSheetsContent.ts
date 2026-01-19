import { useState, useMemo } from 'react';
import {
  useManufacturersWithSpecSheets,
  useSpecSheetSearch,
  useUpdateSpecSheet,
} from '../api/useSpecSheetsApi';
import type { SpecSheet, SpecSheetCategory } from '../../../lib/types/submittals';
import { useSpecSheetsFolders } from './useSpecSheetsFolders';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

export type HighlightFilter = 'all' | 'highlighted' | 'not_highlighted';

export function useSpecSheetsContent() {
  const [selectedSpecSheet, setSelectedSpecSheet] = useState<SpecSheet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-select state for drag & drop
  const [selectedSpecSheetIds, setSelectedSpecSheetIds] = useState<Set<string>>(new Set());

  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>('all');

  const [sectionsExpanded, setSectionsExpanded] = useState({
    tags: false,
    highlights: false,
    manufacturers: true,
  });

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [editingManufacturerIndex, setEditingManufacturerIndex] = useState<number | null>(null);
  const [editingManufacturerName, setEditingManufacturerName] = useState('');
  const [draggedManufacturerIndex, setDraggedManufacturerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Spec sheet drag to folder state
  const [specSheetDragOverFolderId, setSpecSheetDragOverFolderId] = useState<string | null>(null);
  const updateSpecSheetMutation = useUpdateSpecSheet();

  // API Hooks
  const {
    data: manufacturers = [],
    isLoading: isLoadingManufacturers,
    error: manufacturersError
  } = useManufacturersWithSpecSheets();

  const searchManufacturerId = searchQuery ? undefined : selectedManufacturerId;

  const {
    data: specSheetsData,
    isLoading: isLoadingSpecSheets,
    error: specSheetsError
  } = useSpecSheetSearch({
    searchTerm: searchQuery || undefined,
    factoryId: searchManufacturerId || undefined,
    publishedOnly: false,
    limit: 500,
  });

  const { data: allSpecSheetsData } = useSpecSheetSearch({
    searchTerm: '',
    factoryId: undefined,
    publishedOnly: false,
    limit: 1000,
  });

  const apiError = manufacturersError || specSheetsError;

  // Folder management hook
  const folderState = useSpecSheetsFolders({
    selectedManufacturerId,
    manufacturers,
  });

  const specSheets: SpecSheet[] = useMemo(() => {
    if (!specSheetsData) return [];
    return specSheetsData.map(sheet => {
      const manufacturer = manufacturers.find(m => m.id === sheet.factoryId);
      const manufacturerName = manufacturer?.name || 'Unknown';
      return {
        id: sheet.id,
        manufacturer: manufacturerName,
        fileName: sheet.fileName,
        displayName: sheet.displayName,
        categories: sheet.categories as SpecSheet['categories'],
        tags: sheet.tags || [],
        folderId: undefined,
        folderPath: sheet.folderPath || undefined,
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
      };
    });
  }, [specSheetsData, manufacturers]);

  const allSpecSheets: SpecSheet[] = useMemo(() => {
    if (!allSpecSheetsData) return [];
    return allSpecSheetsData.map(sheet => {
      const manufacturer = manufacturers.find(m => m.id === sheet.factoryId);
      const manufacturerName = manufacturer?.name || 'Unknown';
      return {
        id: sheet.id,
        manufacturer: manufacturerName,
        fileName: sheet.fileName,
        displayName: sheet.displayName,
        categories: sheet.categories as SpecSheet['categories'],
        tags: sheet.tags || [],
        folderId: undefined,
        folderPath: sheet.folderPath || undefined,
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
      };
    });
  }, [allSpecSheetsData, manufacturers]);

  const selectedManufacturer = useMemo(() => {
    if (!selectedManufacturerId) return '';
    return manufacturers.find(m => m.id === selectedManufacturerId)?.name || '';
  }, [selectedManufacturerId, manufacturers]);

  const manufacturerList = useMemo(() => manufacturers.map(m => m.name), [manufacturers]);

  const selectManufacturerByName = (name: string) => {
    const found = manufacturers.find(m => m.name === name);
    if (found) setSelectedManufacturerId(found.id);
  };

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Manufacturer drag handlers
  const handleDragStart = (index: number) => setDraggedManufacturerIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = () => { setDraggedManufacturerIndex(null); setDragOverIndex(null); };
  const handleDragEnd = () => { setDraggedManufacturerIndex(null); setDragOverIndex(null); };
  const handleRenameManufacturer = () => alert('To rename a manufacturer, please use the Manufacturers page in Settings.');
  const handleSaveManufacturerRename = () => { setEditingManufacturerIndex(null); setEditingManufacturerName(''); };
  const handleDeleteManufacturer = () => alert('To delete a manufacturer, please use the Manufacturers page in Settings.');
  const handleAddManufacturer = () => alert('To add a new manufacturer, please use the Manufacturers page in Settings.');

  const allCategories = useMemo(() => {
    const cats = new Set<SpecSheetCategory>();
    allSpecSheets.forEach(sheet => {
      if (sheet.categories && Array.isArray(sheet.categories)) sheet.categories.forEach(cat => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [allSpecSheets]);

  const filteredSpecSheets = useMemo(() => {
    let result = [...specSheets];
    if (folderState.selectedFolderId) {
      const selectedFolder = folderState.folders.find(f => f.id === folderState.selectedFolderId);
      if (selectedFolder?.folderPath) {
        const selectedPath = selectedFolder.folderPath;
        result = result.filter(s => s.folderPath === selectedPath || s.folderPath?.startsWith(selectedPath + '/'));
      }
    }
    if (selectedTags.length > 0) {
      result = result.filter(s => s.categories && selectedTags.some(cat => s.categories.includes(cat as SpecSheetCategory)));
    }
    if (highlightFilter === 'highlighted') result = result.filter(s => (s.highlightCount || 0) > 0);
    else if (highlightFilter === 'not_highlighted') result = result.filter(s => (s.highlightCount || 0) === 0);
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [specSheets, folderState.selectedFolderId, folderState.folders, selectedTags, highlightFilter]);

  const getHighlightCount = (specSheetId: string) => {
    const sheet = specSheets.find(s => s.id === specSheetId);
    return sheet?.highlightCount || 0;
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setHighlightFilter('all');
    folderState.setSelectedFolderId(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTags.length > 0 || highlightFilter !== 'all' || !!folderState.selectedFolderId || !!searchQuery;

  // Multi-select handlers
  const toggleSpecSheetSelection = (id: string, isCtrlOrCmd: boolean) => {
    setSelectedSpecSheetIds(prev => {
      const next = new Set(prev);
      if (isCtrlOrCmd) {
        // Toggle individual item
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        // Single select - clear others and select this one
        if (next.has(id) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectAllVisibleSpecSheets = () => {
    setSelectedSpecSheetIds(new Set(filteredSpecSheets.map(s => s.id)));
  };

  const clearSpecSheetSelection = () => {
    setSelectedSpecSheetIds(new Set());
  };

  // Handler for dropping spec sheet(s) on a folder - supports single ID or array
  const handleSpecSheetDrop = async (specSheetIdOrIds: string | string[], folderPath: string) => {
    const ids = Array.isArray(specSheetIdOrIds) ? specSheetIdOrIds : [specSheetIdOrIds];
    const count = ids.length;

    try {
      // Move all spec sheets in parallel
      await Promise.all(
        ids.map(id =>
          updateSpecSheetMutation.mutateAsync({
            id,
            input: { folderPath },
          })
        )
      );

      showSuccessToast(
        count === 1 ? 'Spec sheet moved' : `${count} spec sheets moved`,
        { description: `Moved to ${folderPath}` }
      );

      // Clear selection after successful move
      clearSpecSheetSelection();
      folderState.loadAllManufacturerFolders(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move spec sheet(s)';
      showErrorToast('Failed to move spec sheet(s)', { description: message });
    }
  };

  const manufacturerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSpecSheets.forEach(s => { counts[s.manufacturer] = (counts[s.manufacturer] || 0) + 1; });
    return counts;
  }, [allSpecSheets]);

  return {
    // State
    selectedSpecSheet,
    setSelectedSpecSheet,
    searchQuery,
    setSearchQuery,
    showUploadModal,
    setShowUploadModal,
    viewMode,
    setViewMode,
    selectedManufacturerId,
    setSelectedManufacturerId,
    selectedTags,
    setSelectedTags,
    highlightFilter,
    setHighlightFilter,
    sectionsExpanded,
    toggleSection,
    showCatalogModal,
    setShowCatalogModal,
    showManufacturerModal,
    setShowManufacturerModal,
    editingManufacturerIndex,
    editingManufacturerName,
    setEditingManufacturerName,
    draggedManufacturerIndex,
    dragOverIndex,

    // Computed
    manufacturers,
    isLoadingManufacturers,
    isLoadingSpecSheets,
    apiError,
    specSheets,
    allSpecSheets,
    selectedManufacturer,
    manufacturerList,
    filteredSpecSheets,
    allCategories,
    manufacturerCounts,
    hasActiveFilters,

    // Handlers
    selectManufacturerByName,
    clearFilters,
    getHighlightCount,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleRenameManufacturer,
    handleSaveManufacturerRename,
    handleDeleteManufacturer,
    handleAddManufacturer,

    // Spec sheet drag to folder
    specSheetDragOverFolderId,
    setSpecSheetDragOverFolderId,
    onSpecSheetDrop: handleSpecSheetDrop,

    // Multi-select for spec sheets
    selectedSpecSheetIds,
    toggleSpecSheetSelection,
    selectAllVisibleSpecSheets,
    clearSpecSheetSelection,

    // Folder state (spread from folderState)
    ...folderState,
  };
}
