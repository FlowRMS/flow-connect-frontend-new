'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SpecSheet, HighlightRegion, HighlightShape } from '../../../lib/types/submittals';
import {
  useHighlightVersions,
  useCreateHighlightVersion,
  useUpdateHighlightRegions,
  useDeleteHighlightVersion,
  type HighlightVersionResponse,
} from '../api/useSpecSheetsApi';
import { useAiHighlight } from './useAiHighlight';

// Version type for saved highlight configurations
export type HighlightVersion = {
  id: string;
  name: string;
  regions: HighlightRegion[];
  createdAt: string;
  createdBy: string;
};

// Transform API response to local format
function transformVersionResponse(response: HighlightVersionResponse): HighlightVersion {
  return {
    id: response.id,
    name: response.name,
    regions: response.regions.map(r => ({
      id: r.id,
      pageNumber: r.pageNumber,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      shape: r.shapeType as HighlightShape,
      color: r.color,
      annotation: r.annotation || undefined,
      tags: r.tags || [],
    })),
    createdAt: response.createdAt,
    createdBy: response.createdBy.fullName,
  };
}

interface UseSpecSheetViewerParams {
  specSheet: SpecSheet;
}

export function useSpecSheetViewer({ specSheet }: UseSpecSheetViewerParams) {
  // PDF state
  const [numPages, setNumPages] = useState<number>(specSheet.pageCount);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 612, height: 792 });

  // Editable names
  const [editableSpecSheetName, setEditableSpecSheetName] = useState(specSheet.displayName);
  const [isEditingSpecSheetName, setIsEditingSpecSheetName] = useState(false);

  // Page navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  // PDF load handlers
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF');
    setPdfLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height });
  }, []);

  // Version management - fetch from API
  const { data: apiVersions = [], isLoading: isLoadingVersions } = useHighlightVersions(specSheet.id);
  const createVersionMutation = useCreateHighlightVersion();
  const updateRegionsMutation = useUpdateHighlightRegions();
  const deleteVersionMutation = useDeleteHighlightVersion();

  // Transform API versions to local format
  const versions = useMemo(() => {
    if (apiVersions.length === 0) {
      return [{
        id: 'new',
        name: 'Unsaved Highlights',
        regions: [],
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
      }];
    }
    return apiVersions.map(transformVersionResponse);
  }, [apiVersions]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // Select first version when versions load
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);

  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingVersionName, setEditingVersionName] = useState('');

  // Current drawing regions (unsaved)
  const [drawingRegions, setDrawingRegions] = useState<HighlightRegion[]>([]);
  const [activeTool, setActiveTool] = useState<HighlightShape | 'select'>('rectangle');
  const [activeColor, setActiveColor] = useState('#FFEB3B');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Track modifications to saved regions
  const [modifiedSavedRegions, setModifiedSavedRegions] = useState<Set<string>>(new Set());
  const [savedRegionOverrides, setSavedRegionOverrides] = useState<Map<string, Partial<HighlightRegion>>>(new Map());

  // Collapsible section states
  const [sectionsExpanded, setSectionsExpanded] = useState({
    details: false,
    tools: true,
    versions: false,
    aiHighlight: true,
    tags: true,
  });

  // Tag management
  const [newTag, setNewTag] = useState('');

  const toggleSection = useCallback((section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Get the selected version's regions
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const savedRegions = useMemo(() => {
    const version = versions.find(v => v.id === selectedVersionId);
    const baseRegions = version?.regions || [];
    return baseRegions.map(r => {
      const override = savedRegionOverrides.get(r.id);
      return override ? { ...r, ...override } : r;
    });
  }, [versions, selectedVersionId, savedRegionOverrides]);

  // Combine saved regions with current drawing regions
  const allRegions = useMemo(() => [...savedRegions, ...drawingRegions], [savedRegions, drawingRegions]);

  // Get selected region
  const selectedRegion = useMemo(() => {
    if (!selectedRegionId) return null;
    return allRegions.find(r => r.id === selectedRegionId);
  }, [selectedRegionId, allRegions]);

  // Check if a region is a saved region
  const isSavedRegion = useCallback((regionId: string) => {
    const version = versions.find(v => v.id === selectedVersionId);
    return version?.regions.some(r => r.id === regionId) || false;
  }, [versions, selectedVersionId]);

  // Add tag to selected region
  const handleAddTag = useCallback(() => {
    if (!selectedRegionId || !newTag.trim()) return;
    const tag = newTag.trim();

    if (isSavedRegion(selectedRegionId)) {
      const currentOverride = savedRegionOverrides.get(selectedRegionId) || {};
      const existingRegion = allRegions.find(r => r.id === selectedRegionId);
      const existingTags = existingRegion?.tags || [];
      if (!existingTags.includes(tag)) {
        const newOverrides = new Map(savedRegionOverrides);
        newOverrides.set(selectedRegionId, { ...currentOverride, tags: [...existingTags, tag] });
        setSavedRegionOverrides(newOverrides);
        setModifiedSavedRegions(prev => new Set(prev).add(selectedRegionId));
      }
    } else {
      setDrawingRegions(prev => prev.map(r => {
        if (r.id === selectedRegionId) {
          const existingTags = r.tags || [];
          if (existingTags.includes(tag)) return r;
          return { ...r, tags: [...existingTags, tag] };
        }
        return r;
      }));
    }
    setNewTag('');
  }, [selectedRegionId, newTag, isSavedRegion, savedRegionOverrides, allRegions]);

  // Remove tag from selected region
  const handleRemoveTag = useCallback((tag: string) => {
    if (!selectedRegionId) return;

    if (isSavedRegion(selectedRegionId)) {
      const currentOverride = savedRegionOverrides.get(selectedRegionId) || {};
      const existingRegion = allRegions.find(r => r.id === selectedRegionId);
      const existingTags = existingRegion?.tags || [];
      const newOverrides = new Map(savedRegionOverrides);
      newOverrides.set(selectedRegionId, { ...currentOverride, tags: existingTags.filter(t => t !== tag) });
      setSavedRegionOverrides(newOverrides);
      setModifiedSavedRegions(prev => new Set(prev).add(selectedRegionId));
    } else {
      setDrawingRegions(prev => prev.map(r => {
        if (r.id === selectedRegionId) {
          return { ...r, tags: (r.tags || []).filter(t => t !== tag) };
        }
        return r;
      }));
    }
  }, [selectedRegionId, isSavedRegion, savedRegionOverrides, allRegions]);

  // Clear drawing regions when switching versions
  const handleVersionSelect = useCallback((versionId: string) => {
    if (versionId !== selectedVersionId) {
      setDrawingRegions([]);
    }
    setSelectedVersionId(versionId);
  }, [selectedVersionId]);

  // Get regions for current page
  const currentPageRegions = useMemo(() => allRegions.filter(r => r.pageNumber === currentPage), [allRegions, currentPage]);

  // Count highlights per page for thumbnails
  const getPageHighlightCount = useCallback((pageNum: number) => allRegions.filter(r => r.pageNumber === pageNum).length, [allRegions]);

  // Handle region changes
  const handleRegionsChange = useCallback((newRegions: HighlightRegion[]) => {
    const savedIds = new Set(savedRegions.map(r => r.id));
    const newDrawingRegions = newRegions.filter(r => !savedIds.has(r.id));
    setDrawingRegions(newDrawingRegions);
  }, [savedRegions]);

  const handleClearDrawing = useCallback(() => setDrawingRegions([]), []);

  const handleDeleteRegion = useCallback((regionId: string) => {
    const isDrawingRegion = drawingRegions.some(r => r.id === regionId);
    if (isDrawingRegion) {
      setDrawingRegions(prev => prev.filter(r => r.id !== regionId));
    }
  }, [drawingRegions]);

  // Save as new version via API
  const handleSaveVersion = useCallback(async () => {
    if (!newVersionName.trim()) return;

    try {
      const allRegionsToSave = [...savedRegions, ...drawingRegions];
      const result = await createVersionMutation.mutateAsync({
        specSheetId: specSheet.id,
        name: newVersionName.trim(),
        regions: allRegionsToSave.map(r => ({
          pageNumber: r.pageNumber,
          x: r.x, y: r.y, width: r.width, height: r.height,
          shapeType: r.shape, color: r.color, annotation: r.annotation, tags: r.tags,
        })),
      });

      setSelectedVersionId(result.id);
      setDrawingRegions([]);
      setNewVersionName('');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  }, [newVersionName, savedRegions, drawingRegions, createVersionMutation, specSheet.id]);

  // Update current version
  const handleUpdateVersion = useCallback(async () => {
    if (drawingRegions.length === 0 && modifiedSavedRegions.size === 0) return;
    if (selectedVersionId === 'new') {
      setShowSaveModal(true);
      return;
    }

    try {
      const allRegionsToSave = [...savedRegions, ...drawingRegions];
      await updateRegionsMutation.mutateAsync({
        versionId: selectedVersionId,
        regions: allRegionsToSave.map(r => ({
          pageNumber: r.pageNumber,
          x: r.x, y: r.y, width: r.width, height: r.height,
          shapeType: r.shape, color: r.color, annotation: r.annotation, tags: r.tags,
        })),
      });
      setDrawingRegions([]);
      setModifiedSavedRegions(new Set());
    } catch (error) {
      console.error('Failed to update version:', error);
    }
  }, [drawingRegions, modifiedSavedRegions, selectedVersionId, savedRegions, updateRegionsMutation]);

  // Delete a version
  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (versions.length <= 1 || versionId === 'new') return;

    try {
      await deleteVersionMutation.mutateAsync({ id: versionId, specSheetId: specSheet.id });
      if (selectedVersionId === versionId) {
        const remaining = versions.filter(v => v.id !== versionId);
        setSelectedVersionId(remaining[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  }, [versions, deleteVersionMutation, specSheet.id, selectedVersionId]);

  // Rename a version
  const handleRenameVersion = useCallback((versionId: string, newName: string) => {
    if (!newName.trim()) return;
    console.log('Version rename not yet implemented in API:', versionId, newName);
    setEditingVersionId(null);
    setEditingVersionName('');
  }, []);

  const hasUnsavedChanges = drawingRegions.length > 0;

  // Add drawing regions helper for AI
  const addDrawingRegions = useCallback((regions: HighlightRegion[]) => {
    setDrawingRegions(prev => [...prev, ...regions]);
  }, []);

  // AI Highlight hook
  const aiHighlight = useAiHighlight({
    currentPage,
    setCurrentPage,
    addDrawingRegions,
  });

  return {
    // PDF state
    numPages, pdfLoading, pdfError, pageSize,
    onDocumentLoadSuccess, onDocumentLoadError, onPageLoadSuccess,

    // Navigation
    currentPage, setCurrentPage, zoom, setZoom,

    // Editable name
    editableSpecSheetName, setEditableSpecSheetName,
    isEditingSpecSheetName, setIsEditingSpecSheetName,

    // Versions
    versions, isLoadingVersions, selectedVersionId, selectedVersion,
    showSaveModal, setShowSaveModal, newVersionName, setNewVersionName,
    editingVersionId, setEditingVersionId, editingVersionName, setEditingVersionName,
    handleVersionSelect, handleSaveVersion, handleUpdateVersion, handleDeleteVersion, handleRenameVersion,

    // Regions
    savedRegions, drawingRegions, setDrawingRegions, allRegions, currentPageRegions,
    selectedRegionId, setSelectedRegionId, selectedRegion,
    getPageHighlightCount, handleRegionsChange, handleClearDrawing, handleDeleteRegion, hasUnsavedChanges,

    // Tools
    activeTool, setActiveTool, activeColor, setActiveColor,

    // Sections
    sectionsExpanded, toggleSection,

    // Tags
    newTag, setNewTag, handleAddTag, handleRemoveTag,

    // AI Highlight
    ...aiHighlight,
  };
}
