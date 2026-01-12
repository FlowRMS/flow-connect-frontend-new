'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { SpecSheet, HighlightRegion, HighlightShape } from '../../lib/types/submittals';
import HighlightCanvas from './HighlightCanvas';
import {
  useHighlightVersions,
  useCreateHighlightVersion,
  useUpdateHighlightRegions,
  useDeleteHighlightVersion,
  type HighlightVersionResponse,
} from './api/useSpecSheetsApi';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Demo PDF path - used for all spec sheets in this demo
const DEMO_PDF_PATH = '/spec-sheets/NPTPSW_spec.pdf';

// Version type for saved highlight configurations (maps from API response)
type HighlightVersion = {
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
      tags: [],
    })),
    createdAt: response.createdAt,
    createdBy: response.createdBy.fullName,
  };
}

interface SpecSheetViewerModalProps {
  specSheet: SpecSheet;
  onClose: () => void;
}

export default function SpecSheetViewerModal({ specSheet, onClose }: SpecSheetViewerModalProps) {
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
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF');
    setPdfLoading(false);
  };

  // Track page render to get dimensions
  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    setPageSize({ width: page.width, height: page.height });
  };

  // Version management - fetch from API
  const { data: apiVersions = [], isLoading: isLoadingVersions } = useHighlightVersions(specSheet.id);
  const createVersionMutation = useCreateHighlightVersion();
  const updateRegionsMutation = useUpdateHighlightRegions();
  const deleteVersionMutation = useDeleteHighlightVersion();

  // Transform API versions to local format
  const versions = useMemo(() => {
    if (apiVersions.length === 0) {
      // Return default if no versions exist
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

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get the selected version's regions
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const savedRegions = useMemo(() => {
    const version = versions.find(v => v.id === selectedVersionId);
    return version?.regions || [];
  }, [versions, selectedVersionId]);

  // Combine saved regions with current drawing regions
  const allRegions = useMemo(() => {
    return [...savedRegions, ...drawingRegions];
  }, [savedRegions, drawingRegions]);

  // Get selected region
  const selectedRegion = useMemo(() => {
    if (!selectedRegionId) return null;
    return allRegions.find(r => r.id === selectedRegionId);
  }, [selectedRegionId, allRegions]);

  // Add tag to selected region
  const handleAddTag = () => {
    if (!selectedRegionId || !newTag.trim()) return;

    const tag = newTag.trim();
    const updatedRegions = allRegions.map(r => {
      if (r.id === selectedRegionId) {
        const existingTags = r.tags || [];
        if (existingTags.includes(tag)) return r;
        return { ...r, tags: [...existingTags, tag] };
      }
      return r;
    });

    handleRegionsChange(updatedRegions);
    setNewTag('');
  };

  // Remove tag from selected region
  const handleRemoveTag = (tag: string) => {
    if (!selectedRegionId) return;

    const updatedRegions = allRegions.map(r => {
      if (r.id === selectedRegionId) {
        return { ...r, tags: (r.tags || []).filter(t => t !== tag) };
      }
      return r;
    });

    handleRegionsChange(updatedRegions);
  };

  // Clear drawing regions when switching versions
  const handleVersionSelect = useCallback((versionId: string) => {
    if (versionId !== selectedVersionId) {
      setDrawingRegions([]); // Clear unsaved highlights when switching versions
    }
    setSelectedVersionId(versionId);
  }, [selectedVersionId]);

  // Get regions for current page
  const currentPageRegions = useMemo(() => {
    return allRegions.filter(r => r.pageNumber === currentPage);
  }, [allRegions, currentPage]);

  // Count highlights per page for thumbnails
  const getPageHighlightCount = (pageNum: number) => {
    return allRegions.filter(r => r.pageNumber === pageNum).length;
  };

  // Handle region changes (drawing regions only - saved regions are read-only)
  const handleRegionsChange = useCallback((newRegions: HighlightRegion[]) => {
    // Get saved region IDs
    const savedIds = new Set(savedRegions.map(r => r.id));

    // Only keep new drawing regions (saved regions cannot be modified in-place)
    const newDrawingRegions = newRegions.filter(r => !savedIds.has(r.id));

    // Update drawing regions
    setDrawingRegions(newDrawingRegions);
  }, [savedRegions]);

  // Clear current drawing
  const handleClearDrawing = () => {
    setDrawingRegions([]);
  };

  // Delete a specific region (only drawing regions can be deleted locally)
  const handleDeleteRegion = (regionId: string) => {
    // Check if it's a drawing region
    const isDrawingRegion = drawingRegions.some(r => r.id === regionId);
    if (isDrawingRegion) {
      setDrawingRegions(prev => prev.filter(r => r.id !== regionId));
    }
    // Saved regions cannot be deleted individually - use "Update Version" to save changes
  };

  // Save as new version via API
  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) return;

    try {
      const allRegions = [...savedRegions, ...drawingRegions];
      const result = await createVersionMutation.mutateAsync({
        specSheetId: specSheet.id,
        name: newVersionName.trim(),
        regions: allRegions.map(r => ({
          pageNumber: r.pageNumber,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          shapeType: r.shape,
          color: r.color,
          annotation: r.annotation,
        })),
      });

      setSelectedVersionId(result.id);
      setDrawingRegions([]);
      setNewVersionName('');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  // Update current version with new regions via API
  const handleUpdateVersion = async () => {
    if (drawingRegions.length === 0) return;
    if (selectedVersionId === 'new') {
      // For unsaved versions, prompt to save as new
      setShowSaveModal(true);
      return;
    }

    try {
      const allRegions = [...savedRegions, ...drawingRegions];
      await updateRegionsMutation.mutateAsync({
        versionId: selectedVersionId,
        regions: allRegions.map(r => ({
          pageNumber: r.pageNumber,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          shapeType: r.shape,
          color: r.color,
          annotation: r.annotation,
        })),
      });
      setDrawingRegions([]);
    } catch (error) {
      console.error('Failed to update version:', error);
    }
  };

  // Delete a version via API
  const handleDeleteVersion = async (versionId: string) => {
    if (versions.length <= 1) return; // Keep at least one version
    if (versionId === 'new') return; // Can't delete unsaved version

    try {
      await deleteVersionMutation.mutateAsync({ id: versionId, specSheetId: specSheet.id });
      if (selectedVersionId === versionId) {
        const remaining = versions.filter(v => v.id !== versionId);
        setSelectedVersionId(remaining[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  };

  // Rename a version (not implemented - would need API endpoint)
  const handleRenameVersion = (versionId: string, newName: string) => {
    if (!newName.trim()) return;
    // TODO: Add API endpoint for renaming versions
    console.log('Version rename not yet implemented in API:', versionId, newName);
    setEditingVersionId(null);
    setEditingVersionName('');
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = drawingRegions.length > 0;

  // AI Highlight state
  const [aiHighlightPrompt, setAiHighlightPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Simulated AI highlight function - in production this would call an AI API
  const handleAiHighlight = async () => {
    if (!aiHighlightPrompt.trim()) return;

    setIsAiProcessing(true);
    setAiError(null);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated AI-generated highlights based on common spec sheet terms
      // In production, this would use OCR + AI to find and locate the text
      const prompt = aiHighlightPrompt.toLowerCase();
      const newRegions: HighlightRegion[] = [];

      // Simulate finding different areas based on keywords
      if (prompt.includes('wattage') || prompt.includes('watt') || prompt.includes('power')) {
        newRegions.push({
          id: `ai-${Date.now()}-1`,
          pageNumber: 1,
          x: 10,
          y: 55,
          width: 35,
          height: 8,
          shape: 'rectangle',
          color: '#FFEB3B',
          annotation: 'Wattage/Power specs',
        });
      }

      if (prompt.includes('dimension') || prompt.includes('size') || prompt.includes('measurement')) {
        newRegions.push({
          id: `ai-${Date.now()}-2`,
          pageNumber: 1,
          x: 52,
          y: 20,
          width: 45,
          height: 35,
          shape: 'rectangle',
          color: '#2196F3',
          annotation: 'Product dimensions',
        });
      }

      if (prompt.includes('lumen') || prompt.includes('output') || prompt.includes('brightness')) {
        newRegions.push({
          id: `ai-${Date.now()}-3`,
          pageNumber: 1,
          x: 10,
          y: 52,
          width: 35,
          height: 6,
          shape: 'rectangle',
          color: '#4CAF50',
          annotation: 'Lumen output',
        });
      }

      if (prompt.includes('cct') || prompt.includes('temperature') || prompt.includes('kelvin')) {
        newRegions.push({
          id: `ai-${Date.now()}-4`,
          pageNumber: 1,
          x: 52,
          y: 58,
          width: 25,
          height: 8,
          shape: 'rectangle',
          color: '#FF5722',
          annotation: 'Color temperature',
        });
      }

      if (prompt.includes('feature') || prompt.includes('specification') || prompt.includes('spec')) {
        newRegions.push({
          id: `ai-${Date.now()}-5`,
          pageNumber: 1,
          x: 10,
          y: 28,
          width: 35,
          height: 20,
          shape: 'rectangle',
          color: '#E91E63',
          annotation: 'Features section',
        });
      }

      if (prompt.includes('install') || prompt.includes('mounting')) {
        newRegions.push({
          id: `ai-${Date.now()}-6`,
          pageNumber: 1,
          x: 10,
          y: 42,
          width: 35,
          height: 10,
          shape: 'rectangle',
          color: '#9C27B0',
          annotation: 'Installation info',
        });
      }

      // If no specific keywords matched, add a generic highlight
      if (newRegions.length === 0) {
        // Simulate AI finding the most relevant section
        newRegions.push({
          id: `ai-${Date.now()}-generic`,
          pageNumber: 1,
          x: 10,
          y: 15,
          width: 40,
          height: 15,
          shape: 'rectangle',
          color: '#FFEB3B',
          annotation: `AI found: "${aiHighlightPrompt}"`,
        });
      }

      // Add the AI-generated regions to drawing regions
      setDrawingRegions(prev => [...prev, ...newRegions]);
      setAiHighlightPrompt('');

      // Navigate to the page with highlights if not already there
      if (newRegions.length > 0 && newRegions[0].pageNumber !== currentPage) {
        setCurrentPage(newRegions[0].pageNumber);
      }
    } catch (error) {
      setAiError('Failed to process AI highlighting. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-[95vw] h-[95vh] max-w-[1800px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Spec Sheet Viewer
            </h2>
            <span className="text-sm text-[var(--muted-foreground)]">
              {specSheet.manufacturer}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--muted)] rounded-lg">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="p-1 hover:bg-[var(--background)] rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10h10" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="text-sm text-[var(--foreground)] w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-1 hover:bg-[var(--background)] rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Page Thumbnails */}
          <div className="w-28 border-r border-[var(--border)] bg-[var(--muted)]/20 overflow-y-auto p-3 space-y-2">
            <Document
              file={DEMO_PDF_PATH}
              onLoadSuccess={() => {}}
              loading={null}
              error={null}
            >
              {!pdfLoading && numPages > 0 && Array.from({ length: numPages }).map((_, index) => {
                const pageNum = index + 1;
                const pageHighlightCount = getPageHighlightCount(pageNum);

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-full bg-white border rounded-lg shadow-sm transition-all relative overflow-hidden mb-2 ${
                      currentPage === pageNum
                        ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]'
                        : 'border-[var(--border)] hover:shadow-md'
                    }`}
                  >
                    <Page
                      pageNumber={pageNum}
                      width={76}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {pageNum}
                    </div>
                    {pageHighlightCount > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {pageHighlightCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </Document>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-[var(--muted)]/30 p-6 flex justify-center">
            <Document
              file={DEMO_PDF_PATH}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="w-10 h-10 border-3 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin mb-4" />
                  <span className="text-sm text-[var(--muted-foreground)]">Loading PDF...</span>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-96 text-red-500">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span className="text-sm">Failed to load PDF</span>
                </div>
              }
            >
              <div
                className="relative bg-white shadow-xl rounded overflow-hidden"
                style={{
                  width: pageSize.width * (zoom / 100),
                  height: pageSize.height * (zoom / 100),
                }}
              >
                <Page
                  pageNumber={currentPage}
                  scale={zoom / 100}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={onPageLoadSuccess}
                />

                {/* Always-on Highlight Canvas for Drawing and Interaction */}
                <div className="absolute inset-0">
                  <HighlightCanvas
                    width={pageSize.width * (zoom / 100)}
                    height={pageSize.height * (zoom / 100)}
                    regions={allRegions}
                    onRegionsChange={handleRegionsChange}
                    activeTool={activeTool}
                    activeColor={activeColor}
                    strokeWidth={2}
                    pageNumber={currentPage}
                    zoom={zoom}
                    selectedRegionId={selectedRegionId || undefined}
                    onRegionSelect={setSelectedRegionId}
                  />
                </div>
              </div>
            </Document>
          </div>

          {/* Right Sidebar - Details & Tools */}
          <div className="w-80 border-l border-[var(--border)] bg-[var(--card)] flex flex-col overflow-y-auto">
            {/* Details Section - Collapsible */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('details')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Details</h3>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${sectionsExpanded.details ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {sectionsExpanded.details && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Editable Spec Sheet Name */}
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Spec Sheet Name</label>
                    {isEditingSpecSheetName ? (
                      <input
                        type="text"
                        value={editableSpecSheetName}
                        onChange={(e) => setEditableSpecSheetName(e.target.value)}
                        onBlur={() => setIsEditingSpecSheetName(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsEditingSpecSheetName(false);
                          if (e.key === 'Escape') {
                            setEditableSpecSheetName(specSheet.displayName);
                            setIsEditingSpecSheetName(false);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => setIsEditingSpecSheetName(true)}
                        className="flex items-center justify-between px-2 py-1 text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                      >
                        <span className="truncate">{editableSpecSheetName}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 ml-2 text-[var(--muted-foreground)]">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Static Info */}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Manufacturer</span>
                    <span className="text-[var(--foreground)]">{specSheet.manufacturer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Pages</span>
                    <span className="text-[var(--foreground)]">{numPages}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">File Size</span>
                    <span className="text-[var(--foreground)]">{formatFileSize(specSheet.fileSize)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Tools - Collapsible */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('tools')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Highlight Tools</h3>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${sectionsExpanded.tools ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {sectionsExpanded.tools && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] w-12">Tool:</span>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setActiveTool('select')}
                        className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                          activeTool === 'select'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                        title="Select, move, and resize highlights"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                        </svg>
                        Select
                      </button>
                      {(['rectangle', 'oval'] as HighlightShape[]).map(tool => (
                        <button
                          key={tool}
                          onClick={() => {
                            setActiveTool(tool);
                            setSelectedRegionId(null);
                          }}
                          className={`flex-1 px-2 py-1.5 text-xs rounded capitalize transition-colors ${
                            activeTool === tool
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                          }`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] mb-2 block">Color:</span>
                    <div className="flex gap-2 flex-wrap">
                      {['#FFEB3B', '#FF5722', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'].map(color => (
                        <button
                          key={color}
                          onClick={() => setActiveColor(color)}
                          className={`w-8 h-8 rounded-full transition-all border-2 ${
                            activeColor === color
                              ? 'ring-2 ring-offset-2 ring-[var(--primary)] border-white shadow-lg scale-110'
                              : 'border-gray-200 hover:scale-105 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color === '#FFEB3B' ? 'Yellow' : color === '#FF5722' ? 'Orange' : color === '#4CAF50' ? 'Green' : color === '#2196F3' ? 'Blue' : color === '#E91E63' ? 'Pink' : 'Purple'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Unsaved indicator and actions */}
                  {hasUnsavedChanges && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2 text-xs text-yellow-600 mb-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 8v4M12 16h.01"/>
                        </svg>
                        <span>{drawingRegions.length} unsaved highlight{drawingRegions.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearDrawing}
                          className="flex-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleUpdateVersion}
                          className="flex-1 px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Save to Version
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Versions Section - Collapsible */}
            <div className="border-b border-[var(--border)]">
              <div
                onClick={() => toggleSection('versions')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Versions</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">{versions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSaveModal(true); }}
                    className="text-xs px-2 py-1 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    + New
                  </button>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${sectionsExpanded.versions ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              {sectionsExpanded.versions && (
                <div className="px-4 pb-4 space-y-2 max-h-40 overflow-y-auto">
                  {versions.map(version => (
                    <div
                      key={version.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        version.id === selectedVersionId
                          ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
                          : 'bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50'
                      }`}
                      onClick={() => handleVersionSelect(version.id)}
                    >
                      {editingVersionId === version.id ? (
                        <input
                          type="text"
                          value={editingVersionName}
                          onChange={(e) => setEditingVersionName(e.target.value)}
                          onBlur={() => handleRenameVersion(version.id, editingVersionName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameVersion(version.id, editingVersionName);
                            if (e.key === 'Escape') {
                              setEditingVersionId(null);
                              setEditingVersionName('');
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-0.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[var(--foreground)] truncate">{version.name}</div>
                            <div className="text-[10px] text-[var(--muted-foreground)]">
                              {version.regions.length} highlights
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVersionId(version.id);
                                setEditingVersionName(version.name);
                              }}
                              className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                              title="Rename"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            {versions.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVersion(version.id);
                                }}
                                className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                title="Delete"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Section - Collapsible (only visible when a region is selected) */}
            {selectedRegionId && (
              <div className="border-b border-[var(--border)]">
                <button
                  onClick={() => toggleSection('tags')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Tags</h3>
                    {selectedRegion?.tags && selectedRegion.tags.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                        {selectedRegion.tags.length}
                      </span>
                    )}
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${sectionsExpanded.tags ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {sectionsExpanded.tags && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Add tags to categorize this highlight
                    </p>

                    {/* Tag input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Enter tag name..."
                        className="flex-1 px-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                        className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>

                    {/* Display tags */}
                    {selectedRegion?.tags && selectedRegion.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRegion.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--muted)] text-[var(--foreground)] rounded-full"
                          >
                            <span>{tag}</span>
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500 transition-colors"
                              title="Remove tag"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)] italic">No tags added yet</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Highlight Section - Collapsible */}
            <div className="border-b border-[var(--border)] bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10">
              <button
                onClick={() => toggleSection('aiHighlight')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Highlight</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-medium">Beta</span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${sectionsExpanded.aiHighlight ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {sectionsExpanded.aiHighlight && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Describe what you want to highlight and AI will find it on the spec sheet.
                  </p>
                  <textarea
                    value={aiHighlightPrompt}
                    onChange={(e) => setAiHighlightPrompt(e.target.value)}
                    placeholder="e.g., &quot;Highlight the wattage and lumen output&quot; or &quot;Find the product dimensions&quot;"
                    className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg resize-none placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    rows={2}
                    disabled={isAiProcessing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiHighlight();
                      }
                    }}
                  />
                  <button
                    onClick={handleAiHighlight}
                    disabled={!aiHighlightPrompt.trim() || isAiProcessing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAiProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing PDF...</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span>Highlight with AI</span>
                      </>
                    )}
                  </button>
                  {aiError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                      </svg>
                      {aiError}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-[var(--muted-foreground)]">Try:</span>
                    {['wattage', 'dimensions', 'lumens', 'CCT'].map(term => (
                      <button
                        key={term}
                        onClick={() => setAiHighlightPrompt(`Highlight the ${term}`)}
                        className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded transition-colors"
                        disabled={isAiProcessing}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer - Page Navigation */}
        <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 hover:bg-[var(--muted)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-sm text-[var(--foreground)]">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{numPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage === numPages}
            className="p-2 hover:bg-[var(--muted)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Save Version Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Save as New Version</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              This will create a new version with {savedRegions.length + drawingRegions.length} highlights.
            </p>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Version name (e.g., 'Electrical Specs')"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewVersionName('');
                }}
                className="flex-1 px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={!newVersionName.trim()}
                className="flex-1 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
