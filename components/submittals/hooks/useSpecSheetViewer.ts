'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SpecSheet, HighlightRegion, HighlightShape } from '../../../lib/types/submittals';
import {
  useHighlightVersions,
  useCreateHighlightVersion,
  useUpdateHighlightRegions,
  useDeleteHighlightVersion,
  useRenameHighlightVersion,
  useUpdateSpecSheet,
  type HighlightVersionResponse,
} from '../api/useSpecSheetsApi';
import { useAiHighlight } from './useAiHighlight';

export type HighlightVersion = {
  id: string;
  name: string;
  regions: HighlightRegion[];
  createdAt: string;
  createdBy: string;
};

function transformVersionResponse(response: HighlightVersionResponse): HighlightVersion {
  return {
    id: response.id,
    name: response.name,
    regions: response.regions.map(r => ({
      id: r.id,
      pageNumber: r.pageNumber,
      x: r.x, y: r.y, width: r.width, height: r.height,
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
  const [editableSpecSheetName, setEditableSpecSheetName] = useState(specSheet.displayName);
  const [isEditingSpecSheetName, setIsEditingSpecSheetName] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages); setPdfLoading(false); setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error); setPdfError('Failed to load PDF'); setPdfLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: { width: number; height: number; originalWidth: number; originalHeight: number }) => {
    // Use original (unscaled) dimensions - react-pdf's width/height are already scaled
    setPageSize({ width: page.originalWidth, height: page.originalHeight });
  }, []);

  // Version management
  const { data: apiVersions = [], isLoading: isLoadingVersions } = useHighlightVersions(specSheet.id);
  const createVersionMutation = useCreateHighlightVersion();
  const updateRegionsMutation = useUpdateHighlightRegions();
  const deleteVersionMutation = useDeleteHighlightVersion();
  const renameVersionMutation = useRenameHighlightVersion();
  const updateSpecSheetMutation = useUpdateSpecSheet();

  const versions = useMemo(() => {
    if (apiVersions.length === 0) return [{ id: 'new', name: 'Unsaved Highlights', regions: [], createdAt: new Date().toISOString(), createdBy: 'Current User' }];
    return apiVersions.map(transformVersionResponse);
  }, [apiVersions]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingVersionName, setEditingVersionName] = useState('');
  const [drawingRegions, setDrawingRegions] = useState<HighlightRegion[]>([]);
  const [activeTool, setActiveTool] = useState<HighlightShape | 'select'>('rectangle');
  const [activeColor, setActiveColor] = useState('#FFEB3B');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [modifiedSavedRegions, setModifiedSavedRegions] = useState<Set<string>>(new Set());
  const [savedRegionOverrides, setSavedRegionOverrides] = useState<Map<string, Partial<HighlightRegion>>>(new Map());
  const [sectionsExpanded, setSectionsExpanded] = useState({ details: false, tools: true, versions: false, aiHighlight: true, tags: true });
  const [newTag, setNewTag] = useState('');

  useEffect(() => { if (versions.length > 0 && !selectedVersionId) setSelectedVersionId(versions[0].id); }, [versions, selectedVersionId]);

  const toggleSection = useCallback((section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const savedRegions = useMemo(() => {
    const baseRegions = selectedVersion?.regions || [];
    return baseRegions.map(r => { const override = savedRegionOverrides.get(r.id); return override ? { ...r, ...override } : r; });
  }, [selectedVersion, savedRegionOverrides]);

  const allRegions = useMemo(() => [...savedRegions, ...drawingRegions], [savedRegions, drawingRegions]);
  const selectedRegion = useMemo(() => selectedRegionId ? allRegions.find(r => r.id === selectedRegionId) : null, [selectedRegionId, allRegions]);
  const currentPageRegions = useMemo(() => allRegions.filter(r => r.pageNumber === currentPage), [allRegions, currentPage]);

  const isSavedRegion = useCallback((regionId: string) => selectedVersion?.regions.some(r => r.id === regionId) || false, [selectedVersion]);
  const getPageHighlightCount = useCallback((pageNum: number) => allRegions.filter(r => r.pageNumber === pageNum).length, [allRegions]);

  const handleVersionSelect = useCallback((versionId: string) => { if (versionId !== selectedVersionId) setDrawingRegions([]); setSelectedVersionId(versionId); }, [selectedVersionId]);

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
      setDrawingRegions(prev => prev.map(r => r.id === selectedRegionId ? { ...r, tags: [...(r.tags || []), tag] } : r));
    }
    setNewTag('');
  }, [selectedRegionId, newTag, isSavedRegion, savedRegionOverrides, allRegions]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!selectedRegionId) return;
    if (isSavedRegion(selectedRegionId)) {
      const currentOverride = savedRegionOverrides.get(selectedRegionId) || {};
      const existingRegion = allRegions.find(r => r.id === selectedRegionId);
      const newOverrides = new Map(savedRegionOverrides);
      newOverrides.set(selectedRegionId, { ...currentOverride, tags: (existingRegion?.tags || []).filter(t => t !== tag) });
      setSavedRegionOverrides(newOverrides);
      setModifiedSavedRegions(prev => new Set(prev).add(selectedRegionId));
    } else {
      setDrawingRegions(prev => prev.map(r => r.id === selectedRegionId ? { ...r, tags: (r.tags || []).filter(t => t !== tag) } : r));
    }
  }, [selectedRegionId, isSavedRegion, savedRegionOverrides, allRegions]);

  const handleRegionsChange = useCallback((newRegions: HighlightRegion[]) => {
    const savedIds = new Set(savedRegions.map(r => r.id));
    setDrawingRegions(newRegions.filter(r => !savedIds.has(r.id)));
  }, [savedRegions]);

  const handleClearDrawing = useCallback(() => setDrawingRegions([]), []);
  const handleDeleteRegion = useCallback((regionId: string) => { if (drawingRegions.some(r => r.id === regionId)) setDrawingRegions(prev => prev.filter(r => r.id !== regionId)); }, [drawingRegions]);

  const handleSaveVersion = useCallback(async () => {
    if (!newVersionName.trim()) return;
    try {
      const allRegionsToSave = [...savedRegions, ...drawingRegions];
      const result = await createVersionMutation.mutateAsync({ specSheetId: specSheet.id, name: newVersionName.trim(), regions: allRegionsToSave.map(r => ({ pageNumber: r.pageNumber, x: r.x, y: r.y, width: r.width, height: r.height, shapeType: r.shape, color: r.color, annotation: r.annotation, tags: r.tags })) });
      setSelectedVersionId(result.id); setDrawingRegions([]); setNewVersionName(''); setShowSaveModal(false);
    } catch (error) { console.error('Failed to save version:', error); }
  }, [newVersionName, savedRegions, drawingRegions, createVersionMutation, specSheet.id]);

  const handleUpdateVersion = useCallback(async () => {
    if (drawingRegions.length === 0 && modifiedSavedRegions.size === 0) return;
    if (selectedVersionId === 'new') { setShowSaveModal(true); return; }
    try {
      const allRegionsToSave = [...savedRegions, ...drawingRegions];
      await updateRegionsMutation.mutateAsync({ versionId: selectedVersionId, regions: allRegionsToSave.map(r => ({ pageNumber: r.pageNumber, x: r.x, y: r.y, width: r.width, height: r.height, shapeType: r.shape, color: r.color, annotation: r.annotation, tags: r.tags })) });
      setDrawingRegions([]); setModifiedSavedRegions(new Set());
    } catch (error) { console.error('Failed to update version:', error); }
  }, [drawingRegions, modifiedSavedRegions, selectedVersionId, savedRegions, updateRegionsMutation]);

  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (versions.length <= 1 || versionId === 'new') return;
    try {
      await deleteVersionMutation.mutateAsync({ id: versionId, specSheetId: specSheet.id });
      if (selectedVersionId === versionId) setSelectedVersionId(versions.filter(v => v.id !== versionId)[0]?.id || '');
    } catch (error) { console.error('Failed to delete version:', error); }
  }, [versions, deleteVersionMutation, specSheet.id, selectedVersionId]);

  const handleRenameVersion = useCallback(async (versionId: string, newName: string) => {
    if (!newName.trim()) { setEditingVersionId(null); setEditingVersionName(''); return; }
    try { await renameVersionMutation.mutateAsync({ id: versionId, name: newName.trim(), specSheetId: specSheet.id }); } catch (error) { console.error('Failed to rename version:', error); } finally { setEditingVersionId(null); setEditingVersionName(''); }
  }, [renameVersionMutation, specSheet.id]);

  const handleSaveSpecSheetName = useCallback(async () => {
    if (!editableSpecSheetName.trim() || editableSpecSheetName === specSheet.displayName) return;
    try { await updateSpecSheetMutation.mutateAsync({ id: specSheet.id, input: { displayName: editableSpecSheetName.trim() } }); } catch (error) { console.error('Failed to save spec sheet name:', error); setEditableSpecSheetName(specSheet.displayName); }
  }, [editableSpecSheetName, specSheet.id, specSheet.displayName, updateSpecSheetMutation]);

  const hasUnsavedChanges = drawingRegions.length > 0;
  const addDrawingRegions = useCallback((regions: HighlightRegion[]) => { setDrawingRegions(prev => [...prev, ...regions]); }, []);
  const aiHighlight = useAiHighlight({ currentPage, setCurrentPage, addDrawingRegions });

  return {
    numPages, pdfLoading, pdfError, pageSize, onDocumentLoadSuccess, onDocumentLoadError, onPageLoadSuccess,
    currentPage, setCurrentPage, zoom, setZoom,
    editableSpecSheetName, setEditableSpecSheetName, isEditingSpecSheetName, setIsEditingSpecSheetName, handleSaveSpecSheetName,
    versions, isLoadingVersions, selectedVersionId, selectedVersion, showSaveModal, setShowSaveModal, newVersionName, setNewVersionName,
    editingVersionId, setEditingVersionId, editingVersionName, setEditingVersionName,
    handleVersionSelect, handleSaveVersion, handleUpdateVersion, handleDeleteVersion, handleRenameVersion,
    savedRegions, drawingRegions, setDrawingRegions, allRegions, currentPageRegions,
    selectedRegionId, setSelectedRegionId, selectedRegion, getPageHighlightCount, handleRegionsChange, handleClearDrawing, handleDeleteRegion, hasUnsavedChanges,
    activeTool, setActiveTool, activeColor, setActiveColor, sectionsExpanded, toggleSection, newTag, setNewTag, handleAddTag, handleRemoveTag,
    ...aiHighlight,
  };
}
